from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, text

from app.core.identity import VerifiedIdentity
from app.repositories.profiles import read_own_profile
from tests.auth.support import settings
from tests.support import database
from tests.support.http import authenticated_app
from tests.support.profiles import headers, snapshot
from tests.support.schema import validate_observed_response

pytestmark = pytest.mark.database



def assert_safe_failure(response, code, caplog):
    assert response.status_code == (503 if code == "DEPENDENCY_UNAVAILABLE" else 500)
    assert response.json()["error"]["code"] == code
    assert "profile" not in response.json()
    assert response.json()["error"]["request_id"] == response.headers["X-Request-ID"]
    assert UUID(response.headers["X-Request-ID"])
    validate_observed_response(response)
    for private in (
        "private-failure-marker", "A private", "disconnect_test_runtime_only", "SELECT "
    ):
        assert private not in response.text + caplog.text


def test_repeated_absent_reads_do_not_insert_or_import_auth_metadata(
    profile_client, profile_accounts, db_environment
):
    client, resource, signer = profile_client
    unknown = VerifiedIdentity(uuid4(), None)
    checked = [*profile_accounts, unknown]
    before = snapshot(db_environment, checked)
    # Existing Auth without a profile and an unknown/deleted Auth subject both remain absent.
    for identity in (profile_accounts[2], unknown):
        for _ in range(3):
            response = client.get(
                "/v1/profile",
                headers=headers(signer, identity, user_metadata={"display_name": "Do not import"}),
            )
            assert response.status_code == 200 and response.json() == {"profile": None}
            validate_observed_response(response)
            assert resource.engine.pool.checkedout() == 0
    assert snapshot(db_environment, checked) == before


def test_a_b_reused_connection_returns_only_exact_own_wire_data_without_mutation(
    profile_client, profile_accounts, db_environment, caplog
):
    client, resource, signer = profile_client
    before = snapshot(db_environment, profile_accounts)
    pids = []
    # Return non-UTC PostgreSQL datetimes; the server must normalize actual instants to Z.
    with resource.engine.begin() as connection:
        connection.execute(text("SET TIME ZONE 'Asia/Dhaka'"))
    for identity, expected_name in [
        (profile_accounts[0], "A private 😀"), (profile_accounts[1], None),
        (profile_accounts[0], "A private 😀"),
    ]:
        response = client.get("/v1/profile", headers=headers(signer, identity))
        assert response.status_code == 200
        validate_observed_response(response)
        profile = response.json()["profile"]
        assert set(profile) == {"user_id", "display_name", "revision", "created_at", "updated_at"}
        assert profile["user_id"] == str(identity.user_id)
        assert profile["display_name"] == expected_name and profile["revision"] == 1
        assert profile["created_at"].endswith("Z") and profile["updated_at"].endswith("Z")
        assert resource.engine.pool.checkedout() == 0
        with resource.engine.connect() as connection:
            context, pid = connection.execute(
                text("SELECT current_setting('app.user_id',true), pg_backend_pid()")
            ).one()
            assert context in (None, "")
            pids.append(pid)
    assert len(set(pids)) == 1
    assert snapshot(db_environment, profile_accounts) == before
    assert "A private" not in caplog.text


def test_query_header_and_body_owner_injection_cannot_select_other_account(
    profile_client, profile_accounts
):
    client, _, signer = profile_client
    a, b, _ = profile_accounts
    response = client.request(
        "GET", f"/v1/profile?user_id={b.user_id}&email=other@example.invalid",
        headers={**headers(signer, a), "X-User-ID": str(b.user_id)},
        json={"user_id": str(b.user_id), "display_name": "untrusted"},
    )
    assert response.status_code == 200
    assert response.json()["profile"]["user_id"] == str(a.user_id)
    assert response.json()["profile"]["display_name"] == "A private 😀"
    assert str(b.user_id) not in response.text
    assert client.get(f"/v1/profile/{b.user_id}", headers=headers(signer, a)).status_code == 404


