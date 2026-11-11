"""Saved quest management. Saving never installs a rule or awards credits."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.repositories.quests import delete_own_quest, list_own_quests, own_row, save_own_quest
from app.schemas.errors import ErrorEnvelope
from app.schemas.quests import (
    QuestDelete,
    QuestDeletedResponse,
    QuestPage,
    QuestPut,
    QuestResponse,
    QuestSavedResponse,
    QuestView,
)

router = APIRouter(prefix="/v1/quests", tags=["quests"])
errors = {status: {"model": ErrorEnvelope} for status in (401, 403, 409, 413, 422, 503)}


def view(row):
    return QuestView.model_validate(row, from_attributes=True)


@router.get("", response_model=QuestPage, operation_id="list_own_quests", responses=errors)
def list_quests(
    session: UserSessionDependency,
    cursor: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> QuestPage:
    rows = list_own_quests(session, cursor, limit)
    return QuestPage(
        quests=[view(row) for row in rows[:limit]],
        next_cursor=rows[limit - 1].quest_id if len(rows) > limit else None,
    )


@router.get(
    "/{quest_id}", response_model=QuestResponse, operation_id="get_own_quest", responses=errors
)
def get_quest(quest_id: UUID, session: UserSessionDependency) -> QuestResponse:
    row = own_row(session, quest_id)
    return QuestResponse(
        quest=view(row) if row is not None and row.definition is not None else None
    )


@router.put(
    "/{quest_id}",
    response_model=QuestSavedResponse,
    operation_id="save_own_quest",
    responses=errors,
    description="Complete saved definition only; no activation/rewards. Expected 0 creates "
    "a fresh client UUID. Positive revision replaces only that own version. Tombstoned "
    "identifiers cannot be reused. 16KiB strict JSON; commit precedes success.",
)
def put_quest(
    quest_id: UUID,
    body: QuestPut,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
) -> QuestSavedResponse:
    with database(request).transaction(identity) as session:
        result = QuestSavedResponse(quest=view(save_own_quest(session, quest_id, body)))
    return result


@router.delete(
    "/{quest_id}",
    response_model=QuestDeletedResponse,
    operation_id="delete_own_quest",
    responses=errors,
    description="Revision-guarded delete wipes definition content, retains only an "
    "owner/id/revision/time tombstone to fence stale writes. Missing/already-deleted "
    "own records succeed; never inspects another owner. No native cancellation.",
)
def delete_quest(
    quest_id: UUID,
    body: QuestDelete,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
) -> QuestDeletedResponse:
    with database(request).transaction(identity) as session:
        delete_own_quest(session, quest_id, body.expected_revision)
    return QuestDeletedResponse(quest_id=quest_id)
