"""SB-05 real DB checks. No SQLAlchemy/session/RLS acceptance is claimed here."""

import os
from pathlib import Path

import psycopg
import pytest
from dotenv import dotenv_values

from tests.support import database

pytestmark = pytest.mark.database
API = Path(__file__).resolve().parents[1]
BOOTSTRAP = API / "db/bootstrap"


@pytest.fixture
def test_environment():
    values = dotenv_values(API / "tests/.env", interpolate=False)
    for key in ("APP_ENV", "TEST_DATABASE_URL", "TEST_MIGRATION_DATABASE_URL"):
        if key in os.environ:
            values[key] = os.environ[key]
    return values


def test_real_fixture_identity_major_marker_and_minimal_auth(test_environment):
    with database.connect(test_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        assert admin.execute("SELECT current_database()").fetchone() == ("disconnect_test",)
        assert admin.execute(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema='auth' AND table_name='users'"
        ).fetchall() == [("id",)]
        assert admin.execute("SELECT count(*) FROM auth.users").fetchone() == (0,)
        assert admin.execute("SELECT to_regclass('public.profiles')").fetchone() == (None,)


def test_bootstrap_is_repeatable_and_runtime_can_only_connect(test_environment):
    with database.connect(test_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        for _ in range(2):
            with admin.transaction():
                admin.execute((BOOTSTRAP / "roles.sql").read_text())
        report = admin.execute((BOOTSTRAP / "verify.sql").read_text()).fetchone()
        assert report == (
            "disconnect_api",
            True,
            False,
            False,
            False,
            False,
            False,
            False,
            10,
            True,
            False,
            True,
            True,
            False,
            0,
            0,
            0,
            0,
        )
    with database.connect(test_environment, "TEST_DATABASE_URL") as runtime:
        assert runtime.execute("SELECT session_user, current_user").fetchone() == (
            "disconnect_api",
            "disconnect_api",
        )
        runtime.execute((BOOTSTRAP / "check-permissions.sql").read_text())


@pytest.mark.parametrize(
    "unsafe_change",
    [
        "ALTER ROLE disconnect_api BYPASSRLS",
        "ALTER ROLE disconnect_api INHERIT",
        "GRANT pg_read_all_data TO disconnect_api",
        "CREATE SCHEMA unsafe_owned AUTHORIZATION disconnect_api",
        "GRANT CREATE ON SCHEMA public TO PUBLIC",
    ],
)
def test_bootstrap_rejects_unsafe_existing_roles_atomically(test_environment, unsafe_change):
    with database.connect(test_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        with pytest.raises(psycopg.errors.RaiseException):
            with admin.transaction(force_rollback=True):
                admin.execute(unsafe_change)
                admin.execute((BOOTSTRAP / "roles.sql").read_text())
        assert not admin.execute(
            "SELECT rolbypassrls FROM pg_roles WHERE rolname='disconnect_api'"
        ).fetchone()[0]
        assert admin.execute("SELECT to_regnamespace('unsafe_owned')").fetchone() == (None,)


def test_wrong_test_password_is_an_actual_connection_failure(test_environment):
    values = dict(test_environment)
    values["TEST_DATABASE_URL"] = values["TEST_DATABASE_URL"].replace(
        "disconnect_test_runtime_only", "deliberately-wrong-test-password"
    )
    with pytest.raises(ValueError, match="validation failed"):
        database.connect(values, "TEST_DATABASE_URL")
