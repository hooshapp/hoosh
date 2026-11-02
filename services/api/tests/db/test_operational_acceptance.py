import json
import logging

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event

from app.core.identity import VerifiedIdentity
from tests.auth.support import USER_A, settings
from tests.support import database
from tests.support.http import authenticated_app, signed_headers
from tools.acceptance import account_checks, transport_checks

pytestmark = pytest.mark.database
LOGGER = "uvicorn.error.disconnect"


@pytest.mark.parametrize("absent", [False, True])
def test_full_acceptance_journey_uses_real_routes_and_runtime_role(
    monkeypatch, db_settings, profile_accounts, absent
):
    from tests.auth.support import LocalSigner

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {"cors_allowed_origins": ["http://localhost:8081"]}
        )
    )
    app, _ = authenticated_app(monkeypatch, config, signer=signer)
    identities = {
        label: identity.user_id
        for label, identity in zip(
            ("A", "B"), [profile_accounts[0], profile_accounts[2 if absent else 1]], strict=True
        )
    }
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"].removeprefix("Bearer ")
        for label, user in identities.items()
    }
    with TestClient(app) as client:
        assert transport_checks(client, "http://localhost:8081")["corsProtocol"] == "passed"
        report = account_checks(
            client, tokens, identities, write=True, origin="http://localhost:8081"
        )
        assert report["managedProfileWriteAB"].startswith("passed")
        assert app.state.database.engine.pool.checkedout() == 0
    # Local signed-token journey validates the tool, never managed-user acceptance.


@pytest.mark.parametrize(
    "failure,expected",
    [
        ("password", "connection_failure"),
        ("pool", "pool_timeout"),
        ("lock", "lock_unavailable"),
        ("statement", "query_cancelled"),
    ],
)
def test_actual_database_failure_categories_keep_request_correlation(
    monkeypatch, db_settings, db_environment, caplog, failure, expected
):
    caplog.set_level(logging.INFO, logger=LOGGER)
    values = db_settings.model_dump(exclude_none=True) | {
        "db_pool_timeout_seconds": 0.08,
        "db_statement_timeout_ms": 150,
        "db_lock_timeout_ms": 100,
    }
    if failure == "password":
        values["database_url"] = db_settings.database_url.get_secret_value().replace(
            "disconnect_test_runtime_only", "private-wrong-password"
        )
    app, auth = authenticated_app(monkeypatch, settings(**values))
    with TestClient(app) as client:

        def query():
            response = client.get("/v1/profile", headers=auth)
            assert response.status_code == 503
            return response

        if failure == "pool":
            with app.state.database.transaction(VerifiedIdentity(USER_A, None)):
                response = query()
        elif failure in ("lock", "statement"):
            if failure == "statement":

                @event.listens_for(app.state.database.engine, "before_cursor_execute")
                def disable_lock(connection, cursor, statement, parameters, context, executemany):
                    if "FROM public.profiles" in statement:
                        cursor.execute("SET LOCAL lock_timeout=0")

            with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
                with admin.transaction():
                    admin.execute("LOCK TABLE public.profiles IN ACCESS EXCLUSIVE MODE")
                    response = query()
        else:
            response = query()
        logs = [json.loads(r.getMessage()) for r in caplog.records if r.name == LOGGER]
        assert any(
            r.get("dependency") == "database"
            and r["outcome"] == expected
            and r["request_id"] == response.headers["X-Request-ID"]
            for r in logs
        )
        assert "private-wrong-password" not in json.dumps(logs) + response.text


def test_unavailable_profile_journey_with_actual_connection_failure(monkeypatch, db_settings):
    from tests.auth.support import USER_B, LocalSigner
    from tools.acceptance import unavailable_profile_checks

    signer = LocalSigner()
    values = db_settings.model_dump(exclude_none=True) | {
        "cors_allowed_origins": ["http://localhost:8081"],
        "database_url": db_settings.database_url.get_secret_value().replace(
            "disconnect_test_runtime_only", "deliberately-wrong-test-password"
        ),
    }
    app, _ = authenticated_app(monkeypatch, settings(**values), signer=signer)
    identities = {"A": USER_A, "B": USER_B}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    with TestClient(app) as client:
        report = unavailable_profile_checks(
            client, tokens, identities, origin="http://localhost:8081"
        )
        assert report["profileUnavailableAB"].startswith("passed")
        assert app.state.database.engine.pool.checkedout() == 0


def test_unavailable_probe_cannot_create_when_database_recovers_between_requests(
    monkeypatch, db_settings, profile_accounts, db_environment
):
    from app.core.errors import ApiError
    from app.schemas.errors import ErrorCode
    from tests.auth.support import LocalSigner
    from tests.support.profiles import snapshot
    from tools.acceptance import AcceptanceError, unavailable_profile_checks

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {
                "cors_allowed_origins": ["http://localhost:8081"],
            }
        )
    )
    app, _ = authenticated_app(monkeypatch, config, signer=signer)
    identities = {"A": profile_accounts[2].user_id, "B": profile_accounts[1].user_id}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    before = snapshot(db_environment, profile_accounts)

    def temporary_read_failure(session):
        raise ApiError(ErrorCode.DEPENDENCY_UNAVAILABLE)

    monkeypatch.setattr("app.api.v1.profiles.read_own_profile", temporary_read_failure)
    with TestClient(app) as client:
        # GET fails, but PATCH can connect. Its impossible revision must not create A's row.
        with pytest.raises(AcceptanceError):
            unavailable_profile_checks(client, tokens, identities, origin="http://localhost:8081")
    assert snapshot(db_environment, profile_accounts) == before
