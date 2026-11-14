from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from threading import Barrier

import pytest
from sqlalchemy import func, select, text

from app.core.errors import ApiError
from app.models.quest import UserQuest
from app.models.quest_execution import QuestScheduleVersion
from app.models.recommendations import RecommendationDecision
from app.models.rewards import RewardEntry
from app.models.settings import UserSettings
from app.repositories.recommendations import current, decide
from app.schemas.recommendations import RecommendationAction

pytestmark = pytest.mark.database
NOW = datetime(2026, 11, 14, 12, 4, tzinfo=UTC)


def action(value, kind="accepted"):
    return RecommendationAction(offer_id=value.offer.offer_id, action=kind)


def test_transient_get_generic_and_interest_templates_without_writes(resource, profile_accounts):
    a = profile_accounts[0]
    with resource.transaction(a) as s:
        first = current(s, NOW)
        assert first.offer.source == "generic_template"
        assert first == current(s, NOW)
        assert s.scalar(select(func.count()).select_from(RecommendationDecision)) == 0
        assert s.scalar(select(func.count()).select_from(UserQuest)) == 0
        s.add(
            UserSettings(
                user_id=a.user_id,
                activities={
                    "selected_activity_ids": ["reading", "walking"],
                    "custom_text": "private custom",
                },
                plan_draft=None,
            )
        )
    with resource.transaction(a) as s:
        value = current(s, NOW)
        assert value.offer.activity == "Walking" and value.offer.source == "activity_template"
        assert "private custom" not in value.model_dump_json()
        assert value.offer.offer_id != first.offer.offer_id


def test_skip_replay_opposite_decision_and_24hour_cooldown(resource, profile_accounts):
    a = profile_accounts[0]
    with resource.transaction(a) as s:
        request = action(current(s, NOW), "skipped")
        result = decide(s, request, NOW)
        assert result.state == "skipped" and result.next_offer_at == NOW + timedelta(hours=24)
    with resource.transaction(a) as s:
        assert decide(s, request, NOW + timedelta(minutes=30)).state == "skipped"
        assert current(s, NOW + timedelta(hours=23)).state == "skipped"
        assert current(s, NOW + timedelta(hours=24)).state == "offered"
        assert s.scalar(select(func.count()).select_from(UserQuest)) == 0
    with pytest.raises(ApiError):
        with resource.transaction(a) as s:
            decide(s, request.model_copy(update={"action": "accepted"}), NOW)


def test_accept_saves_one_time_quest_no_install_or_credit_and_deleted_never_recreated(
    resource, profile_accounts
):
    from app.repositories.quests import delete_own_quest

    a = profile_accounts[0]
    with resource.transaction(a) as s:
        request = action(current(s, NOW))
        result = decide(s, request, NOW)
        assert result.accepted_quest_id == request.offer_id
        quest = s.get(UserQuest, (a.user_id, request.offer_id))
        assert quest.definition["repeat"] == "none" and quest.definition["weekdays"] == []
        assert s.scalar(select(func.count()).select_from(QuestScheduleVersion)) == 0
        assert s.scalar(select(func.count()).select_from(RewardEntry)) == 0
    with resource.transaction(a) as s:
        assert decide(s, request, NOW).accepted_quest_id == request.offer_id
        delete_own_quest(s, request.offer_id, 1)
    with resource.transaction(a) as s:
        assert decide(s, request, NOW).accepted_quest_id is None
        assert s.get(UserQuest, (a.user_id, request.offer_id)).definition is None


def test_stale_interest_and_expired_offer_cannot_create_quest(resource, profile_accounts):
    a = profile_accounts[0]
    with resource.transaction(a) as s:
        request = action(current(s, NOW))
    with pytest.raises(ApiError):
        with resource.transaction(a) as s:
            decide(s, request, NOW + timedelta(minutes=16))
    with resource.transaction(a) as s:
        s.add(UserSettings(user_id=a.user_id))
    with pytest.raises(ApiError):
        with resource.transaction(a) as s:
            decide(s, request, NOW)
    with resource.transaction(a) as s:
        assert s.scalar(select(func.count()).select_from(RecommendationDecision)) == 0


def test_decisions_and_creation_are_atomic_on_identifier_conflict(resource, profile_accounts):
    a = profile_accounts[0]
    with resource.transaction(a) as s:
        request = action(current(s, NOW))
        s.add(UserQuest(user_id=a.user_id, quest_id=request.offer_id, definition=None))
    with pytest.raises(ApiError):
        with resource.transaction(a) as s:
            decide(s, request, NOW)
    with resource.transaction(a) as s:
        assert s.scalar(select(func.count()).select_from(RecommendationDecision)) == 0


def test_other_account_cannot_decide_offer_and_rows_are_private(resource, profile_accounts):
    a, b, _ = profile_accounts
    with resource.transaction(a) as s:
        request = action(current(s, NOW))
        decide(s, request, NOW)
    with pytest.raises(ApiError):
        with resource.transaction(b) as s:
            decide(s, request, NOW)
    with resource.transaction(b) as s:
        assert current(s, NOW).state == "offered"
        assert s.scalars(select(RecommendationDecision)).all() == []


