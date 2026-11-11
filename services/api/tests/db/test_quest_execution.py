from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, timedelta
from threading import Barrier
from uuid import uuid4

import pytest
from sqlalchemy import event, select, text
from sqlalchemy.exc import ProgrammingError

from app.core.errors import ApiError
from app.db.engine import Database
from app.db.migrations import MigrationSafetyError, verify
from app.models.quest_execution import QuestOccurrenceOutcome, QuestScheduleVersion
from app.repositories.quest_execution import execution, put_outcome, put_schedule
from app.repositories.quests import delete_own_quest, save_own_quest
from app.schemas.quest_execution import QuestSchedulePut
from app.schemas.quests import QuestPut
from tests.support import database
from tests.support.profiles import headers

pytestmark = pytest.mark.database
NOW = datetime(2026, 11, 11, 12, tzinfo=UTC)
DAY = date(2026, 11, 12)
DEFINITION = {
    "title": "Read",
    "activity": "Read a book",
    "start_local": "10:00",
    "end_local": "11:00",
    "next_day": False,
    "repeat": "daily",
    "weekdays": [],
    "timezone_id": "UTC",
}


def create(resource, owner):
    id = uuid4()
    with resource.transaction(owner) as session:
        save_own_quest(session, id, QuestPut(expected_revision=0, definition=DEFINITION))
    return id


def schedule(resource, owner, id, expected=0, enabled=True, now=NOW, quest_revision=1, first=DAY):
    body = QuestSchedulePut(
        expected_revision=expected,
        quest_revision=quest_revision,
        first_date=first.isoformat(),
        enabled=enabled,
    )
    with resource.transaction(owner) as session:
        return put_schedule(session, id, body, now)


def test_real_schedule_read_restart_and_owner_isolation(resource, profile_accounts):
    a, b, _ = profile_accounts
    id = create(resource, a)
    result = schedule(resource, a, id)
    assert result.revision == 1 and result.enabled
    assert result.occurrences[0].state == "upcoming"
    with resource.transaction(a) as session:
        current = execution(session, id, datetime(2026, 11, 12, 10, 30, tzinfo=UTC))
        assert any(item.state == "active" for item in current.occurrences)
    with resource.transaction(b) as session:
        assert execution(session, id, NOW).revision == 0
        assert session.scalars(select(QuestScheduleVersion)).all() == []


def test_completion_is_after_end_once_only_and_cannot_rewrite_cancelled(resource, profile_accounts):
    a = profile_accounts[0]
    id = create(resource, a)
    schedule(resource, a, id)
    for when in (
        NOW,
        datetime(2026, 11, 12, 10, 30, tzinfo=UTC),
        datetime(2026, 11, 20, 12, tzinfo=UTC),
    ):
        with pytest.raises(ApiError):
            with resource.transaction(a) as session:
                put_outcome(session, id, 1, DAY, "completed", when)
    for _ in range(2):
        with resource.transaction(a) as session:
            assert (
                put_outcome(
                    session, id, 1, DAY, "completed", datetime(2026, 11, 12, 12, tzinfo=UTC)
                ).credits
                == 50
            )
    with resource.transaction(a) as session:
        result = execution(session, id, datetime(2026, 11, 12, 12, tzinfo=UTC))
        assert result.credits == 50 and result.completed_count == 1
    with pytest.raises(ApiError):
        with resource.transaction(a) as session:
            put_outcome(session, id, 1, DAY, "cancelled", NOW)


def test_edit_keeps_old_active_snapshot_stop_cancels_only_own_active(resource, profile_accounts):
    a = profile_accounts[0]
    id = create(resource, a)
    other = create(resource, a)
    schedule(resource, a, id)
    schedule(resource, a, other)
    active = datetime(2026, 11, 12, 10, 30, tzinfo=UTC)
    with resource.transaction(a) as session:
        save_own_quest(
            session,
            id,
            QuestPut(
                expected_revision=1,
                definition=DEFINITION
                | {"title": "New title", "start_local": "12:00", "end_local": "13:00"},
            ),
        )
    changed = schedule(resource, a, id, 1, True, active, 2, DAY)
    assert any(v.title == "Read" and v.state == "active" for v in changed.occurrences)
    assert any(v.title == "New title" and v.state == "upcoming" for v in changed.occurrences)
    stopped = schedule(resource, a, id, 2, False, active + timedelta(minutes=1), 2, DAY)
    assert not stopped.enabled and any(v.state == "cancelled" for v in stopped.occurrences)
    with resource.transaction(a) as session:
        assert any(v.state == "active" for v in execution(session, other, active).occurrences)


def test_delete_closes_and_wipes_all_definition_snapshots(resource, profile_accounts):
    a = profile_accounts[0]
    id = create(resource, a)
    schedule(resource, a, id)
    with resource.transaction(a) as session:
        delete_own_quest(session, id, 1)
    with resource.transaction(a) as session:
        values = session.scalars(
            select(QuestScheduleVersion).where(QuestScheduleVersion.quest_id == id)
        ).all()
        assert values and all(v.definition is None and not v.enabled for v in values)
        assert execution(session, id, NOW).occurrences == []


def test_stale_schedules_and_past_start_are_rejected(resource, profile_accounts):
    a = profile_accounts[0]
    id = create(resource, a)
    schedule(resource, a, id)
    with pytest.raises(ApiError):
        schedule(resource, a, id)
    with pytest.raises(ApiError):
        schedule(resource, a, id, 1, True, datetime(2026, 11, 12, 10, 1, tzinfo=UTC), 1, DAY)
    with pytest.raises(ApiError):
        schedule(resource, a, id, 1, True, NOW, 2, DAY)


