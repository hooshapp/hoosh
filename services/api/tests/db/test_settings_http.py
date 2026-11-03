import time
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Event
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, insert
from sqlalchemy.exc import IntegrityError

from app.models import UserSettings
from app.repositories.settings import read_own_settings, save_own_settings
from app.schemas.settings import ActivityPreferences, SettingsPatch
from tests.auth.support import settings
from tests.support import database
from tests.support.http import authenticated_app
from tests.support.profiles import headers
from tests.support.profiles import snapshot as profile_snapshot
from tests.support.schema import validate_observed_response

pytestmark = pytest.mark.database
ACTIVITIES = {"selected_activity_ids": ["reading"], "custom_text": "Read a page"}
DRAFT = {
    "weekdays": [0, 2],
    "hours": {"start_local": "22:30", "end_local": "07:00", "next_day": True},
    "timezone_id": "America/New_York",
    "session_count": 2,
    "session_minutes": None,
}


def request(client, signer, owner, revision, **sections):
    response = client.patch(
        "/v1/settings",
        headers=headers(signer, owner),
        json={"expected_revision": revision, **sections},
    )
    validate_observed_response(response)
    return response


def read(client, signer, owner):
    response = client.get("/v1/settings", headers=headers(signer, owner))
    validate_observed_response(response)
    assert response.status_code == 200
    return response.json()["settings"]


def snapshot(environment, identities):
    with database.connect(environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        return admin.execute(
            "SELECT * FROM public.user_settings WHERE user_id=ANY(%s) ORDER BY user_id",
            ([identity.user_id for identity in identities],),
        ).fetchall()


def test_absent_get_does_not_insert_or_require_profile(
    profile_client, profile_accounts, db_environment
):
    client, resource, signer = profile_client
    for owner in profile_accounts:
        assert read(client, signer, owner) is None
    assert snapshot(db_environment, profile_accounts) == []
    assert resource.engine.pool.checkedout() == 0


def test_section_replace_omit_clear_noop_and_canonical_round_trip(
    profile_client, profile_accounts, db_environment
):
    client, resource, signer = profile_client
    owner = profile_accounts[2]
    profiles = profile_snapshot(db_environment, profile_accounts)
    first = request(
        client, signer, owner, 0, activities={**ACTIVITIES, "custom_text": "\u001c Read 🦖 \u0085"}
    ).json()["settings"]
    assert first["activities"]["custom_text"] == "Read 🦖" and first["plan_draft"] is None
    second = request(client, signer, owner, 1, plan_draft={**DRAFT, "weekdays": [2, 0]}).json()[
        "settings"
    ]
    assert second["activities"] == first["activities"] and second["plan_draft"] == DRAFT
    third = request(client, signer, owner, 2, activities=None).json()["settings"]
    assert (
        third["activities"] == {"selected_activity_ids": [], "custom_text": None}
        and third["plan_draft"] == DRAFT
    )
    fourth = request(client, signer, owner, 3, plan_draft=None).json()["settings"]
    assert fourth["activities"] == third["activities"] and fourth["plan_draft"] is None
    fifth = request(client, signer, owner, 4, activities=None, plan_draft=None).json()["settings"]
    assert [v["revision"] for v in [first, second, third, fourth, fifth]] == [1, 2, 3, 4, 5]
    assert len({v["created_at"] for v in [first, second, third, fourth, fifth]}) == 1
    assert all(
        v["created_at"].endswith("Z") and v["updated_at"].endswith("Z")
        for v in [first, second, third]
    )
    assert read(client, signer, owner) == fifth
    assert profile_snapshot(db_environment, profile_accounts) == profiles
    assert resource.engine.pool.checkedout() == 0


@pytest.mark.parametrize("section", ["activities", "plan_draft"])
def test_initial_create_uses_neutral_defaults_only_for_omitted_sections(
    profile_client, profile_accounts, section
):
    client, _, signer = profile_client
    value = ACTIVITIES if section == "activities" else DRAFT
    response = request(client, signer, profile_accounts[2], 0, **{section: value})
    assert response.status_code == 200
    row = response.json()["settings"]
    assert row["activities"] == (
        value if section == "activities" else {"selected_activity_ids": [], "custom_text": None}
    )
    assert row["plan_draft"] == (value if section == "plan_draft" else None)


@pytest.mark.parametrize("initial", [False, True])
def test_simultaneous_section_edits_have_one_winner_and_deliberate_retry_preserves_it(
    db_settings, monkeypatch, profile_accounts, resource, initial
):
    owner = profile_accounts[2]
    if not initial:
        with resource.transaction(owner) as session:
            session.add(UserSettings(user_id=owner.user_id))
    expected = 0 if initial else 1
    app, auth = authenticated_app(
        monkeypatch,
        settings(**(db_settings.model_dump(exclude_none=True) | {"db_pool_size": 2})),
        claims={"sub": str(owner.user_id)},
    )
    barrier, pids = Barrier(2), set()
    with TestClient(app) as client:

        def contend(connection, cursor, statement, parameters, context, executemany):
            if statement.startswith(
                ("INSERT INTO public.user_settings", "UPDATE public.user_settings")
            ):
                pids.add(connection.connection.driver_connection.info.backend_pid)
                barrier.wait(timeout=5)

        event.listen(app.state.database.engine, "before_cursor_execute", contend)
        edits = [{"activities": ACTIVITIES}, {"plan_draft": DRAFT}]

        def write(edit):
            return edit, client.patch(
                "/v1/settings", headers=auth, json={"expected_revision": expected, **edit}
            )

        try:
            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(write, edits))
        finally:
            event.remove(app.state.database.engine, "before_cursor_execute", contend)
        assert len(pids) == 2 and sorted(r.status_code for _, r in responses) == [200, 409]
        for _, response in responses:
            validate_observed_response(response)
        winner = next(edit for edit, response in responses if response.status_code == 200)
        loser, conflict = next(
            (edit, response) for edit, response in responses if response.status_code == 409
        )
        assert conflict.json()["error"]["code"] == "SETTINGS_CONFLICT"
        assert conflict.json()["error"]["details"] == {"current_revision": expected + 1}
        observed = client.get("/v1/settings", headers=auth).json()["settings"]
        for field, value in winner.items():
            assert observed[field] == value
        retried = client.patch(
            "/v1/settings", headers=auth, json={"expected_revision": expected + 1, **loser}
        )
        assert retried.status_code == 200
        row = retried.json()["settings"]
        assert (
            row["revision"] == expected + 2
            and row["activities"] == ACTIVITIES
            and row["plan_draft"] == DRAFT
        )
        assert app.state.database.engine.pool.checkedout() == 0


