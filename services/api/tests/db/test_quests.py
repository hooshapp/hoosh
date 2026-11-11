import json
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, text
from sqlalchemy.exc import IntegrityError, ProgrammingError

from app.db.migrations import MigrationSafetyError, verify
from app.models.quest import UserQuest
from tests.auth.support import settings
from tests.support import database
from tests.support.http import authenticated_app
from tests.support.profiles import headers
from tests.support.schema import ROOT, wire_validator

pytestmark = pytest.mark.database
DEFINITION = json.loads((ROOT / "packages/contracts/fixtures/quests-v1.json").read_text())[
    "definition"
]


def put(client, signer, owner, id, revision, definition=None):
    return client.put(
        "/v1/quests/" + str(id),
        headers=headers(signer, owner),
        json={
            "expected_revision": revision,
            "definition": definition or DEFINITION,
        },
    )


def get(client, signer, owner, id):
    response = client.get("/v1/quests/" + str(id), headers=headers(signer, owner))
    assert response.status_code == 200
    wire_validator("QuestResponse").validate(response.json())
    return response.json()["quest"]


def delete(client, signer, owner, id, revision):
    return client.request(
        "DELETE",
        "/v1/quests/" + str(id),
        headers=headers(signer, owner),
        json={"expected_revision": revision},
    )


def test_real_crud_revision_conflict_tombstone_and_isolation(profile_client, profile_accounts):
    client, resource, signer = profile_client
    a, b, _ = profile_accounts
    id = uuid4()
    assert get(client, signer, a, id) is None
    first = put(client, signer, a, id, 0).json()["quest"]
    assert first["revision"] == 1 and first["definition"] == DEFINITION
    assert get(client, signer, b, id) is None
    assert client.get("/v1/quests/" + str(id), headers=headers(signer, b)).json()["revision"] == 0
    assert delete(client, signer, b, id, 1).status_code == 200
    assert get(client, signer, a, id) == first
    assert put(client, signer, a, id, 0).status_code == 409
    assert put(client, signer, a, id, 1, DEFINITION | {"title": "Updated"}).status_code == 200
    assert delete(client, signer, a, id, 1).status_code == 409
    receipt = delete(client, signer, a, id, 2)
    assert receipt.json()["revision"] == 3
    assert get(client, signer, a, id) is None
    assert client.get("/v1/quests/" + str(id), headers=headers(signer, a)).json()["revision"] == 3
    assert delete(client, signer, a, id, 2).status_code == 200
    # The old create request cannot recreate a deleted record or reset its revision.
    assert put(client, signer, a, id, 0).status_code == 409
    with resource.transaction(a) as session:
        row = session.get(UserQuest, (a.user_id, id))
        assert row.definition is None and row.revision == 3
    assert put(client, signer, b, id, 0).status_code == 200
    assert resource.engine.pool.checkedout() == 0


def test_keyset_pages_are_own_ordered_bounded_and_skip_deleted(profile_client, profile_accounts):
    client, _, signer = profile_client
    a, b, _ = profile_accounts
    ids = sorted([uuid4() for _ in range(5)])
    for id in ids:
        assert put(client, signer, a, id, 0).status_code == 200
    assert put(client, signer, b, uuid4(), 0).status_code == 200
    assert delete(client, signer, a, ids[1], 1).status_code == 200
    seen, cursor = [], None
    for _ in range(3):
        response = client.get(
            "/v1/quests",
            headers=headers(signer, a),
            params={"limit": 2, **({"cursor": cursor} if cursor else {})},
        )
        assert response.status_code == 200
        page = response.json()
        wire_validator("QuestPage").validate(page)
        seen += [UUID(q["quest_id"]) for q in page["quests"]]
        cursor = page["next_cursor"]
        if cursor is None:
            break
    assert seen == [id for id in ids if id != ids[1]]
    assert (
        client.get("/v1/quests", headers=headers(signer, a), params={"limit": 101}).status_code
        == 422
    )


