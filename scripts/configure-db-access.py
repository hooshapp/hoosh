"""Private SB-04 connection handoff. Never prints connection strings or DB errors."""

import argparse
import json
import os
import re
import secrets
from pathlib import Path
from urllib.parse import quote, urlencode

import psycopg
from dotenv import dotenv_values, set_key
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / "services/api/.env"
BOOTSTRAP = ROOT / "services/api/db/bootstrap"


class HandoffError(ValueError):
    """Server-owned diagnostic; never includes raw driver text or credentials."""


def connection_parameters(
    uri: str, project: str, *, runtime: bool, root_cert: str
) -> dict:
    if not re.fullmatch(r"[a-z0-9]{20}", project):
        raise HandoffError("Expected the explicitly selected project reference")
    if not uri.startswith(("postgresql://", "postgres://")):
        raise HandoffError("Use a PostgreSQL URI from Dashboard Connect")
    try:
        values = conninfo_to_dict(uri)
    except psycopg.Error:
        raise HandoffError("Invalid connection URI; value withheld") from None
    if set(values) - {
        "host",
        "port",
        "dbname",
        "user",
        "password",
        "sslmode",
        "sslrootcert",
    }:
        raise HandoffError("Unexpected URI options; review privately")
    host = values.get("host", "")
    direct = host == f"db.{project}.supabase.co"
    pooler = bool(re.fullmatch(r"[a-z0-9-]+\.pooler\.supabase\.com", host))
    role = "disconnect_api" if runtime else "postgres"
    expected_user = role if direct else f"{role}.{project}"
    if (
        not (direct or pooler)
        or values.get("port", "5432") != "5432"
        or values.get("dbname") != "postgres"
        or values.get("user") != expected_user
        or not values.get("password")
        or "[YOUR-PASSWORD]" in values["password"]
    ):
        raise HandoffError(
            "Connection target/role/password does not match development contract"
        )
    ca = Path(root_cert).expanduser().resolve()
    if not ca.is_file():
        raise HandoffError(
            "Save the dashboard root certificate to the supplied local path"
        )
    return values | {
        "port": "5432",
        "sslmode": "verify-full",
        "sslrootcert": str(ca),
        "connect_timeout": 5,
        "application_name": "disconnect_sb04",
        "options": "-c statement_timeout=5000 -c lock_timeout=2000",
    }


def private_uri(values: dict) -> str:
    # Canonical encoding prevents passwords/query values from changing URI syntax.
    query = urlencode(
        {"sslmode": "verify-full", "sslrootcert": values["sslrootcert"]},
        quote_via=quote,
    )
    return (
        f"postgresql://{quote(values['user'], safe='')}:{quote(values['password'], safe='')}"
        f"@{values['host']}:5432/postgres?{query}"
    )


def connect(values: dict):
    try:
        connection = psycopg.connect(**values)
    except psycopg.OperationalError as error:
        message = str(error).lower()
        if "password authentication failed" in message:
            raise HandoffError(
                "Supabase rejected the database password; correct it privately"
            ) from None
        if "certificate" in message or "ssl error" in message:
            raise HandoffError(
                "TLS verification failed; review the exact host and trusted CA"
            ) from None
        if "timeout" in message:
            raise HandoffError(
                "Database connection timed out; check network/project availability"
            ) from None
        raise HandoffError(
            "Database connection failed; review target and credentials privately"
        ) from None
    if not connection.pgconn.ssl_in_use:
        connection.close()
        raise HandoffError("Remote connection must use verified TLS")
    return connection


def configure(project: str, root_cert: str, initialize: bool) -> dict:
    values = dotenv_values(ENV, interpolate=False)
    if values.get("APP_ENV") != "development":
        raise HandoffError("This bootstrap is development-only")
    if values.get("SUPABASE_PROJECT_URL") != f"https://{project}.supabase.co":
        raise HandoffError(
            "Selected project differs from the backend trust configuration"
        )
    admin = connection_parameters(
        values.get("MIGRATION_DATABASE_URL") or "",
        project,
        runtime=False,
        root_cert=root_cert,
    )
    with connect(admin) as connection:
        if connection.info.server_version // 10000 != 17:
            raise HandoffError("Review the database major version before bootstrapping")
        with connection.cursor(row_factory=psycopg.rows.dict_row) as cursor:
            cursor.execute((BOOTSTRAP / "verify.sql").read_text())
            report = cursor.fetchone()
        if (
            not report
            or not 1 <= report["rolconnlimit"] <= 10
            or any(
                report[k]
                for k in (
                    "rolsuper",
                    "rolcreatedb",
                    "rolcreaterole",
                    "rolinherit",
                    "rolreplication",
                    "rolbypassrls",
                    "can_create_schema",
                    "public_create",
                    "memberships",
                    "owned_relations",
                    "owned_schemas",
                    "accessible_auth_relations",
                )
            )
            or not (
                report["rolcanlogin"]
                and report["can_connect"]
                and report["public_usage"]
            )
        ):
            raise HandoffError(
                "Bootstrap catalog checks failed; review role privileges"
            )
        if initialize:
            if values.get("DATABASE_URL"):
                raise HandoffError(
                    "Runtime URL already exists; refusing implicit password rotation"
                )
            runtime = admin | {
                "user": admin["user"].replace("postgres", "disconnect_api", 1),
                "password": secrets.token_urlsafe(48),
            }
            encrypted = connection.pgconn.encrypt_password(
                runtime["password"].encode(), b"disconnect_api", b"scram-sha-256"
            ).decode()
            # Same client-side SCRAM mechanism used by psql \password. No plaintext SQL.
            connection.execute(
                sql.SQL("ALTER ROLE disconnect_api PASSWORD {} ").format(
                    sql.Literal(encrypted)
                )
            )
            # Persist privately before commit so file-write failures roll back SQL.
            os.chmod(ENV, 0o600)
            set_key(ENV, "DATABASE_URL", private_uri(runtime))
        else:
            runtime = connection_parameters(
                values.get("DATABASE_URL") or "",
                project,
                runtime=True,
                root_cert=root_cert,
            )
    # Never use the administrator connection for runtime acceptance.
    with connect(runtime) as connection:
        connection.autocommit = True
        connection.execute((BOOTSTRAP / "check-permissions.sql").read_text())
    set_key(ENV, "MIGRATION_DATABASE_URL", private_uri(admin))
    os.chmod(ENV, 0o600)
    return {
        "project": project,
        "connectionMode": "session-pooler" if ".pooler." in admin["host"] else "direct",
        "host": admin["host"],
        "port": 5432,
        "verifiedTls": True,
        "runtimeLoginAndPermissionChecks": "passed",
        "passwordInitialized": initialize,
        "catalog": report,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--root-cert", required=True)
    parser.add_argument("--initialize-runtime-password", action="store_true")
    args = parser.parse_args()
    try:
        report = configure(
            args.project, args.root_cert, args.initialize_runtime_password
        )
    except HandoffError as error:
        raise SystemExit(str(error)) from None
    except Exception as error:  # noqa: BLE001 - redact all credential-bearing driver errors
        # Raw driver errors may contain URI/password/SQL; never emit them or a traceback.
        raise SystemExit(
            f"Database handoff failed ({type(error).__name__}); details withheld."
        )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
