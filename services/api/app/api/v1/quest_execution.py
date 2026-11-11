"""Authenticated own schedule commands; native installation is explicitly separate."""

from datetime import UTC, date, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.repositories.quest_execution import execution, put_outcome, put_schedule
from app.schemas.errors import ErrorEnvelope
from app.schemas.quest_execution import (
    QuestExecutionView,
    QuestOutcomePut,
    QuestOutcomeView,
    QuestSchedulePut,
)

router = APIRouter(prefix="/v1/quests", tags=["quest-execution"])
errors = {status: {"model": ErrorEnvelope} for status in (401, 403, 409, 413, 422, 503)}


@router.get(
    "/{quest_id}/execution",
    response_model=QuestExecutionView,
    operation_id="get_own_quest_execution",
    responses=errors,
)
def get_execution(
    quest_id: UUID,
    session: UserSessionDependency,
    first: date | None = None,
    days: Annotated[int, Query(ge=1, le=31)] = 14,
):
    return execution(session, quest_id, datetime.now(UTC), first, days)


@router.put(
    "/{quest_id}/schedule",
    response_model=QuestExecutionView,
    operation_id="schedule_own_quest",
    responses=errors,
)
def schedule(
    quest_id: UUID,
    body: QuestSchedulePut,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
):
    with database(request).transaction(identity) as session:
        result = put_schedule(session, quest_id, body, datetime.now(UTC))
    return result


@router.put(
    "/{quest_id}/occurrences/{revision}/{day}",
    response_model=QuestOutcomeView,
    operation_id="record_own_quest_outcome",
    responses=errors,
)
def outcome(
    quest_id: UUID,
    revision: Annotated[int, Path(ge=1, le=2147483647)],
    day: date,
    body: QuestOutcomePut,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
):
    with database(request).transaction(identity) as session:
        row = put_outcome(session, quest_id, revision, day, body.state, datetime.now(UTC))
        result = QuestOutcomeView(
            user_id=row.user_id,
            quest_id=row.quest_id,
            schedule_revision=row.schedule_revision,
            local_date=row.local_date,
            state=row.state,
            credits=row.credits,
        )
    return result