@pytest.mark.parametrize(
    "kinds, expected",
    [
        (["accepted", "skipped"], ["conflict", "ok"]),
        (["accepted", "accepted"], ["ok", "ok"]),
    ],
)
def test_concurrent_decisions_are_serialized(db_settings, profile_accounts, kinds, expected):
    from app.db.engine import Database

    db = Database(db_settings.model_copy(update={"db_pool_size": 2}))
    owner = profile_accounts[0]
    with db.transaction(owner) as s:
        request = action(current(s, NOW))
    barrier = Barrier(2)

    def run(kind):
        try:
            with db.transaction(owner) as s:
                barrier.wait(timeout=5)
                decide(s, request.model_copy(update={"action": kind}), NOW)
            return "ok"
        except ApiError:
            return "conflict"

    try:
        with ThreadPoolExecutor(2) as pool:
            assert sorted(pool.map(run, kinds)) == expected
        with db.transaction(owner) as s:
            row = s.get(RecommendationDecision, owner.user_id)
            count = s.scalar(select(func.count()).select_from(UserQuest))
            assert count == (1 if row.decision == "accepted" else 0)
    finally:
        db.close()


def test_accepted_quest_uses_existing_schedule_completion50_once(resource, profile_accounts):
    from app.repositories.quest_execution import execution, put_outcome, put_schedule
    from app.repositories.rewards import view
    from app.schemas.quest_execution import QuestSchedulePut

    a = profile_accounts[0]
    with resource.transaction(a) as s:
        request = action(current(s, NOW))
        result = decide(s, request, NOW)
        qid = result.accepted_quest_id
        with pytest.raises(ApiError):
            # No schedule yet: accepting cannot earn credits.
            put_outcome(s, qid, 1, NOW.date(), "completed", NOW)
        scheduled = put_schedule(
            s,
            qid,
            QuestSchedulePut(
                expected_revision=0,
                quest_revision=1,
                first_date=NOW.date().isoformat(),
                enabled=True,
            ),
            NOW,
        )
        item = next(i for i in scheduled.occurrences if i.local_date == NOW.date())
        assert execution(s, qid, NOW).enabled
        assert view(s, NOW).balance == 0
        later = item.ends_at + timedelta(seconds=1)
        assert put_outcome(s, qid, 1, NOW.date(), "completed", later).credits == 50
        assert put_outcome(s, qid, 1, NOW.date(), "completed", later).credits == 50
        assert view(s, later).balance == 50


@pytest.mark.parametrize(
    "damage",
    [
        "ALTER TABLE public.recommendation_decisions NO FORCE ROW LEVEL SECURITY",
        "GRANT SELECT ON public.recommendation_decisions TO authenticated",
        "GRANT DELETE ON public.recommendation_decisions TO disconnect_api",
        "DROP POLICY recommendation_decisions_select_own ON public.recommendation_decisions",
        "ALTER TABLE public.recommendation_decisions DROP CONSTRAINT "
        "ck_recommendation_decisions_quest_coherent",
    ],
)
def test_recommendation_schema_security_drift_rejected(migration_engine, damage):
    from app.db.migrations import MigrationSafetyError, verify

    with migration_engine.connect() as c:
        tx = c.begin()
        try:
            c.execute(text(damage))
            with pytest.raises(MigrationSafetyError):
                verify(c)
        finally:
            tx.rollback()


def test_additive_0006_upgrade_preserves_existing_history(migration_engine):
    from alembic import command
    from app.db.migrations import HEAD, config, run

    with migration_engine.begin() as c:
        tables = ["profiles", "user_settings", "user_quests", "history_records", "reward_entries"]
        before = {t: c.execute(text(f"SELECT to_jsonb(t) FROM public.{t} t")).all() for t in tables}
        command.downgrade(config(c), "20261114_0006")
        assert c.scalar(text("SELECT to_regclass('public.recommendation_decisions')")) is None
        assert run(c)["revision"] == HEAD
        for table in tables:
            assert (
                c.execute(text(f"SELECT to_jsonb(t) FROM public.{table} t")).all() == before[table]
            )


def test_managed_auth_cascade_is_simulated_only_in_disposable_fixture(
    resource, profile_accounts, db_environment
):
    from tests.support import database

    a = profile_accounts[0]
    with resource.transaction(a) as session:
        decide(session, action(current(session, NOW)), NOW)
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (a.user_id,))
        assert admin.execute(
            "SELECT count(*) FROM public.recommendation_decisions WHERE user_id=%s", (a.user_id,)
        ).fetchone() == (0,)
        assert admin.execute(
            "SELECT count(*) FROM public.user_quests WHERE user_id=%s", (a.user_id,)
        ).fetchone() == (0,)
