"""Guarded disposable prerequisites; no product schema/Alembic is fabricated."""

import os
from pathlib import Path
from uuid import uuid4

import pytest
from dotenv import dotenv_values
from psycopg import sql
from sqlalchemy import Column, ForeignKey, MetaData, Table, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.config import Settings
from app.db.engine import Database
from tests.support import database


@pytest.fixture
def db_environment():
    values = dotenv_values(Path(__file__).resolve().parents[1] / ".env", interpolate=False)
    for key in ("APP_ENV", "TEST_DATABASE_URL", "TEST_MIGRATION_DATABASE_URL"):
        if key in os.environ:
            values[key] = os.environ[key]
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
