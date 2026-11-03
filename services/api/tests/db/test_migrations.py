import psycopg
import pytest
from sqlalchemy import text

from alembic import command
from app.db.migrations import HEAD, MigrationSafetyError, config, run, verify
from tests.support import database

pytestmark = pytest.mark.database


def test_actual_upgrade_head_repeat_noop_and_autogenerate_no_drift(migration_engine):
    with migration_engine.begin() as connection:
        before = connection.execute(
            text("SELECT oid FROM pg_class WHERE oid='public.profiles'::regclass")
        ).scalar_one()
        assert run(connection)["revision"] == HEAD
        assert run(connection)["revision"] == HEAD
        assert run(connection, "check")["revision"] == HEAD
        assert (
            connection.scalar(
                text("SELECT oid FROM pg_class WHERE oid='public.profiles'::regclass")
            )
            == before
        )


def test_disposable_downgrade_and_real_empty_upgrade_preserve_default_privileges(migration_engine):
    with migration_engine.begin() as connection:
        assert connection.scalar(text("SELECT count(*) FROM public.profiles")) == 0
        defaults = connection.execute(
            text(
                "SELECT defaclrole,defaclnamespace,defaclobjtype,"
                "defaclacl::text FROM pg_default_acl ORDER BY 1,2,3"
            )
        ).all()
        command.downgrade(config(connection), "base")
        assert connection.scalar(text("SELECT to_regclass('public.profiles')")) is None
        connection.execute(text("DROP TABLE public.alembic_version"))
        assert (
            connection.scalar(
                text("SELECT to_regprocedure('public.disconnect_profiles_server_times()')")
            )
            is None
        )
        assert run(connection)["revision"] == HEAD
        assert run(connection, "check")["revision"] == HEAD
        assert (
            connection.execute(
                text(
                    "SELECT defaclrole,defaclnamespace,defaclobjtype,"
                    "defaclacl::text FROM pg_default_acl ORDER BY 1,2,3"
                )
            ).all()
            == defaults
        )


def test_unversioned_existing_objects_are_refused_without_stamping(migration_engine):
    with migration_engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text("DROP TABLE public.alembic_version"))
            with pytest.raises(MigrationSafetyError, match="Unversioned public objects"):
                run(connection)
        finally:
            transaction.rollback()
        with connection.begin():
            assert verify(connection)["revision"] == HEAD


@pytest.mark.parametrize(
    "mutation",
    [
        "ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY",
        "ALTER POLICY profiles_select_own ON public.profiles USING (true)",
        "GRANT SELECT ON public.profiles TO anon",
        "GRANT SELECT(display_name) ON public.profiles TO service_role",
        "GRANT SELECT ON public.alembic_version TO authenticated",
        "ALTER FUNCTION public.disconnect_profiles_server_times() SECURITY DEFINER",
        "GRANT EXECUTE ON FUNCTION public.disconnect_profiles_server_times() TO PUBLIC",
        "ALTER ROLE disconnect_api BYPASSRLS",
        "ALTER TABLE public.profiles DROP CONSTRAINT ck_profiles_revision_positive",
        "ALTER TABLE public.profiles DROP CONSTRAINT ck_profiles_revision_positive; "
        "ALTER TABLE public.profiles ADD CONSTRAINT ck_profiles_revision_positive "
        "CHECK (revision >= 0)",
    ],
)
def test_security_drift_is_rejected_and_can_be_rolled_back(migration_engine, mutation):
    with migration_engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text(mutation))
            with pytest.raises(MigrationSafetyError):
                verify(connection)
        finally:
            transaction.rollback()
        with connection.begin():
            assert verify(connection)["rls"]


@pytest.mark.parametrize("role", ["anon", "authenticated", "service_role"])
def test_data_api_roles_cannot_read_even_with_bypass_rls(db_environment, role):
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        assert not admin.execute(
            "SELECT has_table_privilege(%s,'public.profiles','SELECT')", (role,)
        ).fetchone()[0]
        with pytest.raises(psycopg.errors.InsufficientPrivilege) as error:
            with admin.transaction(force_rollback=True):
                # Fixed test-only enum, not a user-controlled SQL identifier.
                admin.execute("SET LOCAL ROLE " + role)
                admin.execute("SELECT * FROM public.profiles")
        assert error.value.sqlstate == "42501"
