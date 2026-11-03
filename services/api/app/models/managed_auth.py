"""External FK target only; never includes managed Auth in product metadata/migrations."""

from sqlalchemy import Column, MetaData, Table
from sqlalchemy.dialects.postgresql import UUID

auth_users = Table(
    "users",
    MetaData(),
    Column("id", UUID(as_uuid=True), primary_key=True),
    schema="auth",
    info={"external": True},
)
