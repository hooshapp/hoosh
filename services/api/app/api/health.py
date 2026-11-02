from typing import Literal

from fastapi import APIRouter

from app.schemas.errors import WireModel

router = APIRouter(tags=["health"])


class HealthResponse(WireModel):
    status: Literal["ok"]
    service: Literal["disconnect-api"]


@router.get("/healthz", response_model=HealthResponse, operation_id="get_process_health")
def health() -> HealthResponse:
    """Process liveness only; does not assert database or native protection readiness."""
    return HealthResponse(status="ok", service="disconnect-api")
