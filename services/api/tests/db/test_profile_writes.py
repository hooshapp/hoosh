import time
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Event

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, select, text, update
from sqlalchemy.exc import IntegrityError

from app.models import Profile
from app.repositories.profiles import read_own_profile, save_own_profile
from app.schemas.profiles import ProfilePatch
from tests.auth.support import settings
from tests.support import database
from tests.support.http import authenticated_app
from tests.support.profiles import headers, snapshot
from tests.support.schema import validate_observed_response

pytestmark = pytest.mark.database


def patch(client, signer, identity, revision, name):
    response = client.patch(
        "/v1/profile",
        headers=headers(signer, identity),
        json={"expected_revision": revision, "display_name": name},
    )
    validate_observed_response(response)
    return response


def test_create_edit_clear_refetch_and_server_clocks(profile_client, profile_accounts):
    client, resource, signer = profile_client
    identity = profile_accounts[2]
    created = patch(client, signer, identity, 0, "\u001c  New 😀  \u0085")
    assert created.status_code == 200
    first = created.json()["profile"]
    assert first["display_name"] == "New 😀" and first["revision"] == 1
    updated = patch(client, signer, identity, 1, " Next ").json()["profile"]
    cleared = patch(client, signer, identity, 2, None).json()["profile"]
    assert updated["revision"] == 2 and updated["display_name"] == "Next"
    assert cleared["revision"] == 3 and cleared["display_name"] is None
    assert first["created_at"] == updated["created_at"] == cleared["created_at"]
    assert first["updated_at"] <= updated["updated_at"] <= cleared["updated_at"]
    assert client.get("/v1/profile", headers=headers(signer, identity)).json()["profile"] == cleared
    assert resource.engine.pool.checkedout() == 0


@pytest.mark.parametrize(
    "name", ["😀" * 80, " e\u0301 " * 1, "\ufeffname\ufeff", " " * 100 + "x" * 80]
)
def test_unicode_boundary_and_canonical_values_are_persisted(
    profile_client, profile_accounts, name
):
    client, _, signer = profile_client
    response = patch(client, signer, profile_accounts[2], 0, name)
    assert response.status_code == 200
    assert response.json()["profile"]["display_name"] == name.strip()


@pytest.mark.parametrize(
    "revision,account,current", [(0, 0, 1), (1, 2, 0), (99, 0, 1), (10**100, 0, 1)]
)
def test_conflict_reports_only_own_current_revision_and_never_mutates(
    profile_client, profile_accounts, db_environment, revision, account, current
):
    client, _, signer = profile_client
    before = snapshot(db_environment, profile_accounts)
    response = patch(client, signer, profile_accounts[account], revision, "Must not save")
    assert response.status_code == 409
    assert response.json()["error"]["details"] == {"current_revision": current}
    assert "Must not save" not in response.text
    assert snapshot(db_environment, profile_accounts) == before


@pytest.mark.parametrize("initial", [False, True])
def test_actual_simultaneous_creates_and_updates_have_exactly_one_winner(
    db_settings, monkeypatch, profile_accounts, initial
):
    identity = profile_accounts[2] if initial else profile_accounts[0]
    expected, final = (0, 1) if initial else (1, 2)
    config = settings(**(db_settings.model_dump(exclude_none=True) | {"db_pool_size": 2}))
    app, auth = authenticated_app(monkeypatch, config, claims={"sub": str(identity.user_id)})
    barrier, pids = Barrier(2), set()
    with TestClient(app) as client:

        def synchronize(connection, cursor, statement, parameters, context, executemany):
            if statement.startswith(("INSERT INTO public.profiles", "UPDATE public.profiles")):
                pids.add(connection.connection.driver_connection.info.backend_pid)
                barrier.wait(timeout=5)

        event.listen(app.state.database.engine, "before_cursor_execute", synchronize)

        def save(name):
            return name, client.patch(
                "/v1/profile",
                headers=auth,
                json={"expected_revision": expected, "display_name": name},
            )

        try:
            with ThreadPoolExecutor(max_workers=2) as executor:
                responses = list(executor.map(save, ["Concurrent A", "Concurrent B"]))
        finally:
            event.remove(app.state.database.engine, "before_cursor_execute", synchronize)
        assert len(pids) == 2  # Prove contention used two real PostgreSQL transactions.
        assert sorted(response.status_code for _, response in responses) == [200, 409]
        for _, response in responses:
            validate_observed_response(response)
        winner = next(name for name, response in responses if response.status_code == 200)
        conflict = next(response for _, response in responses if response.status_code == 409)
        assert conflict.json()["error"]["details"] == {"current_revision": final}
        saved = client.get("/v1/profile", headers=auth).json()["profile"]
        assert saved["display_name"] == winner and saved["revision"] == final
        assert app.state.database.engine.pool.checkedout() == 0


@pytest.mark.parametrize("initial", [False, True])
def test_lost_success_response_replay_conflicts_without_overwriting_or_incrementing(
    profile_client, profile_accounts, initial
):
    client, _, signer = profile_client
    identity = profile_accounts[2] if initial else profile_accounts[0]
    expected = 0 if initial else 1
    # Discard a genuine committed success as if the transport lost its response.
    accepted = patch(client, signer, identity, expected, "Accepted once")
    assert accepted.status_code == 200
    replay = patch(client, signer, identity, expected, "Must not replay")
    assert replay.status_code == 409
    observed = client.get("/v1/profile", headers=headers(signer, identity))
    assert observed.json() == accepted.json()


