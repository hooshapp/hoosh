"""Own temporary offer and explicit durable decisions, using the normal JWT boundary."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.repositories import recommendations
from app.schemas.errors import ErrorEnvelope
from app.schemas.recommendations import RecommendationAction, RecommendationView

router = APIRouter(prefix="/v1/recommendations", tags=["recommendations"])
errors = {status: {"model": ErrorEnvelope} for status in (401, 403, 409, 413, 422, 503)}


@router.get(
    "/current",
    response_model=RecommendationView,
    operation_id="get_own_recommendation",
    responses=errors,
)
def current(session: UserSessionDependency):
    return recommendations.current(session, datetime.now(UTC))


@router.put(
    "/decision",
    response_model=RecommendationView,
    operation_id="decide_own_recommendation",
    responses=errors,
)
def decide(
    body: RecommendationAction,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
):
    with database(request).transaction(identity) as session:
        result = recommendations.decide(session, body, datetime.now(UTC))
    return result