@pytest.mark.parametrize("initial", [False, True])
def test_two_real_connections_have_one_winner(monkeypatch, db_settings, profile_accounts, initial):
    a = profile_accounts[2]
    id = uuid4()
    app, auth = authenticated_app(
        monkeypatch,
        settings(**(db_settings.model_dump(exclude_none=True) | {"db_pool_size": 2})),
        claims={"sub": str(a.user_id)},
    )
    with TestClient(app) as client:
        if initial:
            assert (
                client.put(
                    "/v1/quests/" + str(id),
                    headers=auth,
                    json={"expected_revision": 0, "definition": DEFINITION},
                ).status_code
                == 200
            )
        barrier, pids = Barrier(2), set()

        def intercept(connection, cursor, statement, parameters, context, executemany):
            if statement.startswith(
                ("INSERT INTO public.user_quests", "UPDATE public.user_quests")
            ):
                pids.add(connection.connection.driver_connection.info.backend_pid)
                barrier.wait(timeout=5)

        event.listen(app.state.database.engine, "before_cursor_execute", intercept)
        try:

            def write(title):
                return client.put(
                    "/v1/quests/" + str(id),
                    headers=auth,
                    json={
                        "expected_revision": int(initial),
                        "definition": DEFINITION | {"title": title},
                    },
                )

            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(write, ["One", "Two"]))
        finally:
            event.remove(app.state.database.engine, "before_cursor_execute", intercept)
        assert len(pids) == 2 and sorted(r.status_code for r in responses) == [200, 409]


def test_rls_blocks_unfiltered_cross_owner_and_forged_insert(resource, profile_accounts):
    a, b, _ = profile_accounts
    with resource.transaction(a) as session:
        session.add(UserQuest(user_id=a.user_id, quest_id=uuid4(), definition=DEFINITION))
    with resource.transaction(b) as session:
        assert session.execute(text("SELECT * FROM public.user_quests")).all() == []
    with pytest.raises(ProgrammingError) as denied:
        with resource.transaction(b) as session:
            session.add(UserQuest(user_id=a.user_id, quest_id=uuid4(), definition=DEFINITION))
            session.flush()

    assert denied.value.orig.sqlstate == "42501"


@pytest.mark.parametrize(
    "definition",
    [
        {},
        DEFINITION | {"title": " "},
        DEFINITION | {"weekdays": [0, 0]},
        DEFINITION | {"next_day": True},
        DEFINITION | {"extra": 1},
        DEFINITION | {"repeat": "daily"},
    ],
)
def test_database_rejects_invalid_documents(resource, profile_accounts, definition):
    with pytest.raises(IntegrityError):
        with resource.transaction(profile_accounts[0]) as session:
            session.add(
                UserQuest(
                    user_id=profile_accounts[0].user_id, quest_id=uuid4(), definition=definition
                )
            )
            session.flush()


@pytest.mark.parametrize(
    "mutation",
    [
        "ALTER TABLE public.user_quests DISABLE ROW LEVEL SECURITY",
        "GRANT SELECT ON public.user_quests TO authenticated",
        "ALTER POLICY quests_update_own ON public.user_quests USING (true)",
        "ALTER TABLE public.user_quests DROP CONSTRAINT ck_user_quests_definition_valid",
    ],
)
def test_quest_security_drift_rejected(migration_engine, mutation):
    with migration_engine.connect() as connection:
        tx = connection.begin()
        try:
            connection.execute(text(mutation))
            with pytest.raises(MigrationSafetyError):
                verify(connection)
        finally:
            tx.rollback()


def test_previous_head_upgrade_preserves_profiles_and_settings(migration_engine, profile_accounts):
    from alembic import command
    from app.db.migrations import HEAD, config, run

    with migration_engine.begin() as connection:
        profiles = connection.execute(text("SELECT * FROM public.profiles ORDER BY user_id")).all()
        settings_rows = connection.execute(
            text("SELECT * FROM public.user_settings ORDER BY user_id")
        ).all()
        command.downgrade(config(connection), "20261102_0002")
        assert connection.scalar(text("SELECT to_regclass('public.user_quests')")) is None
        assert run(connection)["revision"] == HEAD
        assert (
            connection.execute(text("SELECT * FROM public.profiles ORDER BY user_id")).all()
            == profiles
        )
        assert (
            connection.execute(text("SELECT * FROM public.user_settings ORDER BY user_id")).all()
            == settings_rows
        )
        assert run(connection, "check")["revision"] == HEAD


def test_local_owner_cascade_removes_definitions_and_tombstones(
    profile_client,
    profile_accounts,
    db_environment,
):
    client, _, signer = profile_client
    owner = profile_accounts[2]
    first, second = uuid4(), uuid4()
    assert put(client, signer, owner, first, 0).status_code == 200
    assert put(client, signer, owner, second, 0).status_code == 200
    assert delete(client, signer, owner, second, 1).status_code == 200
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (owner.user_id,))
        assert (
            admin.execute(
                "SELECT count(*) FROM public.user_quests WHERE user_id=%s", (owner.user_id,)
            ).fetchone()[0]
            == 0
        )
    assert put(client, signer, owner, uuid4(), 0).status_code == 403