def test_repository_owner_predicate_supplements_real_rls(resource, profile_accounts):
    a, b, _ = profile_accounts
    with resource.transaction(a) as session:
        assert read_own_profile(session).user_id == a.user_id
        # Deliberately mismatch SQL context: a query relying only on RLS would leak B.
        session.connection().execute(
            text("SELECT set_config('app.user_id',:id,true)"), {"id": str(b.user_id)}
        )
        assert read_own_profile(session) is None


def test_real_profile_connection_failure_is_not_absence_and_does_not_break_identity(
    db_settings, monkeypatch, caplog
):
    values = db_settings.model_dump(exclude_none=True)
    values["database_url"] = db_settings.database_url.get_secret_value().replace(
        "disconnect_test_runtime_only", "private-failure-marker"
    )
    app, auth = authenticated_app(monkeypatch, settings(**values))
    with TestClient(app) as client:
        assert client.get("/v1/me", headers=auth).status_code == 200
        response = client.get("/v1/profile", headers=auth)
        assert_safe_failure(response, "DEPENDENCY_UNAVAILABLE", caplog)
        assert client.get("/healthz").status_code == 200


def test_profile_pool_exhaustion_is_safe_then_recovers_without_losing_data(
    db_settings, monkeypatch, profile_accounts, caplog
):
    values = db_settings.model_dump(exclude_none=True) | {"db_pool_timeout_seconds": 0.08}
    a = profile_accounts[0]
    app, auth = authenticated_app(monkeypatch, settings(**values), claims={"sub": str(a.user_id)})
    with TestClient(app) as client:
        with app.state.database.transaction(a):
            response = client.get("/v1/profile", headers=auth)
            assert_safe_failure(response, "DEPENDENCY_UNAVAILABLE", caplog)
            assert client.get("/v1/me", headers=auth).status_code == 200
        response = client.get("/v1/profile", headers=auth)
        assert response.status_code == 200
        assert response.json()["profile"]["display_name"] == "A private 😀"
        assert app.state.database.engine.pool.checkedout() == 0


@pytest.mark.parametrize("timeout", ["lock", "statement"])
def test_real_profile_query_timeouts_are_safe_and_retry_can_read_after_unlock(
    db_settings, db_environment, monkeypatch, profile_accounts, caplog, timeout
):
    values = db_settings.model_dump(exclude_none=True) | {
        "db_statement_timeout_ms": 150, "db_lock_timeout_ms": 100,
    }
    a = profile_accounts[0]
    app, auth = authenticated_app(monkeypatch, settings(**values), claims={"sub": str(a.user_id)})
    with TestClient(app) as client:
        if timeout == "statement":
            # Deliberately let the statement timer, rather than lock timer, cancel this SELECT.
            @event.listens_for(app.state.database.engine, "before_cursor_execute")
            def disable_lock_timer(connection, cursor, statement, parameters, context, executemany):
                if "FROM public.profiles" in statement:
                    cursor.execute("SET LOCAL lock_timeout=0")

        with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
            with admin.transaction():
                admin.execute("LOCK TABLE public.profiles IN ACCESS EXCLUSIVE MODE")
                response = client.get("/v1/profile", headers=auth)
                assert_safe_failure(response, "DEPENDENCY_UNAVAILABLE", caplog)
                assert app.state.database.engine.pool.checkedout() == 0
                assert client.get("/v1/me", headers=auth).status_code == 200
        response = client.get("/v1/profile", headers=auth)
        assert response.status_code == 200
        assert response.json()["profile"]["user_id"] == str(a.user_id)


def test_unexpected_repository_failure_is_safe_500_not_absence_or_dependency_outage(
    profile_client, profile_accounts, monkeypatch, caplog
):
    def fail(session):
        raise RuntimeError("private-failure-marker")

    monkeypatch.setattr("app.api.v1.profiles.read_own_profile", fail)
    client, resource, signer = profile_client
    response = client.get("/v1/profile", headers=headers(signer, profile_accounts[0]))
    assert_safe_failure(response, "INTERNAL_ERROR", caplog)
    assert resource.engine.pool.checkedout() == 0
