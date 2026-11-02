from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert, select, text

from app.db.dependencies import UserSessionDependency
from tests.auth.support import USER_A, settings
from tests.support.http import authenticated_app

pytestmark = pytest.mark.database


def test_sync_request_commits_and_shuts_down_owned_pool_before_reuse(
    db_settings, monkeypatch, probe
):
    app, headers = authenticated_app(
        monkeypatch, settings(**db_settings.model_dump(exclude_none=True))
    )

    @app.post("/__test/unit")
    def unit(session: UserSessionDependency):
        session.execute(insert(probe).values(id=uuid4(), value="normal"))
        return {"user_id": session.scalar(text("SELECT current_setting('app.user_id')"))}

    assert not app.dependency_overrides
    with TestClient(app) as client:
        resource = app.state.database
        response = client.post("/__test/unit", headers=headers)
        assert response.status_code == 200 and response.json() == {"user_id": str(USER_A)}
        assert resource.engine.pool.checkedout() == 0
        with resource.engine.connect() as connection:
            assert connection.execute(select(probe.c.value)).all() == [("normal",)]
        assert client.get("/v1/me", headers=headers).json()["user_id"] == str(USER_A)
    assert resource.closed and app.state.database is None


def test_real_commit_failure_becomes_safe_http_error_before_success_response(
    db_settings, monkeypatch, probe, caplog
):
    app, headers = authenticated_app(
        monkeypatch, settings(**db_settings.model_dump(exclude_none=True))
    )

    @app.post("/__test/commit")
    def unit(session: UserSessionDependency):
        session.execute(
            insert(probe).values(id=uuid4(), parent_id=uuid4(), value="private-commit-marker")
        )
        return {"would_have_succeeded": True}

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post("/__test/commit", headers=headers)
        assert response.status_code == 500
        body = response.json()["error"]
        assert body["code"] == "INTERNAL_ERROR"
        assert str(UUID(response.headers["X-Request-ID"])) == body["request_id"]
        assert response.headers["Cache-Control"] == "no-store"
        assert "private-commit-marker" not in response.text + caplog.text
        with app.state.database.engine.connect() as connection:
            assert connection.execute(select(probe)).all() == []
        assert app.state.database.engine.pool.checkedout() == 0


def test_db_unavailable_is_503_while_liveness_and_real_signature_identity_work(
    db_settings, monkeypatch, caplog
):
    uri = db_settings.database_url.get_secret_value().replace(
        "disconnect_test_runtime_only", "deliberately-wrong-test-password"
    )
    app, headers = authenticated_app(
        monkeypatch, settings(**(db_settings.model_dump(exclude_none=True) | {"database_url": uri}))
    )

    @app.get("/__test/database")
    def unit(session: UserSessionDependency):
        return {"value": session.scalar(text("SELECT 1"))}

    with TestClient(app) as client:
        # Engine startup is lazy; even wrong DB credentials cannot take down M1.
        assert app.state.database.engine.pool.checkedout() == 0
        assert client.get("/healthz").status_code == 200
        assert client.get("/v1/me", headers=headers).status_code == 200
        response = client.get("/__test/database", headers=headers)
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "DEPENDENCY_UNAVAILABLE"
        assert response.json()["error"]["retryable"] is True
        assert "deliberately-wrong" not in response.text + caplog.text


def test_database_disabled_never_borrows_migration_url(db_environment, monkeypatch):
    monkeypatch.setenv("MIGRATION_DATABASE_URL", db_environment["TEST_MIGRATION_DATABASE_URL"])
    app, headers = authenticated_app(monkeypatch, settings())

    @app.get("/__test/database")
    def unit(session: UserSessionDependency):
        return {"value": session.scalar(text("SELECT 1"))}

    with TestClient(app) as client:
        assert app.state.database is None
        assert client.get("/v1/me", headers=headers).status_code == 200
        assert client.get("/__test/database", headers=headers).status_code == 503
