"""Verified own-account reward reads and atomic, retry-safe commands."""

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.repositories import rewards
from app.schemas.errors import ErrorEnvelope
from app.schemas.rewards import (
    FeedPut,
    FeedReceipt,
    FeedResult,
    RewardBatch,
    RewardBatchResult,
    RewardView,
)

router = APIRouter(prefix="/v1/rewards", tags=["rewards"])
errors = {status: {"model": ErrorEnvelope} for status in (401, 403, 409, 413, 422, 503)}


@router.get("", response_model=RewardView, operation_id="get_own_rewards", responses=errors)
def read(request: Request, identity: Annotated[VerifiedIdentity, Depends(verified_identity)]):
    now = datetime.now(UTC)
    with database(request).transaction(identity) as session:
        wallet = rewards.view(session, now)
        if wallet.revision == 0:
            rewards.locked(session, now)
            return rewards.view(session, now)
        return wallet


@router.get(
    "/feed/{request_id}",
    response_model=FeedReceipt,
    operation_id="get_own_feed_receipt",
    responses=errors,
)
def receipt(request_id: UUID, session: UserSessionDependency):
    return rewards.feed_receipt(session, request_id, datetime.now(UTC))


@router.put(
    "/feed/{request_id}", response_model=FeedResult, operation_id="feed_own_dino", responses=errors
)
def feed(
    request_id: UUID,
    body: FeedPut,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
):
    with database(request).transaction(identity) as session:
        result = rewards.feed(session, request_id, body, datetime.now(UTC))
    return result


@router.put(
    "/events",
    response_model=RewardBatchResult,
    operation_id="ingest_own_reward_events",
    responses=errors,
)
def events(
    body: RewardBatch,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
):
    with database(request).transaction(identity) as session:
        result = rewards.ingest(session, body, datetime.now(UTC))
    return result
