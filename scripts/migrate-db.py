"""Run one Alembic product history through explicit private/test credentials."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services/api"))

from alembic import command
from app.core.database_config import migration_database_url
from app.db.migrations import MigrationSafetyError, config, offline_sql, run
from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["sql", "upgrade", "check", "downgrade-test"])
    parser.add_argument("--target", choices=["test", "development"])
    parser.add_argument("--project")
    args = parser.parse_args()
    try:
        if args.action == "sql":
            print(offline_sql(), end="")
            return
        if not args.target:
            raise MigrationSafetyError("Choose the explicit test or development target")
        if args.target == "test":
            from tests.support import database

            values = database.environment()
            with database.connect(values, "TEST_MIGRATION_DATABASE_URL"):
                pass
            uri = values["TEST_MIGRATION_DATABASE_URL"]
            origin, app_env = None, "test"
        else:
            if args.action == "downgrade-test":
                raise MigrationSafetyError(
                    "Downgrade is exposed only for the disposable test target"
                )
            values = dotenv_values(ROOT / "services/api/.env", interpolate=False)
            origin, app_env = values.get("SUPABASE_PROJECT_URL"), values.get("APP_ENV")
            if (
                app_env != "development"
                or not args.project
                or origin != f"https://{args.project}.supabase.co"
            ):
                raise MigrationSafetyError(
                    "Pin the exact development project before migrating"
                )
            uri = values.get("MIGRATION_DATABASE_URL") or ""
        target = migration_database_url(uri, app_env=app_env, project_origin=origin)
        engine = create_engine(
            target,
            poolclass=NullPool,
            hide_parameters=True,
            logging_name="disconnect_migrations",
            pool_logging_name="disconnect_migrations",
            connect_args={
                "connect_timeout": 5,
                "application_name": "disconnect_migrations",
                "options": "-c search_path=pg_catalog -c statement_timeout=30000 -c lock_timeout=5000",
            },
        )
        engine.logger.disabled = engine.pool.logger.disabled = True
        try:
            with engine.begin() as connection:
                if args.action == "downgrade-test":
                    command.downgrade(config(connection), "base")
                    report = {"disposableDowngrade": "base"}
                else:
                    report = run(connection, args.action)
        finally:
            engine.dispose()
        print(json.dumps(report, indent=2))
    except MigrationSafetyError as error:
        raise SystemExit(str(error)) from None
    except Exception as error:  # noqa: BLE001 - never expose credential/SQL-bearing driver text
        raise SystemExit(
            f"Migration failed ({type(error).__name__}); private details withheld"
        ) from None


if __name__ == "__main__":
    main()
