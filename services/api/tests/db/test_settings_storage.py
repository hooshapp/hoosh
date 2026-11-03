import json
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import psycopg
import pytest
from sqlalchemy import JSON, delete, insert, select, text, update
from sqlalchemy.exc import DBAPIError, IntegrityError

from alembic import command
from app.core.identity import VerifiedIdentity
from app.db.migrations import HEAD, MigrationSafetyError, config, run, verify
from app.models import Profile, UserSettings
from tests.support import database

pytestmark = pytest.mark.database
FIXTURES = json.loads(
    (
        Path(__file__).resolve().parents[4] / "packages/contracts/fixtures/settings-v1.json"
    ).read_text()
)
EMPTY = FIXTURES["empty_activities"]
DRAFT = FIXTURES["empty_plan_draft"]


@pytest.fixture
def owners(resource, profile_accounts):
    for identity in profile_accounts[:2]:
        with resource.transaction(identity) as session:
            session.add(UserSettings(user_id=identity.user_id))
    return profile_accounts


def test_actual_runtime_rls_and_owner_checks_without_repository_predicates(resource, owners):
    a, b, c = owners
    for owner in (a, b, a):
        with resource.transaction(owner) as session:
            assert session.scalars(select(UserSettings.user_id)).all() == [owner.user_id]
            assert session.execute(update(UserSettings).values(activities=EMPTY)).rowcount == 1
            other = b if owner == a else a
            assert (
                session.scalars(
                    select(UserSettings).where(UserSettings.user_id == other.user_id)
                ).all()
                == []
            )
            assert (
                session.execute(
                    update(UserSettings)
                    .where(UserSettings.user_id == other.user_id)
                    .values(activities=EMPTY)
                ).rowcount
                == 0
            )
    for statement in [
        insert(UserSettings).values(user_id=c.user_id),
        update(UserSettings).values(user_id=c.user_id),
    ]:
        with pytest.raises(DBAPIError) as error, resource.transaction(a) as session:
            session.execute(statement)
        assert error.value.orig.sqlstate == "42501"


@pytest.mark.parametrize("context", [None, ""])
def test_contextless_runtime_is_default_deny(resource, owners, context):
    with resource.engine.begin() as connection:
        if context is not None:
            connection.execute(
                text("SELECT set_config('app.user_id',:value,true)"), {"value": context}
            )
        assert connection.execute(select(UserSettings)).all() == []
        assert connection.execute(update(UserSettings).values(activities=EMPTY)).rowcount == 0
    with pytest.raises(DBAPIError) as error, resource.engine.begin() as connection:
        connection.execute(insert(UserSettings).values(user_id=owners[0].user_id))
    assert error.value.orig.sqlstate == "42501"


@pytest.mark.parametrize("statement", [delete(UserSettings), text("TRUNCATE public.user_settings")])
def test_runtime_cannot_delete_or_truncate(resource, owners, statement):
    with pytest.raises(DBAPIError) as error, resource.transaction(owners[0]) as session:
        session.execute(statement)
    assert error.value.orig.sqlstate == "42501"


@pytest.mark.parametrize(
    "value",
    [
        [],
        {},
        {"selected_activity_ids": []},
        EMPTY | {"extra": True},
        EMPTY | {"selected_activity_ids": ["gym", "gym"]},
        EMPTY | {"selected_activity_ids": ["unknown"]},
        EMPTY | {"selected_activity_ids": [True]},
        EMPTY | {"selected_activity_ids": False},
        EMPTY | {"custom_text": " "},
        EMPTY | {"custom_text": "\u001c"},
        EMPTY | {"custom_text": " padded "},
        EMPTY | {"custom_text": "x" * 201},
        EMPTY | {"custom_text": 1},
    ],
)
def test_database_rejects_invalid_activity_shapes_and_values(resource, owners, value):
    with pytest.raises(IntegrityError) as error, resource.transaction(owners[0]) as session:
        session.execute(update(UserSettings).values(activities=value))
    assert error.value.orig.sqlstate == "23514"


