"""Deterministic tests never inherit a developer's provider settings."""

import pytest

from app.core.config import Settings


@pytest.fixture(scope="session")
def migrated_database():
    from sqlalchemy import create_engine
    from sqlalchemy.pool import NullPool

    from app.core.database_config import migration_database_url
    from app.db.migrations import run
    from tests.support import database

    values = database.environment()
    with database.connect(values, "TEST_MIGRATION_DATABASE_URL"):
        pass
    target = migration_database_url(
        values["TEST_MIGRATION_DATABASE_URL"], app_env="test", project_origin=None
    )
    engine = create_engine(
        target,
        poolclass=NullPool,
        hide_parameters=True,
        connect_args={"options": "-c search_path=pg_catalog -c lock_timeout=5000"},
    )
    try:
        with engine.begin() as connection:
            run(connection)
    finally:
        engine.dispose()
    return values


@pytest.fixture(autouse=True)
def isolated_runtime_environment(monkeypatch, request):
    if request.node.get_closest_marker("database"):
        request.getfixturevalue("migrated_database")
        # DB acceptance requires its explicitly supplied APP_ENV=test, not Settings.
        return
    for name in Settings.model_fields:
        monkeypatch.delenv(name.upper(), raising=False)
