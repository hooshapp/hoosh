"""Verified owner History reads and explicit aggregate-series writes."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.repositories import history
from app.schemas.errors import ErrorEnvelope
from app.schemas.history import HistoryPut, HistoryView

router = APIRouter(prefix="/v1/history", tags=["history"])
errors = {status: {"model": ErrorEnvelope} for status in (401, 403, 409, 413, 422, 503)}


@router.get("", response_model=HistoryView, operation_id="get_own_history", responses=errors)
def read(session: UserSessionDependency):
    return history.view(session, datetime.now(UTC))


@router.put(
    "/series", response_model=HistoryView, operation_id="save_own_history_series", responses=errors
)
def save(
    body: HistoryPut,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
):
    with database(request).transaction(identity) as session:
        result = history.save(session, body, datetime.now(UTC))
    return result
