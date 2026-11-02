"""Pure runtime URL policy. Migration/admin credentials are never an input."""

import re
from pathlib import Path
from urllib.parse import urlsplit

from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError


def runtime_database_url(value: str, *, app_env: str, project_origin: str | None) -> URL:
    """Return a driver-pinned URL or a safe error without the credential-bearing input."""
    if (
        not value.startswith(("postgresql://", "postgres://", "postgresql+psycopg://"))
        or re.search(r"[\s\x00-\x1f\x7f]", value)
        or urlsplit(value).fragment
    ):
        raise ValueError("Use an explicit PostgreSQL runtime URI")
    try:
        target = make_url(value)
        port = target.port or 5432
    except (ArgumentError, ValueError):
        raise ValueError("Invalid runtime database URI; value withheld") from None
    if (
        not target.password
        or set(target.query) - {"sslmode", "sslrootcert"}
        or any(not isinstance(v, str) or not v for v in target.query.values())
    ):
        raise ValueError("Runtime URI requires its own password and explicit TLS options only")
    if target.host in {"127.0.0.1", "localhost"}:
        if (
            app_env != "test"
            or port != 55432
            or target.database != "disconnect_test"
            or target.username != "disconnect_api"
            or dict(target.query) != {"sslmode": "disable"}
        ):
            raise ValueError("Unencrypted local access is restricted to the disposable test target")
    else:
        project_host = urlsplit(project_origin or "").hostname or ""
        if not re.fullmatch(r"[a-z0-9]{20}\.supabase\.co", project_host):
            raise ValueError("Remote database access requires the explicit Supabase project origin")
        project = project_host.split(".")[0]
        direct = target.host == f"db.{project}.supabase.co"
        pooler = bool(re.fullmatch(r"[a-z0-9-]+\.pooler\.supabase\.com", target.host or ""))
        expected_user = "disconnect_api" if direct else f"disconnect_api.{project}"
        ca = Path(target.query.get("sslrootcert", ""))
        if (
            not (direct or pooler)
            or port != 5432
            or target.database != "postgres"
            or target.username != expected_user
            or target.query.get("sslmode") != "verify-full"
            or not ca.is_absolute()
            or not ca.is_file()
        ):
            raise ValueError(
                "Remote runtime requires the pinned role, session/direct mode and verified CA"
            )
    return target.set(drivername="postgresql+psycopg", port=port)
