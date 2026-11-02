"""Sync FastAPI dependency: commit/rollback before the response is sent."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request

from app.api.v1.dependencies import verified_identity
from app.core.errors import ApiError
from app.core.identity import VerifiedIdentity
from app.db.engine import Database
from app.db.session import UserSession
from app.schemas.errors import ErrorCode


def database(request: Request) -> Database:
    resource = request.app.state.database
    if resource is None or resource.closed:
        raise ApiError(ErrorCode.DEPENDENCY_UNAVAILABLE)
    return resource


def user_session(
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
    resource: Annotated[Database, Depends(database)],
) -> Iterator[UserSession]:
    with resource.transaction(identity) as session:
        yield session


UserSessionDependency = Annotated[UserSession, Depends(user_session, scope="function")]
