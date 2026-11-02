"""Pure runtime configuration/lifecycle checks; no network or developer .env."""

from urllib.parse import quote

import psycopg
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.application import create_app as assemble_app
from app.core.config import Settings
from app.core.database_config import runtime_database_url
from app.db.base import Base
from app.db.engine import Database
from app.db.session import DatabaseContextError
from app.runtime import create_app

LOCAL = (
    "postgresql://disconnect_api:synthetic-secret@127.0.0.1:55432/disconnect_test?sslmode=disable"
)
PROJECT = "a" * 20


@pytest.mark.parametrize(
    "uri",
    [
        LOCAL.replace("disconnect_api:", "postgres:"),
        LOCAL.replace("55432", "5432"),
        LOCAL.replace("disconnect_test", "postgres"),
        LOCAL.replace("disable", "prefer"),
        LOCAL + "&options=-c%20role=postgres",
        LOCAL + "&hostaddr=1.2.3.4",
        LOCAL + "&service=cloud",
        LOCAL + "&sslmode=require",
        LOCAL + "#fragment",
        LOCAL.replace("postgresql://", "sqlite://"),
        LOCAL.replace("synthetic-secret", ""),
        LOCAL + "\n",
        "not-a-database-synthetic-secret",
    ],
)
def test_unsafe_runtime_configuration_is_rejected_without_secret_echo(uri):
    with pytest.raises(ValidationError) as error:
        Settings(_env_file=None, app_env="test", database_url=uri)
    assert "synthetic-secret" not in str(error.value)


def test_local_unencrypted_runtime_is_test_only():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url=LOCAL)


@pytest.mark.parametrize(
    "overrides",
    [
        {"db_pool_size": 0},
        {"db_pool_size": 6},
        {"db_pool_timeout_seconds": float("nan")},
        {"db_pool_timeout_seconds": 0},
        {"db_connect_timeout_seconds": 0},
        {"db_statement_timeout_ms": 99},
        {"db_statement_timeout_ms": 30001},
        {"db_lock_timeout_ms": 5001},
        {"db_idle_transaction_timeout_ms": 999},
        {"db_statement_timeout_ms": 100, "db_lock_timeout_ms": 200},
    ],
)
def test_database_resource_bounds_are_validated(overrides):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **overrides)


def remote(tmp_path):
    ca = tmp_path / "local CA.pem"
    ca.touch()
    return (
        f"postgresql://disconnect_api.{PROJECT}:synthetic-secret@"
        f"aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=verify-full"
        f"&sslrootcert={quote(str(ca))}"
    )


def test_remote_configuration_pins_role_project_mode_and_ca(tmp_path):
    uri = remote(tmp_path)
    target = runtime_database_url(
        uri, app_env="development", project_origin=f"https://{PROJECT}.supabase.co"
    )
    assert target.drivername == "postgresql+psycopg"
    assert "synthetic-secret" not in str(target)
    for bad in [
        uri.replace("5432", "6543"),
        uri.replace("verify-full", "require"),
        uri.replace(f"disconnect_api.{PROJECT}", f"postgres.{PROJECT}"),
        uri.replace(PROJECT, "b" * 20),
        uri.replace("sslrootcert=", "unknown="),
    ]:
        with pytest.raises(ValueError):
            runtime_database_url(
                bad, app_env="production", project_origin=f"https://{PROJECT}.supabase.co"
            )


def test_migration_credentials_never_become_runtime_configuration(monkeypatch):
    monkeypatch.setenv("MIGRATION_DATABASE_URL", "invalid-admin-synthetic-secret")
    config = Settings(_env_file=None)
    assert config.database_url is None
    assert not hasattr(config, "migration_database_url")
    with TestClient(create_app(config)) as client:
        assert client.app.state.database is None
        assert client.get("/healthz").status_code == 200


def test_engine_and_lifespan_are_lazy_bounded_and_close_without_network(monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Lifespan/engine construction attempted a database connection")

    monkeypatch.setattr(psycopg, "connect", forbidden)
    config = Settings(_env_file=None, app_env="test", database_url=LOCAL)
    assert "synthetic-secret" not in repr(config)
    assert "synthetic-secret" not in config.model_dump_json()
    app = create_app(config)
    assert app.state.database is None
    with TestClient(app) as client:
        resource = app.state.database
        assert resource.engine.pool.size() == 2
        assert resource.engine.pool._max_overflow == 0
        assert resource.engine.pool.timeout() == 2
        assert resource.engine.pool.checkedout() == 0
        assert resource.engine.hide_parameters
        assert resource.engine.logger.disabled and resource.engine.pool.logger.disabled
        assert client.get("/healthz").status_code == 200
    assert resource.closed and app.state.database is None
    resource.close()
    assert not Base.metadata.tables
    with TestClient(assemble_app()) as client:
        assert client.app.state.database is None


def test_invalid_user_authority_fails_before_network():
    config = Settings(_env_file=None, app_env="test", database_url=LOCAL)
    resource = Database(config)
    try:
        with pytest.raises(DatabaseContextError), resource.transaction("attacker-id"):
            pytest.fail("Unverified identity entered the transaction")
        assert resource.engine.pool.checkedout() == 0
    finally:
        resource.close()


@pytest.mark.parametrize("phase", ["startup", "shutdown"])
def test_auth_lifecycle_failure_still_disposes_database(monkeypatch, phase):
    from tests.auth.support import settings

    resources = []

    def resource_factory(config):
        value = Database(config)
        resources.append(value)
        return value

    def unavailable(config):
        if phase == "startup":
            raise RuntimeError("synthetic Auth lifecycle failure")

        class Resolver:
            async def aclose(self):
                raise RuntimeError("synthetic Auth lifecycle failure")

        return Resolver()

    monkeypatch.setattr("app.runtime.Database", resource_factory)
    monkeypatch.setattr("app.runtime.JwksResolver", unavailable)
    app = create_app(settings(app_env="test", database_url=LOCAL))
    with pytest.raises(RuntimeError, match="synthetic Auth lifecycle failure"):
        with TestClient(app) as client:
            assert phase == "shutdown"
            assert client.get("/healthz").status_code == 200
    assert resources[0].closed and app.state.database is None
