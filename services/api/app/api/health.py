from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: Literal["disconnect-api"] = "disconnect-api"


@router.get("/healthz", response_model=HealthResponse)
def health() -> HealthResponse:
    """Process liveness only; does not assert database or native protection readiness."""
    return HealthResponse()
