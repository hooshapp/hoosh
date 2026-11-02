import time
from uuid import uuid4

import pytest
from sqlalchemy import event, insert, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import registry

from app.core.config import Settings
from app.core.errors import ApiError
from app.core.identity import VerifiedIdentity
from app.db.engine import Database
from app.db.session import DatabaseContextError, UserSession, require_user_context
from app.schemas.errors import ErrorCode
from tests.auth.support import USER_A, USER_B
from tests.support import database

pytestmark = pytest.mark.database
A, B = VerifiedIdentity(USER_A, None), VerifiedIdentity(USER_B, None)
CONTEXT = text("SELECT current_setting('app.user_id', true), pg_backend_pid()")


def count(resource, table):
    with resource.transaction(A) as session:
        return len(session.execute(select(table)).all())


def test_a_b_reuse_commit_rollback_and_no_user_context_between_units(resource, probe):
    sessions, pids = [], []
    for identity in (A, B):
        with resource.transaction(identity) as session:
            sessions.append(session)
            value, pid = session.execute(CONTEXT).one()
            pids.append(pid)
            assert value == str(identity.user_id)
            assert require_user_context(session) == identity.user_id
            session.execute(insert(probe).values(id=uuid4(), value="committed"))
        assert not session.info and not session.in_transaction()
        with resource.engine.connect() as connection:
            assert connection.scalar(text("SELECT current_setting('app.user_id', true)")) in (
                None,
                "",
            )
    assert sessions[0] is not sessions[1] and pids[0] == pids[1]
    assert count(resource, probe) == 2
    assert resource.engine.pool.checkedout() == 0
    with pytest.raises(DatabaseContextError):
        sessions[0].execute(text("SELECT 1"))


@pytest.mark.parametrize("failure", [RuntimeError, KeyboardInterrupt])
def test_python_failure_and_base_exception_rollback_and_release(resource, probe, failure):
    with pytest.raises(failure):
        with resource.transaction(A) as session:
            session.execute(insert(probe).values(id=uuid4(), value="must rollback"))
            raise failure("synthetic failure")
    assert count(resource, probe) == 0
    assert resource.engine.pool.checkedout() == 0
    with resource.transaction(B) as session:
        assert session.scalar(CONTEXT) == str(USER_B)


def test_deferred_commit_failure_rolls_back_and_is_not_a_false_dependency_error(resource, probe):
    with pytest.raises(IntegrityError):
        with resource.transaction(A) as session:
            session.execute(
                insert(probe).values(id=uuid4(), parent_id=uuid4(), value="private marker")
            )
            assert session.scalar(select(probe.c.value)) == "private marker"
            # Deferrable FK is checked on actual PostgreSQL COMMIT, after this body.
    assert count(resource, probe) == 0
    assert resource.engine.pool.checkedout() == 0


def test_missing_context_denies_session_execute_flush_and_commit(resource, probe):
    mapper = registry()

    class Row:
        pass

    mapper.map_imperatively(Row, probe)
    try:
        with UserSession(resource.engine, autobegin=False) as session:
            with pytest.raises(DatabaseContextError), session.begin():
                session.execute(select(probe))
            with pytest.raises(DatabaseContextError), session.begin():
                row = Row()
                row.id = uuid4()
                session.add(row)
                session.flush()
            with pytest.raises(DatabaseContextError), session.begin():
                pass  # Bare commit is guarded even without pending SQL.
    finally:
        mapper.dispose()
    assert count(resource, probe) == 0


def test_pool_exhaustion_is_bounded_and_never_replays(db_settings):
    config = Settings(
        _env_file=None, **(db_settings.model_dump() | {"db_pool_timeout_seconds": 0.08})
    )
    resource = Database(config)
    try:
        with resource.transaction(A):
            started = time.monotonic()
            with pytest.raises(ApiError) as error, resource.transaction(B):
                pytest.fail("Second transaction exceeded the one-connection pool")
            assert error.value.code == ErrorCode.DEPENDENCY_UNAVAILABLE
            assert 0.05 <= time.monotonic() - started < 3
        assert resource.engine.pool.checkedout() == 0
        with resource.transaction(B) as session:
            assert session.scalar(text("SELECT 1")) == 1
    finally:
        resource.close()


def test_statement_timeout_maps_safe_unavailable_and_rolls_back(db_settings, probe, caplog):
    resource = Database(
        Settings(
            _env_file=None,
            **(
                db_settings.model_dump()
                | {"db_statement_timeout_ms": 100, "db_lock_timeout_ms": 100}
            ),
        )
    )
    try:
        with pytest.raises(ApiError) as error:
            with resource.transaction(A) as session:
                session.execute(insert(probe).values(id=uuid4(), value="secret-timeout-marker"))
                session.execute(text("SELECT pg_sleep(1)"))
        assert error.value.code == ErrorCode.DEPENDENCY_UNAVAILABLE
        assert "secret-timeout-marker" not in caplog.text
        assert count(resource, probe) == 0
        with resource.transaction(B) as session:
            assert session.scalar(CONTEXT) == str(USER_B)
    finally:
        resource.close()


def test_pre_ping_recovers_dead_idle_connection_without_previous_user(resource, db_environment):
    with resource.transaction(A) as session:
        _, old_pid = session.execute(CONTEXT).one()
        assert session.scalar(text("SHOW statement_timeout")) == "5s"
        assert session.scalar(text("SHOW lock_timeout")) == "2s"
        assert session.scalar(text("SHOW idle_in_transaction_session_timeout")) == "10s"
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        result = admin.execute(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            "WHERE pid=%s AND datname='disconnect_test' "
            "AND usename='disconnect_api'",
            (old_pid,),
        ).fetchall()
        assert result == [(True,)]
    with resource.transaction(B) as session:
        value, new_pid = session.execute(CONTEXT).one()
        assert value == str(USER_B) and new_pid != old_pid


def test_closed_resource_rejects_new_work_and_disposes_idle_connections(resource):
    connections = []
    event.listen(resource.engine, "connect", lambda dbapi, record: connections.append(dbapi))
    with resource.transaction(A) as session:
        assert session.scalar(text("SELECT 1")) == 1
    resource.close()
    resource.close()
    assert connections and all(connection.closed for connection in connections)
    with pytest.raises(ApiError) as error, resource.transaction(A):
        pytest.fail("Closed resource accepted work")
    assert error.value.code == ErrorCode.DEPENDENCY_UNAVAILABLE


@pytest.mark.parametrize("operation", ["commit", "rollback"])
def test_manual_finalization_cannot_break_atomic_unit_of_work(resource, probe, operation):
    with pytest.raises(DatabaseContextError):
        with resource.transaction(A) as session:
            session.execute(insert(probe).values(id=uuid4(), value="must remain atomic"))
            getattr(session, operation)()
    assert count(resource, probe) == 0


def test_lost_connection_during_work_rolls_back_without_mutation_replay(
    resource, probe, db_environment
):
    with pytest.raises(ApiError) as error:
        with resource.transaction(A) as session:
            session.execute(insert(probe).values(id=uuid4(), value="not replayed"))
            pid = session.scalar(text("SELECT pg_backend_pid()"))
            with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
                assert admin.execute(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE pid=%s AND usename='disconnect_api' "
                    "AND datname='disconnect_test'",
                    (pid,),
                ).fetchall() == [(True,)]
            session.execute(text("SELECT 1"))
    assert error.value.code == ErrorCode.DEPENDENCY_UNAVAILABLE
    assert count(resource, probe) == 0