@pytest.mark.parametrize(
    "value",
    [
        [],
        {},
        DRAFT | {"extra": True},
        DRAFT | {"weekdays": [0, 0]},
        DRAFT | {"weekdays": [True]},
        DRAFT | {"weekdays": [7]},
        DRAFT | {"weekdays": None},
        DRAFT | {"session_count": 0},
        DRAFT | {"session_count": True},
        DRAFT | {"session_minutes": 1441},
        DRAFT | {"session_minutes": "5"},
        DRAFT | {"timezone_id": ""},
        DRAFT | {"timezone_id": "../UTC"},
        DRAFT | {"timezone_id": False},
        DRAFT | {"hours": []},
        DRAFT | {"hours": {"start_local": "24:00", "end_local": None, "next_day": False}},
        DRAFT | {"hours": {"start_local": "23:00", "end_local": "07:00", "next_day": False}},
        DRAFT | {"hours": {"start_local": "07:00", "end_local": "07:00", "next_day": True}},
        DRAFT | {"hours": {"start_local": None, "end_local": None, "next_day": 0}},
    ],
)
def test_database_rejects_invalid_plan_structure_and_entered_bounds(resource, owners, value):
    with pytest.raises(IntegrityError) as error, resource.transaction(owners[0]) as session:
        session.execute(update(UserSettings).values(plan_draft=value))
    assert error.value.orig.sqlstate == "23514"


@pytest.mark.parametrize("case", FIXTURES["valid_patches"], ids=lambda case: case["id"])
def test_canonical_sections_round_trip_as_data_without_changing_profile(resource, owners, case):
    body = deepcopy(case["canonical"])
    changes = {key: value for key, value in body.items() if key != "expected_revision"}
    if "activities" in changes and changes["activities"] is None:
        changes["activities"] = EMPTY
    with resource.transaction(owners[0]) as session:
        original_profile = session.scalar(select(Profile.display_name))
        session.execute(update(UserSettings).values(**changes))
    with resource.transaction(owners[0]) as session:
        row = session.scalar(select(UserSettings))
        assert row.activities == changes.get("activities", EMPTY)
        assert row.plan_draft == changes.get("plan_draft")
        assert row.revision == 1  # No hidden revision allocator/activation trigger.
        assert session.scalar(select(Profile.display_name)) == original_profile


@pytest.mark.parametrize("revision", [0, -1, None])
def test_positive_nonnull_revision_constraint(resource, owners, revision):
    with pytest.raises(IntegrityError), resource.transaction(owners[0]) as session:
        session.execute(update(UserSettings).values(revision=revision))


def test_own_auth_fk_and_storage_only_cascade_preserve_the_other_account(
    resource, owners, db_environment
):
    missing = VerifiedIdentity(uuid4(), None)
    with pytest.raises(IntegrityError) as error, resource.transaction(missing) as session:
        session.add(UserSettings(user_id=missing.user_id))
    assert error.value.orig.sqlstate == "23503"
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (owners[0].user_id,))
    with resource.transaction(owners[0]) as session:
        assert session.scalars(select(UserSettings)).all() == []
    with resource.transaction(owners[1]) as session:
        assert session.scalar(select(UserSettings.user_id)) == owners[1].user_id
        assert session.scalar(select(Profile.user_id)) == owners[1].user_id


def test_server_clocks_override_supplied_values_and_created_at_is_immutable(resource, owners):
    epoch = datetime(1970, 1, 1, tzinfo=UTC)
    with resource.transaction(owners[2]) as session:
        original, updated = session.execute(
            insert(UserSettings)
            .values(user_id=owners[2].user_id, created_at=epoch, updated_at=epoch)
            .returning(UserSettings.created_at, UserSettings.updated_at)
        ).one()
        assert original == updated and original > epoch and original.tzinfo is not None
    with resource.transaction(owners[2]) as session:
        created, updated = session.execute(
            update(UserSettings)
            .values(created_at=epoch, updated_at=epoch)
            .returning(UserSettings.created_at, UserSettings.updated_at)
        ).one()
        assert created == original and updated >= original


