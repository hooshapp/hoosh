from datetime import UTC, datetime
from uuid import uuid4

import pytest
from sqlalchemy import delete, insert, select, text, update
from sqlalchemy.exc import DBAPIError, IntegrityError

from app.core.identity import VerifiedIdentity
from app.db.session import DatabaseContextError, UserSession
from app.models import Profile
from tests.auth.support import USER_A, USER_B
from tests.support import database

pytestmark = pytest.mark.database


@pytest.fixture
def accounts(resource, db_environment):
    identities = [VerifiedIdentity(value, None) for value in (USER_A, USER_B, uuid4())]
    users = [identity.user_id for identity in identities]
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        for user in users:
            admin.execute("INSERT INTO auth.users(id) VALUES (%s)", (user,))
        try:
            for identity in identities[:2]:
                with resource.transaction(identity) as session:
                    session.add(Profile(user_id=identity.user_id, display_name="Original"))
            yield identities
        finally:
            admin.execute("DELETE FROM auth.users WHERE id=ANY(%s)", (users,))


def test_actual_runtime_rls_without_repository_owner_predicates(resource, accounts):
    a, b, _ = accounts
    for identity in (a, b, a):
        with resource.transaction(identity) as session:
            # Deliberately omit WHERE: the real runtime role and RLS must enforce ownership.
            assert session.scalars(select(Profile.user_id)).all() == [identity.user_id]
            updated = (
                session.execute(
                    update(Profile).values(display_name="Own edit").returning(Profile.user_id)
                )
                .scalars()
                .all()
            )
            assert updated == [identity.user_id]
            other = b if identity == a else a
            assert (
                session.scalars(select(Profile).where(Profile.user_id == other.user_id)).all() == []
            )
            assert (
                session.execute(
                    update(Profile)
                    .where(Profile.user_id == other.user_id)
                    .values(display_name="Must not change")
                ).rowcount
                == 0
            )


def test_with_check_rejects_other_owner_insert_and_owner_reassignment(resource, accounts):
    a, _, c = accounts
    for statement in [
        insert(Profile).values(user_id=c.user_id, display_name="Wrong owner"),
        update(Profile).values(user_id=c.user_id),
    ]:
        with pytest.raises(DBAPIError) as error:
            with resource.transaction(a) as session:
                session.execute(statement)
        assert error.value.orig.sqlstate == "42501"
    with resource.transaction(c) as session:
        assert session.scalars(select(Profile)).all() == []


@pytest.mark.parametrize("context", [None, ""])
def test_raw_runtime_without_user_context_is_database_default_deny(resource, accounts, context):
    with resource.engine.begin() as connection:
        if context is not None:
            connection.execute(
                text("SELECT set_config('app.user_id',:value,true)"), {"value": context}
            )
        assert connection.execute(select(Profile)).all() == []
        assert connection.execute(update(Profile).values(display_name="No context")).rowcount == 0
    with pytest.raises(DBAPIError) as error:
        with resource.engine.begin() as connection:
            connection.execute(insert(Profile).values(user_id=accounts[0].user_id))
    assert error.value.orig.sqlstate == "42501"


def test_missing_python_unit_is_invariant_error_not_a_missing_profile(resource, accounts):
    with UserSession(resource.engine, autobegin=False) as session:
        with pytest.raises(DatabaseContextError), session.begin():
            session.execute(select(Profile))


def test_runtime_has_no_delete_truncate_or_migration_metadata_access(resource, accounts):
    for statement in [
        delete(Profile),
        text("TRUNCATE public.profiles"),
        text("SELECT * FROM public.alembic_version"),
    ]:
        with pytest.raises(DBAPIError) as error:
            with resource.transaction(accounts[0]) as session:
                session.execute(statement)
        assert error.value.orig.sqlstate == "42501"


@pytest.mark.parametrize(
    "name", ["", " ", "\t", "\u001c", "\u0085", "\u00a0", "\u3000", " x", "x\u202f", "x" * 81]
)
def test_storage_rejects_noncanonical_or_unbounded_name(resource, accounts, name):
    with pytest.raises(IntegrityError) as error:
        with resource.transaction(accounts[0]) as session:
            session.execute(update(Profile).values(display_name=name))
    assert error.value.orig.sqlstate == "23514"


@pytest.mark.parametrize("name", [None, "😀" * 80, "e\u0301" * 40, "\ufeffname", "x\u200by"])
def test_storage_preserves_nullable_and_unicode_codepoint_names(resource, accounts, name):
    with resource.transaction(accounts[0]) as session:
        session.execute(update(Profile).values(display_name=name))
        assert session.scalar(select(Profile.display_name)) == name


@pytest.mark.parametrize("revision", [0, -1, None])
def test_revision_must_be_positive_and_nonnull(resource, accounts, revision):
    with pytest.raises(IntegrityError):
        with resource.transaction(accounts[0]) as session:
            session.execute(update(Profile).values(revision=revision))


def test_foreign_key_and_storage_only_auth_deletion_cascade(resource, accounts, db_environment):
    missing = VerifiedIdentity(uuid4(), None)
    with pytest.raises(IntegrityError) as error:
        with resource.transaction(missing) as session:
            session.add(Profile(user_id=missing.user_id))
    assert error.value.orig.sqlstate == "23503"
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (accounts[0].user_id,))
    with resource.transaction(accounts[0]) as session:
        assert session.scalars(select(Profile)).all() == []
    with resource.transaction(accounts[1]) as session:
        assert session.scalars(select(Profile.user_id)).all() == [accounts[1].user_id]


def test_clocks_are_server_owned_and_created_at_is_immutable(resource, accounts):
    a, _, c = accounts
    fake = datetime(1970, 1, 1, tzinfo=UTC)
    with resource.transaction(c) as session:
        created, updated = session.execute(
            insert(Profile)
            .values(user_id=c.user_id, created_at=fake, updated_at=fake)
            .returning(Profile.created_at, Profile.updated_at)
        ).one()
        assert created.tzinfo and updated.tzinfo and created == updated and created != fake
    with resource.transaction(c) as session:
        created2, updated2 = session.execute(
            update(Profile)
            .values(created_at=fake, updated_at=fake, display_name="New")
            .returning(Profile.created_at, Profile.updated_at)
        ).one()
        assert created2 == created and updated2 >= updated and updated2 != fake
        assert session.scalar(select(Profile.revision)) == 1
