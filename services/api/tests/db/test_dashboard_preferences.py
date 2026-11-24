from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.models.rewards import RewardEntry, RewardWallet
from app.repositories.rewards import feed, quest_credit, view
from app.repositories.settings import read_own_settings, save_own_settings
from app.schemas.rewards import FeedPut
from app.schemas.settings import Personalization, SettingsPatch

pytestmark = pytest.mark.database
NOW = datetime(2026, 11, 24, 12, tzinfo=UTC)


def test_personalization_roundtrip_preserves_plan_and_other_account(resource, profile_accounts):
    a, b, _ = profile_accounts
    with resource.transaction(a) as session:
        saved = save_own_settings(
            session,
            SettingsPatch(
                expected_revision=0,
                personalization=Personalization(age=25, gender="Other", nudge_tone="Direct"),
            ),
        )
        assert saved.personalization == dict(age=25, gender="Other", nudge_tone="Direct")
        assert saved.plan_draft is None
    with resource.transaction(a) as session:
        assert read_own_settings(session).personalization["nudge_tone"] == "Direct"
    with resource.transaction(b) as session:
        assert read_own_settings(session) is None


def test_feed_charges_ten_once_and_uses_figma_health_bands(resource, profile_accounts):
    a = profile_accounts[0]
    request_id = uuid4()
    with resource.transaction(a) as session:
        quest_credit(session, uuid4(), 1, NOW.date(), NOW)
        before = view(session, NOW)
        assert before.artwork == "feelingLow" and before.health == 50
        result = feed(session, request_id, FeedPut(expected_revision=before.revision), NOW)
        assert result.charged_credits == 10 and result.wallet.balance == 40
        assert result.wallet.health == 70 and result.wallet.artwork == "doingOkay"
    with resource.transaction(a) as session:
        replay = feed(session, request_id, FeedPut(expected_revision=before.revision), NOW)
        assert replay.wallet.balance == 40 and replay.charged_credits == 10


def test_historical_twenty_credit_feed_receipt_is_not_repriced(resource, profile_accounts):
    a = profile_accounts[0]
    request_id = uuid4()
    with resource.transaction(a) as session:
        quest_credit(session, uuid4(), 1, NOW.date(), NOW)
        before = view(session, NOW)
        session.add(
            RewardEntry(
                user_id=a.user_id,
                source=f"feed:{request_id}",
                kind="feed",
                amount=-20,
                recorded_at=NOW,
                payload={"expected_revision": before.revision, "health_added": 20},
            )
        )
        wallet = session.get(RewardWallet, a.user_id)
        wallet.balance -= 20
        wallet.health = 70
        wallet.revision += 1
    with resource.transaction(a) as session:
        replay = feed(session, request_id, FeedPut(expected_revision=before.revision), NOW)
        assert replay.charged_credits == 20
        assert replay.wallet.balance == 30