def test_cross_account_selectors_and_stale_revisions_cannot_modify_another_owner(
    profile_client, profile_accounts, db_environment
):
    client, _, signer = profile_client
    a, b, c = profile_accounts
    assert request(client, signer, a, 0, activities=ACTIVITIES).status_code == 200
    assert request(client, signer, b, 0, plan_draft=DRAFT).status_code == 200
    before = snapshot(db_environment, profile_accounts)
    conflict = request(client, signer, c, 1, activities=None)
    assert conflict.status_code == 409 and conflict.json()["error"]["details"] == {
        "current_revision": 0
    }
    rejected = client.patch(
        "/v1/settings",
        headers=headers(signer, a),
        json={"expected_revision": 1, "activities": None, "user_id": str(b.user_id)},
    )
    assert rejected.status_code == 422 and str(b.user_id) not in rejected.text
    stale = client.patch(
        f"/v1/settings?user_id={b.user_id}",
        headers={**headers(signer, a), "X-User-ID": str(b.user_id)},
        json={"expected_revision": 0, "activities": None},
    )
    assert stale.status_code == 409 and stale.json()["error"]["details"] == {"current_revision": 1}
    selected = client.get(f"/v1/settings?user_id={b.user_id}", headers=headers(signer, a))
    assert selected.json()["settings"]["user_id"] == str(a.user_id)
    assert snapshot(db_environment, profile_accounts) == before


@pytest.mark.parametrize("existing", [False, True])
def test_possible_commit_replay_never_increments_or_overwrites(
    profile_client, profile_accounts, existing
):
    client, _, signer = profile_client
    owner = profile_accounts[2]
    if existing:
        assert request(client, signer, owner, 0, activities=None).status_code == 200
    # Intentionally discard the transport's successful write response; GET reconciles it.
    accepted = request(client, signer, owner, int(existing), activities=ACTIVITIES)
    assert accepted.status_code == 200
    replay = request(client, signer, owner, int(existing), activities=None)
    assert replay.status_code == 409
    assert read(client, signer, owner) == accepted.json()["settings"]


@pytest.mark.parametrize("existing", [False, True])
def test_failure_after_write_rolls_back_without_leaking_data(
    profile_client, profile_accounts, db_environment, monkeypatch, caplog, existing
):
    client, resource, signer = profile_client
    owner = profile_accounts[2]
    if existing:
        request(client, signer, owner, 0, activities=None)
    before = snapshot(db_environment, profile_accounts)
    original = save_own_settings

    def fail_after_write(session, body):
        original(session, body)
        raise RuntimeError("private-after-write-marker")

    monkeypatch.setattr("app.api.v1.settings.save_own_settings", fail_after_write)
    response = request(client, signer, owner, int(existing), activities=ACTIVITIES)
    assert response.status_code == 500 and response.json()["error"]["code"] == "INTERNAL_ERROR"
    assert "private-after-write-marker" not in response.text + caplog.text
    assert (
        snapshot(db_environment, profile_accounts) == before
        and resource.engine.pool.checkedout() == 0
    )


