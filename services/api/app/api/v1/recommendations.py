"""Own temporary offer and explicit durable decisions, using the normal JWT boundary."""

from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.domain.ai_nudges import NudgeCopy, Tone, cached_holiday_nudge_copy, cached_nudge_copy, cached_quest_copy
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


@router.get("/nudge-copy", response_model=NudgeCopy | None, responses=errors)
def nudge_copy(
    request: Request,
    activity: str,
    tone: Tone,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
    holiday: str | None = None,
    quest_minutes: Literal["5", "10", "15", "20"] | None = None,
    quest_task: bool = False,
):
    # The signed-in caller chooses from the same finite vocabulary as Settings.
    settings = getattr(request.app.state, "settings", None)
    if quest_minutes is not None:
        return cached_quest_copy(settings, activity, tone, int(quest_minutes), quest_task)
    if holiday is not None:
        return cached_holiday_nudge_copy(settings, activity, tone, holiday)
    return cached_nudge_copy(settings, activity, tone)
