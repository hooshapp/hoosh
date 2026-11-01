from uuid import UUID

from app.schemas.errors import WireModel


class MeResponse(WireModel):
    """Verified identity only; nullable email is always present, never an auth key."""

    user_id: UUID
    email: str | None