def test_a_b_edits_and_forged_owner_inputs_cannot_cross_accounts(profile_client, profile_accounts):
    client, _, signer = profile_client
    a, b, _ = profile_accounts
    assert patch(client, signer, a, 1, "Own A").status_code == 200
    assert patch(client, signer, b, 1, "Own B").status_code == 200
    response = client.patch(
        f"/v1/profile?user_id={b.user_id}",
        headers={**headers(signer, a), "X-User-ID": str(b.user_id)},
        json={"expected_revision": 2, "display_name": "A via verified scope"},
    )
    assert response.json()["profile"]["user_id"] == str(a.user_id)
    rejected = client.patch(
        "/v1/profile",
        headers=headers(signer, a),
        json={"expected_revision": 3, "display_name": "Wrong", "user_id": str(b.user_id)},
    )
    assert rejected.status_code == 422 and str(b.user_id) not in rejected.text
    own_conflict = client.patch(
        f"/v1/profile?user_id={b.user_id}",
        headers=headers(signer, a),
        json={"expected_revision": 2, "display_name": "Wrong revision"},
    )
    assert own_conflict.status_code == 409
    assert own_conflict.json()["error"]["details"] == {"current_revision": 3}
    assert (
        client.get("/v1/profile", headers=headers(signer, b)).json()["profile"]["display_name"]
        == "Own B"
    )


@pytest.mark.parametrize("initial", [False, True])
def test_failure_after_actual_mutation_rolls_back_create_or_update(
    profile_client, profile_accounts, db_environment, monkeypatch, caplog, initial
):
    client, resource, signer = profile_client
    identity = profile_accounts[2] if initial else profile_accounts[0]
    before = snapshot(db_environment, profile_accounts)
    original = save_own_profile

    def fail_after_write(session, body):
        original(session, body)
        raise RuntimeError("private-after-write-marker")

    monkeypatch.setattr("app.api.v1.profiles.save_own_profile", fail_after_write)
    response = patch(client, signer, identity, 0 if initial else 1, "Must roll back")
    assert response.status_code == 500
    assert "private-after-write-marker" not in response.text + caplog.text
    assert snapshot(db_environment, profile_accounts) == before
    assert resource.engine.pool.checkedout() == 0


def test_actual_deleted_owner_insert_race_is_forbidden_without_token_revocation(
    profile_client, profile_accounts, db_environment, caplog
):
    client, resource, signer = profile_client
    identity = profile_accounts[2]
    entered, pids = Event(), []

    def entered_insert(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("INSERT INTO public.profiles"):
            pids.append(connection.connection.driver_connection.info.backend_pid)
            entered.set()

    event.listen(resource.engine, "before_cursor_execute", entered_insert)
    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
                with admin.transaction():
                    admin.execute("DELETE FROM auth.users WHERE id=%s", (identity.user_id,))
                    pending = executor.submit(
                        patch, client, signer, identity, 0, "Must not recreate"
                    )
                    assert entered.wait(timeout=3)
                    deadline, waited = time.monotonic() + 3, False
                    while time.monotonic() < deadline:
                        row = admin.execute(
                            "SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s", (pids[0],)
                        ).fetchone()
                        if row and row[0] == "Lock":
                            waited = True
                            break
                        time.sleep(0.01)
                    assert len(pids) == 1
                    assert waited and not pending.done()  # Real FK wait, not sequential simulation.
                # Commit the deletion while the actual insert is waiting on its FK.
                response = pending.result(timeout=5)
        assert response.status_code == 403 and response.json()["error"]["code"] == "FORBIDDEN"
        assert "Must not recreate" not in response.text + caplog.text
        assert client.get("/v1/me", headers=headers(signer, identity)).status_code == 200
        assert client.get("/v1/profile", headers=headers(signer, identity)).json() == {
            "profile": None
        }
        assert resource.engine.pool.checkedout() == 0
    finally:
        event.remove(resource.engine, "before_cursor_execute", entered_insert)


def test_deleted_existing_row_update_is_absent_conflict_not_missing_owner_insert(
    profile_client, profile_accounts, db_environment
):
    client, _, signer = profile_client
    identity = profile_accounts[0]
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (identity.user_id,))
    response = patch(client, signer, identity, 1, "No row")
    assert response.status_code == 409
    assert response.json()["error"]["details"] == {"current_revision": 0}


def test_unrelated_real_check_failure_is_not_mapped_to_forbidden(resource, profile_accounts):
    # Deliberately bypass only DTO validation; actual PostgreSQL must retain its error category.
    invalid = ProfilePatch.model_construct(expected_revision=0, display_name=" ")
    with pytest.raises(IntegrityError) as error:
        with resource.transaction(profile_accounts[2]) as session:
            save_own_profile(session, invalid)
    assert error.value.orig.sqlstate == "23514"
    with resource.transaction(profile_accounts[2]) as session:
        assert read_own_profile(session) is None


def test_storage_revision_exhaustion_conflicts_without_wrap_or_mutation(
    profile_client, profile_accounts, resource
):
    identity = profile_accounts[0]
    with resource.transaction(identity) as session:
        session.execute(update(Profile).values(revision=2_147_483_647))
    client, _, signer = profile_client
    response = patch(client, signer, identity, 2_147_483_647, "Must not wrap")
    assert response.status_code == 409
    assert response.json()["error"]["details"] == {"current_revision": 2_147_483_647}
    with resource.transaction(identity) as session:
        assert session.scalar(select(Profile.revision)) == 2_147_483_647


def test_write_unit_uses_explicit_read_committed_for_conflict_snapshot(resource, profile_accounts):
    with resource.transaction(profile_accounts[2]) as session:
        assert session.scalar(text("SHOW transaction_isolation")) == "read committed"
