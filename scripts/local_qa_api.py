"""Local-only auth fixture bridge. Not imported by production application code."""

from pathlib import Path
from typing import Annotated
from uuid import UUID

import psycopg
from app.api.v1.dependencies import access_token_scheme, verified_identity
from app.runtime import create_app
from fastapi import Request, Security
from fastapi.security import HTTPAuthorizationCredentials
from starlette.concurrency import run_in_threadpool

ROOT = Path(__file__).resolve().parents[1]
app = create_app()


def mirror_verified_local_identity(user_id):
    assert isinstance(user_id, UUID)
    with psycopg.connect(
        host="127.0.0.1",
        port=55432,
        user="postgres",
        password=(ROOT / ".native-dev/c06-db/init-password").read_text().strip(),
        dbname="disconnect_test",
        connect_timeout=5,
    ) as connection:
        assert connection.info.server_version // 10000 == 17
        assert connection.execute(
            "SELECT scope FROM test_support.environment"
        ).fetchall() == [("disconnect-isolated-postgres-v1",)]
        connection.execute(
            "INSERT INTO auth.users(id) VALUES (%s) ON CONFLICT DO NOTHING", (user_id,)
        )


async def local_identity(
    request: Request,
    _credentials: Annotated[
        HTTPAuthorizationCredentials | None, Security(access_token_scheme)
    ],
):
    identity = await verified_identity(request, _credentials)
    await run_in_threadpool(mirror_verified_local_identity, identity.user_id)
    return identity


# Signature/project/expiry verification remains the original authority. Only verified UUIDs
# are mirrored into the disposable loopback FK fixture, with no emails/passwords/tokens.
app.dependency_overrides[verified_identity] = local_identity