@pytest.mark.parametrize(
    "mutation",
    [
        "ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY",
        "ALTER TABLE public.user_settings NO FORCE ROW LEVEL SECURITY",
        "ALTER POLICY settings_update_own ON public.user_settings WITH CHECK (true)",
        "GRANT SELECT ON public.user_settings TO authenticated",
        "GRANT DELETE ON public.user_settings TO disconnect_api",
        "GRANT SELECT(activities) ON public.user_settings TO service_role",
        "ALTER TABLE public.user_settings DROP CONSTRAINT ck_user_settings_activity_ids_valid",
        "ALTER TABLE public.user_settings DROP CONSTRAINT ck_user_settings_revision_positive; "
        "ALTER TABLE public.user_settings ADD CONSTRAINT ck_user_settings_revision_positive "
        "CHECK (revision >= 0)",
        "ALTER TABLE public.user_settings DISABLE TRIGGER settings_server_times",
        "ALTER FUNCTION public.disconnect_settings_server_times() SECURITY DEFINER",
        "GRANT EXECUTE ON FUNCTION public.disconnect_settings_server_times() TO PUBLIC",
        "CREATE TRIGGER settings_extra_times BEFORE INSERT ON public.user_settings "
        "FOR EACH ROW EXECUTE FUNCTION public.disconnect_settings_server_times()",
    ],
)
def test_settings_security_drift_is_rejected_and_rollback_restores_verified_head(
    migration_engine, mutation
):
    with migration_engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text(mutation))
            with pytest.raises(MigrationSafetyError):
                verify(connection)
        finally:
            transaction.rollback()
        with connection.begin():
            assert verify(connection)["revision"] == HEAD


def test_upgrade_from_profile_head_and_disposable_settings_downgrade_preserve_profile(
    migration_engine,
):
    with migration_engine.connect() as connection:
        transaction = connection.begin()
        try:
            user = uuid4()
            connection.execute(text("INSERT INTO auth.users(id) VALUES (:id)"), {"id": user})
            connection.execute(
                text("INSERT INTO public.profiles(user_id,display_name) VALUES (:id,'Preserved')"),
                {"id": user},
            )
            command.downgrade(config(connection), "20261102_0001")
            assert connection.scalar(text("SELECT to_regclass('public.user_settings')")) is None
            assert (
                connection.scalar(
                    text("SELECT to_regprocedure('public.disconnect_settings_server_times()')")
                )
                is None
            )
            assert (
                connection.scalar(
                    text("SELECT display_name FROM public.profiles WHERE user_id=:id"), {"id": user}
                )
                == "Preserved"
            )
            assert run(connection)["revision"] == HEAD
            assert run(connection, "check")["revision"] == HEAD
            assert connection.scalar(text("SELECT count(*) FROM public.user_settings")) == 0
        finally:
            transaction.rollback()


@pytest.mark.parametrize("role", ["anon", "authenticated", "service_role"])
def test_data_api_roles_cannot_read_settings_even_with_bypass_rls(db_environment, role):
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            with admin.transaction(force_rollback=True):
                admin.execute("SET LOCAL ROLE " + role)  # Fixed test enum only.
                admin.execute("SELECT * FROM public.user_settings")


def test_sql_null_clears_a_draft_but_json_scalar_null_is_not_a_draft_object(resource, owners):
    with resource.transaction(owners[0]) as session:
        session.execute(update(UserSettings).values(plan_draft=None))
        assert session.scalar(select(UserSettings.plan_draft)) is None
    with pytest.raises(IntegrityError), resource.transaction(owners[0]) as session:
        session.execute(update(UserSettings).values(plan_draft=JSON.NULL))


@pytest.mark.parametrize("custom", ["🦖" * 200, "e\u0301" * 100, "\ufeffretained"])
def test_database_preserves_codepoint_bounded_unicode_custom_text(resource, owners, custom):
    with resource.transaction(owners[0]) as session:
        session.execute(update(UserSettings).values(activities=EMPTY | {"custom_text": custom}))
        assert session.scalar(select(UserSettings.activities))["custom_text"] == custom
