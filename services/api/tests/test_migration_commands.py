import importlib.util
import sys
from pathlib import Path

import pytest

from app.core.database_config import migration_database_url, runtime_database_url

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("migration_cli", ROOT / "scripts/migrate-db.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
TEST_ADMIN = "postgresql://postgres:test@127.0.0.1:55432/disconnect_test?sslmode=disable"


def test_runtime_and_migration_role_policies_are_separate():
    assert (
        migration_database_url(TEST_ADMIN, app_env="test", project_origin=None).username
        == "postgres"
    )
    with pytest.raises(ValueError):
        runtime_database_url(TEST_ADMIN, app_env="test", project_origin=None)
    with pytest.raises(ValueError):
        migration_database_url(
            TEST_ADMIN.replace("postgres:test", "disconnect_api:test"),
            app_env="test",
            project_origin=None,
        )


def test_development_downgrade_is_rejected_before_credentials_or_network(monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Downgrade attempted environment or network access")

    monkeypatch.setattr(module, "dotenv_values", forbidden)
    monkeypatch.setattr(module, "create_engine", forbidden)
    monkeypatch.setattr(sys, "argv", ["migrate-db.py", "downgrade-test", "--target", "development"])
    with pytest.raises(SystemExit, match="only for the disposable test target"):
        module.main()


def test_missing_explicit_target_cannot_fall_back_to_any_url(monkeypatch):
    monkeypatch.setenv("MIGRATION_DATABASE_URL", "invalid-private-uri")
    monkeypatch.setattr(sys, "argv", ["migrate-db.py", "upgrade"])
    with pytest.raises(SystemExit, match="Choose the explicit"):
        module.main()


def test_raw_errors_are_sanitized_without_secret_echo(monkeypatch):
    def fail():
        raise RuntimeError("synthetic-private-uri")

    monkeypatch.setattr(module, "offline_sql", fail)
    monkeypatch.setattr(sys, "argv", ["migrate-db.py", "sql"])
    with pytest.raises(SystemExit) as error:
        module.main()
    assert "RuntimeError" in str(error.value) and "synthetic-private-uri" not in str(error.value)
