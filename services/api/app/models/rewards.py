"""Account-owned wallet, immutable receipts and per-installation delivery cursors."""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.managed_auth import auth_users


class RewardWallet(Base):
    __tablename__ = "reward_wallets"
    __table_args__ = (
        CheckConstraint("balance >= 0 AND balance <= 9007199254740991", name="balance_range"),
        CheckConstraint("health BETWEEN 0 AND 100 AND revision > 0", name="state_range"),
        CheckConstraint("streak_days >= 0", name="streak_range"),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey(auth_users.c.id, ondelete="CASCADE"), primary_key=True
    )
    balance: Mapped[int] = mapped_column(BigInteger, nullable=False)
    health: Mapped[int] = mapped_column(nullable=False)
    revision: Mapped[int] = mapped_column(nullable=False)
    health_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    streak_days: Mapped[int] = mapped_column(nullable=False)
    streak_day: Mapped[date | None] = mapped_column(Date)
    streak_unknown: Mapped[bool] = mapped_column(nullable=False)
    last_native_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RewardEntry(Base):
    __tablename__ = "reward_entries"
    __table_args__ = (
        CheckConstraint("amount IN (-20, 0, 5, 20, 30, 50)", name="amount_range"),
        CheckConstraint("kind IN ('quest', 'feed', 'native')", name="kind_choice"),
        UniqueConstraint("user_id", "installation_id", "sequence", name="uq_reward_delivery"),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey(auth_users.c.id, ondelete="CASCADE"), primary_key=True
    )
    source: Mapped[str] = mapped_column(String(180), primary_key=True)
    kind: Mapped[str] = mapped_column(String(8), nullable=False)
    amount: Mapped[int] = mapped_column(nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    installation_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    sequence: Mapped[int | None] = mapped_column(BigInteger)


class RewardStream(Base):
    __tablename__ = "reward_streams"
    __table_args__ = (
        CheckConstraint("sequence >= 0 AND discarded >= 0", name="cursor_range"),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey(auth_users.c.id, ondelete="CASCADE"), primary_key=True
    )
    installation_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    sequence: Mapped[int] = mapped_column(BigInteger, nullable=False)
    discarded: Mapped[int] = mapped_column(BigInteger, nullable=False)
    timezone_id: Mapped[str] = mapped_column(String(128), nullable=False)
    last_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
