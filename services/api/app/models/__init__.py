"""Product model registry. Managed Auth metadata is external, never migrated here."""

from app.models.profile import Profile
from app.models.quest import UserQuest
from app.models.quest_execution import QuestOccurrenceOutcome, QuestScheduleVersion
from app.models.settings import UserSettings

__all__ = ["Profile", "UserSettings", "UserQuest", "QuestOccurrenceOutcome", "QuestScheduleVersion"]