def test_foreign_outcome_and_runtime_rewrites_are_denied(resource, profile_accounts):
    a, b, _ = profile_accounts
    id = create(resource, a)
    schedule(resource, a, id)
    with resource.transaction(a) as session:
        put_outcome(session, id, 1, DAY, "cancelled", NOW)
    with resource.transaction(b) as session:
        assert session.scalars(select(QuestOccurrenceOutcome)).all() == []
    with pytest.raises(ApiError):
        with resource.transaction(b) as session:
            put_outcome(session, id, 1, DAY, "completed", NOW + timedelta(days=2))
    with pytest.raises(ProgrammingError):
        with resource.transaction(a) as session:
            session.execute(text("UPDATE public.quest_occurrence_outcomes SET credits=50"))


def test_actual_http_schema_and_strict_body(profile_client, profile_accounts):
    client, _, signer = profile_client
    a, b, _ = profile_accounts
    id = uuid4()
    path = "/v1/quests/" + str(id)
    assert (
        client.put(
            path,
            headers=headers(signer, a),
            json={"expected_revision": 0, "definition": DEFINITION},
        ).status_code
        == 200
    )
    today = datetime.now(UTC).date() + timedelta(days=1)
    payload = {
        "expected_revision": 0,
        "quest_revision": 1,
        "enabled": True,
        "first_date": today.isoformat(),
    }
    saved = client.put(path + "/schedule", headers=headers(signer, a), json=payload)
    assert saved.status_code == 200, saved.text
    assert saved.json()["revision"] == 1
    assert client.get(path + "/execution", headers=headers(signer, b)).json()["revision"] == 0
    assert (
        client.put(
            path + "/schedule", headers=headers(signer, a), json=payload | {"extra": 1}
        ).status_code
        == 422
    )
    assert (
        client.put(
            path + "/occurrences/1/" + today.isoformat(),
            headers=headers(signer, a),
            json={"state": "completed"},
        ).status_code
        == 422
    )
    assert client.get(path + "/execution?days=32", headers=headers(signer, a)).status_code == 422


@pytest.mark.parametrize("command", ["schedule", "complete"])
def test_two_real_connections_serialize_schedule_and_credit(
    resource, profile_accounts, db_settings, command
):
    a = profile_accounts[0]
    id = create(resource, a)
    if command == "complete":
        schedule(resource, a, id)
    concurrent = Database(db_settings.model_copy(update={"db_pool_size": 2}))
    barrier, pids = Barrier(2), set()

    def intercept(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("SELECT public.user_quests.") and "FOR UPDATE" in statement:
            pids.add(connection.connection.driver_connection.info.backend_pid)
            barrier.wait(timeout=5)

    event.listen(concurrent.engine, "before_cursor_execute", intercept)
    try:

        def write(_):
            try:
                if command == "schedule":
                    return schedule(concurrent, a, id).revision
                with concurrent.transaction(a) as session:
                    return put_outcome(
                        session, id, 1, DAY, "completed", NOW + timedelta(days=2)
                    ).credits
            except ApiError:
                return "conflict"

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(write, [1, 2]))
    finally:
        event.remove(concurrent.engine, "before_cursor_execute", intercept)
        concurrent.close()
    assert len(pids) == 2
    if command == "schedule":
        assert results.count(1) == 1 and results.count("conflict") == 1
    else:
        assert results == [50, 50]
        with resource.transaction(a) as session:
            assert execution(session, id, NOW + timedelta(days=2)).credits == 50


@pytest.mark.parametrize(
    "damage",
    [
        "ALTER TABLE public.quest_schedule_versions NO FORCE ROW LEVEL SECURITY",
        "GRANT SELECT ON public.quest_schedule_versions TO authenticated",
        "GRANT UPDATE ON public.quest_occurrence_outcomes TO disconnect_api",
        "ALTER TABLE public.quest_occurrence_outcomes DROP CONSTRAINT "
        "ck_quest_occurrence_outcomes_state_credit",
        "DROP POLICY quest_schedule_versions_select_own ON public.quest_schedule_versions",
    ],
)
def test_verification_rejects_execution_security_drift(migration_engine, damage):
    with migration_engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text(damage))
            with pytest.raises(MigrationSafetyError):
                verify(connection)
        finally:
            transaction.rollback()


def test_disposable_owner_cascade_removes_both_execution_tables(
    resource, profile_accounts, db_environment
):
    a = profile_accounts[0]
    id = create(resource, a)
    schedule(resource, a, id)
    with resource.transaction(a) as session:
        put_outcome(session, id, 1, DAY, "completed", NOW + timedelta(days=2))
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (a.user_id,))
        for table in ("quest_schedule_versions", "quest_occurrence_outcomes"):
            assert admin.execute(
                "SELECT count(*) FROM public." + table + " WHERE user_id=%s", (a.user_id,)
            ).fetchone() == (0,)


def test_recent_version_work_bound_rolls_back_new_schedule_but_never_blocks_stop(
    resource, profile_accounts
):
    a = profile_accounts[0]
    id = create(resource, a)
    with resource.transaction(a) as session:
        for revision in range(1, 129):
            session.add(
                QuestScheduleVersion(
                    user_id=a.user_id,
                    quest_id=id,
                    revision=revision,
                    quest_revision=1,
                    first_date=DAY,
                    definition=DEFINITION,
                    effective_from=NOW,
                    effective_until=NOW if revision < 128 else None,
                    enabled=True,
                )
            )
    with pytest.raises(ApiError):
        schedule(resource, a, id, expected=128)
    stopped = schedule(resource, a, id, expected=128, enabled=False)
    assert stopped.revision == 129 and not stopped.enabled
