"""Product model registry. Managed Auth metadata is external, never migrated here."""

from app.models.history import HistoryRecord
from app.models.profile import Profile
from app.models.quest import UserQuest
from app.models.quest_execution import QuestOccurrenceOutcome, QuestScheduleVersion
from app.models.rewards import RewardEntry, RewardStream, RewardWallet
from app.models.settings import UserSettings

__all__ = [
    "Profile",
    "HistoryRecord",
    "UserSettings",
    "UserQuest",
    "QuestOccurrenceOutcome",
    "QuestScheduleVersion",
    "RewardEntry",
    "RewardStream",
    "RewardWallet",
]
