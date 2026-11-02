"""Guarded disposable prerequisites; no product schema/Alembic is fabricated."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from psycopg import sql
from sqlalchemy import Column, ForeignKey, MetaData, Table, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.config import Settings
from app.core.identity import VerifiedIdentity
from app.db.engine import Database
from app.models import Profile
from tests.auth.support import LocalSigner, settings
from tests.support import database
from tests.support.http import authenticated_app


@pytest.fixture
def db_environment(migrated_database):
    values = dict(migrated_database)
    # Scope/identity/major validated before an engine or any fixture DDL exists.
    with database.connect(values, "TEST_MIGRATION_DATABASE_URL"):
        pass
    return values


@pytest.fixture
def db_settings(db_environment):
    return Settings(
        _env_file=None,
        app_env="test",
        database_url=db_environment["TEST_DATABASE_URL"],
        db_pool_size=1,
    )


@pytest.fixture
def resource(db_settings):
    value = Database(db_settings)
    try:
        yield value
    finally:
        value.close()


@pytest.fixture
def probe(db_environment):
    """Two task-owned test_support tables, with a REAL deferred commit constraint."""
    parent_name, child_name = "api06_parent_" + uuid4().hex, "api06_probe_" + uuid4().hex
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute(
            sql.SQL("CREATE TABLE test_support.{} (id uuid PRIMARY KEY)").format(
                sql.Identifier(parent_name)
            )
        )
        try:
            admin.execute(
                sql.SQL(
                    "CREATE TABLE test_support.{} (id uuid PRIMARY KEY, value text, "
                    "parent_id uuid REFERENCES test_support.{} (id) "
                    "DEFERRABLE INITIALLY DEFERRED)"
                ).format(sql.Identifier(child_name), sql.Identifier(parent_name))
            )
            for name in (parent_name, child_name):
                admin.execute(
                    sql.SQL(
                        "GRANT SELECT, INSERT, UPDATE ON test_support.{} TO disconnect_api"
                    ).format(sql.Identifier(name))
                )
            metadata = MetaData(schema="test_support")
            parent = Table(parent_name, metadata, Column("id", UUID, primary_key=True))
            child = Table(
                child_name,
                metadata,
                Column("id", UUID, primary_key=True),
                Column("value", Text),
                Column(
                    "parent_id",
                    UUID,
                    ForeignKey(parent.c.id, deferrable=True, initially="DEFERRED"),
                ),
            )
            yield child
        finally:
            # The guard above is required; only these generated names are removed.
            admin.execute(
                sql.SQL("DROP TABLE IF EXISTS test_support.{}").format(sql.Identifier(child_name))
            )
            admin.execute(sql.SQL("DROP TABLE test_support.{}").format(sql.Identifier(parent_name)))


@pytest.fixture
def profile_accounts(resource, db_environment):
    identities = [VerifiedIdentity(uuid4(), None) for _ in range(3)]
    users = [identity.user_id for identity in identities]
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        for user in users:
            admin.execute("INSERT INTO auth.users(id) VALUES (%s)", (user,))
        try:
            for identity, name in zip(identities[:2], ("A private 😀", None), strict=True):
                with resource.transaction(identity) as session:
                    session.add(Profile(user_id=identity.user_id, display_name=name))
            yield identities
        finally:
            admin.execute("DELETE FROM auth.users WHERE id=ANY(%s)", (users,))


@pytest.fixture
def profile_client(monkeypatch, db_settings):
    signer = LocalSigner()
    app, _ = authenticated_app(
        monkeypatch, settings(**db_settings.model_dump(exclude_none=True)), signer=signer
    )
    with TestClient(app) as client:
        yield client, app.state.database, signer