def test_deleted_auth_owner_cannot_be_recreated_with_a_still_valid_jwt(
    profile_client, profile_accounts, db_environment
):
    client, _, signer = profile_client
    owner = profile_accounts[2]
    assert request(client, signer, owner, 0, activities=None).status_code == 200
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (owner.user_id,))
    assert client.get("/v1/me", headers=headers(signer, owner)).status_code == 200
    assert read(client, signer, owner) is None
    stale = request(client, signer, owner, 1, activities=None)
    assert stale.status_code == 409 and stale.json()["error"]["details"] == {"current_revision": 0}
    create = request(client, signer, owner, 0, activities=None)
    assert create.status_code == 403 and create.json()["error"]["code"] == "FORBIDDEN"


def test_actual_deletion_insert_race_maps_only_the_owner_fk(
    profile_client, profile_accounts, db_environment
):
    client, resource, signer = profile_client
    owner = profile_accounts[2]
    entered, pids = Event(), []

    def inserting(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("INSERT INTO public.user_settings"):
            pids.append(connection.connection.driver_connection.info.backend_pid)
            entered.set()

    event.listen(resource.engine, "before_cursor_execute", inserting)
    try:
        with ThreadPoolExecutor(max_workers=1) as pool:
            with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
                with admin.transaction():
                    admin.execute("DELETE FROM auth.users WHERE id=%s", (owner.user_id,))
                    pending = pool.submit(request, client, signer, owner, 0, activities=None)
                    assert entered.wait(timeout=3)
                    waited = False
                    deadline = time.monotonic() + 3
                    while time.monotonic() < deadline:
                        row = admin.execute(
                            "SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s", (pids[0],)
                        ).fetchone()
                        if row and row[0] == "Lock":
                            waited = True
                            break
                        time.sleep(0.01)
                    assert waited and not pending.done()
                response = pending.result(timeout=5)
        assert response.status_code == 403 and resource.engine.pool.checkedout() == 0
    finally:
        event.remove(resource.engine, "before_cursor_execute", inserting)


def test_unrelated_storage_constraint_is_not_reclassified_as_missing_owner(
    resource, profile_accounts
):
    patch = SettingsPatch.model_construct(
        expected_revision=0,
        activities=ActivityPreferences.model_construct(selected_activity_ids=[], custom_text=" "),
    )
    with (
        pytest.raises(IntegrityError) as error,
        resource.transaction(profile_accounts[2]) as session,
    ):
        save_own_settings(session, patch)
    assert error.value.orig.sqlstate == "23514"
    with resource.transaction(profile_accounts[2]) as session:
        assert read_own_settings(session) is None


def test_storage_revision_exhaustion_never_wraps(profile_client, profile_accounts, resource):
    client, _, signer = profile_client
    owner = profile_accounts[2]
    with resource.transaction(owner) as session:
        session.add(UserSettings(user_id=owner.user_id, revision=2147483647))
    response = request(client, signer, owner, 2147483647, activities=None)
    assert response.status_code == 422
    assert read(client, signer, owner)["revision"] == 2147483647


def test_database_pool_outage_is_not_absence_and_cannot_autoreplay_a_settings_write(
    db_settings, monkeypatch, profile_accounts
):
    owner = profile_accounts[2]
    app, auth = authenticated_app(
        monkeypatch,
        settings(**(db_settings.model_dump(exclude_none=True) | {"db_pool_timeout_seconds": 0.08})),
        claims={"sub": str(owner.user_id)},
    )
    with TestClient(app) as client:
        with app.state.database.transaction(owner):
            for method in ("GET", "PATCH"):
                response = client.request(
                    method,
                    "/v1/settings",
                    headers=auth,
                    **(
                        {"json": {"expected_revision": 0, "activities": ACTIVITIES}}
                        if method == "PATCH"
                        else {}
                    ),
                )
                assert (
                    response.status_code == 503
                    and response.json()["error"]["code"] == "DEPENDENCY_UNAVAILABLE"
                )
                validate_observed_response(response)
            assert client.get("/v1/me", headers=auth).status_code == 200
        assert client.get("/v1/settings", headers=auth).json() == {"settings": None}
        assert app.state.database.engine.pool.checkedout() == 0


def test_deferred_commit_failure_cannot_return_success_or_persist_settings(
    profile_client, profile_accounts, db_environment, monkeypatch, probe, caplog
):
    client, resource, signer = profile_client
    owner = profile_accounts[2]
    original = save_own_settings

    def defer_failure(session, body):
        row = original(session, body)
        session.execute(insert(probe).values(id=uuid4(), parent_id=uuid4(), value="PRIVATE_COMMIT"))
        return row

    monkeypatch.setattr("app.api.v1.settings.save_own_settings", defer_failure)
    response = request(client, signer, owner, 0, activities=ACTIVITIES)
    assert response.status_code == 500
    assert "PRIVATE_COMMIT" not in response.text + caplog.text
    assert snapshot(db_environment, profile_accounts) == []
    assert resource.engine.pool.checkedout() == 0
