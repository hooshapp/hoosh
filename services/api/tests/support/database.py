"""Fail-closed disposable target validation, before any connection or cleanup."""

import os
from collections.abc import Mapping
from pathlib import Path

import psycopg
from dotenv import dotenv_values
from psycopg.conninfo import conninfo_to_dict

SCOPE = "disconnect-isolated-postgres-v1"


def environment() -> dict:
    values = dotenv_values(Path(__file__).resolve().parents[1] / ".env", interpolate=False)
    for key in ("APP_ENV", "TEST_DATABASE_URL", "TEST_MIGRATION_DATABASE_URL"):
        if key in os.environ:
            values[key] = os.environ[key]
    return values


def parameters(environment: Mapping[str, str], key: str) -> dict:
    if environment.get("APP_ENV") != "test":
        raise ValueError("Database checks require explicit APP_ENV=test")
    if key not in {"TEST_DATABASE_URL", "TEST_MIGRATION_DATABASE_URL"}:
        raise ValueError("Only explicit disposable connection variables are supported")
    uri = environment.get(key, "")
    if not uri.startswith(("postgresql://", "postgres://")):
        raise ValueError(f"Supply {key}; no runtime/migration fallback is permitted")
    try:
        values = conninfo_to_dict(uri)
    except psycopg.Error:
        raise ValueError("Invalid disposable database URI; value withheld") from None
    expected_user = "disconnect_api" if key == "TEST_DATABASE_URL" else "postgres"
    if (
        set(values) - {"host", "port", "dbname", "user", "password", "sslmode"}
        or values.get("host") not in {"127.0.0.1", "localhost"}
        or values.get("port") != "55432"
        or values.get("dbname") != "disconnect_test"
        or values.get("user") != expected_user
        or not values.get("password")
        or values.get("sslmode") != "disable"
    ):
        raise ValueError("Disposable target must match loopback/55432/disconnect_test/role")
    return values | {
        "connect_timeout": 5,
        "application_name": "disconnect_isolated_tests",
        "options": "-c statement_timeout=5000 -c lock_timeout=2000",
    }


def connect(environment: Mapping[str, str], key: str):
    if key not in {"TEST_DATABASE_URL", "TEST_MIGRATION_DATABASE_URL"}:
        raise ValueError("Only disposable database variables are accepted")
    # Validate BOTH URLs first, so an accidental managed URL cannot be half accepted.
    runtime = parameters(environment, "TEST_DATABASE_URL")
    admin = parameters(environment, "TEST_MIGRATION_DATABASE_URL")
    if any(runtime[k] != admin[k] for k in ("host", "port", "dbname")):
        raise ValueError("Disposable runtime and migration targets must match")
    connection = None
    try:
        connection = psycopg.connect(
            **(runtime if key == "TEST_DATABASE_URL" else admin), autocommit=True
        )
        marker = connection.execute("SELECT scope FROM test_support.environment").fetchall()
        if marker != [(SCOPE,)]:
            raise ValueError("Disposable database marker is missing or unexpected")
        if connection.info.server_version // 10000 != 17:
            raise ValueError("Disposable database major must match managed PostgreSQL 17")
        return connection
    except (psycopg.Error, ValueError) as error:
        if connection is not None:
            connection.close()
        raise ValueError(
            f"Disposable database validation failed ({type(error).__name__})"
        ) from None
