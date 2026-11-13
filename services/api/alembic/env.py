"""One product migration history, driven by an explicit validated connection."""

from alembic import context
from app.db.base import Base
from app.models import (  # noqa: F401 - register owned metadata
    Profile,
    QuestOccurrenceOutcome,
    QuestScheduleVersion,
    UserQuest,
    UserSettings,
)


def include_name(name, type_, parent_names):
    if type_ == "schema":
        return name in (None, "public")
    if type_ == "table":
        return name in (
            "profiles",
            "user_settings",
            "user_quests",
            "quest_schedule_versions",
            "quest_occurrence_outcomes",
            "reward_wallets",
            "reward_entries",
            "reward_streams",
        ) and parent_names.get("schema_name") in (
            None,
            "public",
        )
    return True


def include_object(object_, name, type_, reflected, compare_to):
    return not object_.info.get("external", False)


options = {
    "target_metadata": Base.metadata,
    "include_schemas": True,
    "include_name": include_name,
    "include_object": include_object,
    "compare_type": True,
    "compare_server_default": True,
    "version_table_schema": "public",
}
if context.is_offline_mode():
    context.configure(url="postgresql+psycopg://", literal_binds=True, **options)
else:
    connection = context.config.attributes.get("connection")
    if connection is None:
        raise RuntimeError("Use the explicit validated migration runner; no URL fallback")
    context.configure(connection=connection, **options)

with context.begin_transaction():
    context.run_migrations()
