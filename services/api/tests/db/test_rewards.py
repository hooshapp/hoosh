from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from threading import Barrier
from uuid import uuid4

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import ProgrammingError

from app.core.errors import ApiError
from app.models.rewards import RewardEntry, RewardWallet
from app.repositories.quests import list_own_quests
from app.repositories.rewards import feed, ingest, quest_credit, view
from app.schemas.rewards import FeedPut, RewardBatch
from tests.support import database

pytestmark = pytest.mark.database
NOW = datetime(2026, 11, 13, 12, tzinfo=UTC)


def signal(sequence=1, at=NOW, kind="quit", **patch):
    return (
        dict(
            event_id=str(uuid4()),
            sequence=sequence,
            occurred_at=at.isoformat(),
            kind=kind,
            encounter_id=str(uuid4()) if kind == "quit" else None,
            context="initial" if kind == "quit" else None,
            day=str(at.date()),
            exhausted=False if kind != "quit" else None,
            covered=True if kind == "day_closed" else None,
        )
        | patch
    )


def batch(events, installation=None, discarded=0):
    return RewardBatch.model_validate(
        dict(
            installation_id=str(installation or uuid4()),
            timezone_id="UTC",
            discarded=discarded,
            events=events,
        )
    )


def fund(resource, owner, count=1):
    for _ in range(count):
        with resource.transaction(owner) as s:
            quest_credit(s, uuid4(), 1, NOW.date(), NOW)


def test_read_is_nonmutating_default_and_owner_isolation(resource, profile_accounts):
    a, b, _ = profile_accounts
    with resource.transaction(a) as s:
        v = view(s, NOW)
        assert (v.balance, v.health, v.revision, v.streak_days) == (0, 50, 0, None)
        assert s.scalars(select(RewardWallet)).all() == []
    fund(resource, a)
    with resource.transaction(b) as s:
        assert view(s, NOW).balance == 0
        assert s.scalars(select(RewardEntry)).all() == []


def test_atomic_feed_replay_and_request_payload_reuse(resource, profile_accounts):
    a = profile_accounts[0]
    fund(resource, a)
    id = uuid4()
    with resource.transaction(a) as s:
        before = view(s, NOW)
        result = feed(s, id, FeedPut(expected_revision=before.revision), NOW)
        assert (result.wallet.balance, result.wallet.health, result.health_added) == (40, 70, 20)
    with resource.transaction(a) as s:
        replay = feed(s, id, FeedPut(expected_revision=before.revision), NOW)
        assert (replay.wallet.balance, replay.wallet.health) == (40, 70)
    with pytest.raises(ApiError):
        with resource.transaction(a) as s:
            feed(s, id, FeedPut(expected_revision=replay.wallet.revision), NOW)


@pytest.mark.parametrize(("minutes", "starting_health", "gain"), [(5, 83, 5), (10, 83, 10), (5, 98, 2)])
def test_feed_restores_one_health_point_per_session_minute(
    resource, profile_accounts, minutes, starting_health, gain
):
    from app.repositories.settings import save_own_settings
    from app.schemas.settings import SettingsPatch

    owner = profile_accounts[0]
    fund(resource, owner)
    request_id = uuid4()
    with resource.transaction(owner) as session:
        save_own_settings(session, SettingsPatch.model_validate({
            "expected_revision": 0,
            "plan_draft": {"weekdays": [1], "hours": None, "timezone_id": "UTC",
                           "session_count": 3, "session_minutes": minutes},
        }))
        wallet = session.get(RewardWallet, owner.user_id)
        wallet.health = starting_health
        session.flush()
        before = view(session, NOW)
        assert before.feed_health == minutes
        result = feed(session, request_id, FeedPut(expected_revision=before.revision), NOW)
        assert result.health_added == gain
        assert result.wallet.health == starting_health + gain
        assert result.wallet.balance == before.balance - 10
    with resource.transaction(owner) as session:
        assert feed(session, request_id, FeedPut(expected_revision=before.revision), NOW) == result


def test_insufficient_funds_full_health_and_stale_revision_do_not_charge(
    resource, profile_accounts
):
    a = profile_accounts[0]
    with pytest.raises(ApiError):
        with resource.transaction(a) as s:
            feed(s, uuid4(), FeedPut(expected_revision=0), NOW)
    fund(resource, a, 3)
    for target in [70, 90, 100]:
        with resource.transaction(a) as s:
            v = view(s, NOW)
            assert (
                feed(s, uuid4(), FeedPut(expected_revision=v.revision), NOW).wallet.health == target
            )
    with resource.transaction(a) as s:
        before = view(s, NOW)
    for rev in [before.revision, before.revision - 1]:
        with pytest.raises(ApiError):
            with resource.transaction(a) as s:
                feed(s, uuid4(), FeedPut(expected_revision=rev), NOW)
    with resource.transaction(a) as s:
        assert view(s, NOW).balance == before.balance


def test_server_clock_decay_is_lazy_and_feed_preserves_fractional_day(resource, profile_accounts):
    a = profile_accounts[0]
    fund(resource, a)
    later = NOW + timedelta(days=3, hours=12)
    with resource.transaction(a) as s:
        assert view(s, later).health == 35
        assert view(s, NOW - timedelta(days=3)).health == 50
        r = feed(s, uuid4(), FeedPut(expected_revision=view(s, later).revision), later)
        assert r.wallet.health == 55
    with resource.transaction(a) as s:
        assert view(s, later + timedelta(hours=12)).health == 50
        assert view(s, later + timedelta(days=100)).health == 0


def test_competing_feed_commands_cannot_double_spend_revision(
    resource, profile_accounts, db_settings
):
    a = profile_accounts[0]
    fund(resource, a)
    with resource.transaction(a) as s:
        rev = view(s, NOW).revision
    from app.db.engine import Database

    concurrent = Database(db_settings.model_copy(update={"db_pool_size": 2}))
    start = Barrier(2)
    pids = set()

    def run():
        try:
            with concurrent.transaction(a) as s:
                pids.add(s.scalar(text("SELECT pg_backend_pid()")))
                start.wait(timeout=5)
                feed(s, uuid4(), FeedPut(expected_revision=rev), NOW)
            return "ok"
        except ApiError:
            return "conflict"

    try:
        with ThreadPoolExecutor(2) as pool:
            assert sorted(pool.map(lambda _: run(), range(2))) == ["conflict", "ok"]
        assert len(pids) == 2
    finally:
        concurrent.close()
    with resource.transaction(a) as s:
        assert view(s, NOW).balance == 40


def test_native_batch_replay_and_distinct_quits_within_one_minute(resource, profile_accounts):
    a = profile_accounts[0]
    installation = uuid4()
    first = signal()
    body = batch([first], installation)
    with resource.transaction(a) as s:
        assert ingest(s, body, NOW).wallet.balance == 5
    with resource.transaction(a) as s:
        assert ingest(s, body, NOW).wallet.balance == 5
        assert len(s.scalars(select(RewardEntry)).all()) == 1
    nexts = [
        signal(2, NOW + timedelta(seconds=10)),
        signal(3, NOW + timedelta(seconds=70), encounter_id=first["encounter_id"]),
        signal(4, NOW + timedelta(seconds=130), context="expired"),
        signal(5, NOW + timedelta(seconds=200), context="mid_session"),
    ]
    with resource.transaction(a) as s:
        result = ingest(s, batch(nexts, installation), NOW + timedelta(seconds=201))
        assert result.accepted_sequence == 5 and result.wallet.balance == 50


@pytest.mark.parametrize("session_minutes, expected_health", [(None, 48), (5, 45), (10, 40)])
def test_restore_acknowledged_prefix_and_apply_health_loss_once(resource, profile_accounts, session_minutes, expected_health):
    installation = uuid4()
    a = profile_accounts[0]
    events = [
        signal(11),
        signal(12, kind="allowance", exhausted=False, context=None, encounter_id=None, session_minutes=session_minutes),
        signal(13, kind="nudge_skipped", context=None, encounter_id=str(uuid4()), exhausted=None),
    ]
    body = batch(events, installation).model_copy(update={"acknowledged": 10})
    with resource.transaction(a) as s:
        result = ingest(s, body, NOW)
        assert result.accepted_sequence == 13
        assert (result.wallet.balance, result.wallet.health) == (5, expected_health)
    with resource.transaction(a) as s:
        replay = ingest(s, body, NOW)
        assert (replay.wallet.balance, replay.wallet.health) == (5, expected_health)


def test_reopening_same_session_costs_health_once_without_a_new_allowance(resource, profile_accounts):
    owner = profile_accounts[0]
    events = [
        signal(1, kind="allowance", encounter_id=None, context=None, session_minutes=5),
        signal(2, kind="app_open", encounter_id=None, context=None, exhausted=None, session_minutes=5),
    ]
    body = batch(events, uuid4())
    with resource.transaction(owner) as session:
        assert ingest(session, body, NOW).wallet.health == 40
    with resource.transaction(owner) as session:
        assert ingest(session, body, NOW).wallet.health == 40
        assert [row.payload["kind"] for row in session.scalars(
            select(RewardEntry).order_by(RewardEntry.sequence)
        )] == ["allowance", "app_open"]


def test_bad_sequence_payload_or_clock_rolls_back_whole_batch(resource, profile_accounts):
    a = profile_accounts[0]
    installation = uuid4()
    first = signal()
    with resource.transaction(a) as s:
        ingest(s, batch([first], installation), NOW)
    for events in [
        [first | {"context": "expired"}],
        [signal(3)],
        [signal(2), signal(3, NOW + timedelta(days=1))],
    ]:
        with pytest.raises(ApiError):
            with resource.transaction(a) as s:
                ingest(s, batch(events, installation), NOW)
    with resource.transaction(a) as s:
        assert view(s, NOW).balance == 5 and len(s.scalars(select(RewardEntry)).all()) == 1


def test_gap_is_acknowledged_but_does_not_invent_streak(resource, profile_accounts):
    a = profile_accounts[0]
    with resource.transaction(a) as s:
        r = ingest(s, batch([signal(5)], discarded=4), NOW)
        assert r.accepted_sequence == 5 and r.wallet.streak_days is None


def test_streak_day_coverage_freezes_on_gap_and_exhaustion_breaks(resource, profile_accounts):
    a = profile_accounts[0]
    inst = uuid4()

    def close(seq, at, **kwargs):
        return signal(seq, at, kind="day_closed", day=str(at.date() - timedelta(days=1)), **kwargs)

    with resource.transaction(a) as s:
        r = ingest(s, batch([close(1, NOW)], inst), NOW)
        assert r.wallet.streak_days == 1 and not r.wallet.recent_week_complete
    with resource.transaction(a) as s:
        at = NOW + timedelta(days=1)
        r = ingest(s, batch([close(2, at, covered=False)], inst), at)
        assert r.wallet.streak_days is None
    with resource.transaction(a) as s:
        at = NOW + timedelta(days=2)
        r = ingest(s, batch([close(3, at)], inst), at)
        assert r.wallet.streak_days == 2
    with resource.transaction(a) as s:
        at = NOW + timedelta(days=2, hours=1)
        r = ingest(s, batch([signal(4, at, kind="allowance", exhausted=True)], inst), at)
        assert r.wallet.streak_days == 0


def test_recent_week_requires_all_seven_real_day_receipts(resource, profile_accounts):
    a = profile_accounts[0]
    inst = uuid4()
    for seq in range(1, 8):
        at = NOW + timedelta(days=seq)
        e = signal(seq, at, kind="day_closed", day=str(at.date() - timedelta(days=1)))
        with resource.transaction(a) as s:
            r = ingest(s, batch([e], inst), at)
    assert r.wallet.streak_days == 7 and r.wallet.recent_week_complete
    with resource.transaction(a) as s:
        assert view(s, NOW + timedelta(days=15)).streak_days is None
        assert not view(s, NOW + timedelta(days=15)).recent_week_complete


def test_ledger_cannot_be_rewritten_or_deleted_by_runtime(resource, profile_accounts):
    a = profile_accounts[0]
    fund(resource, a)
    for command in [
        "UPDATE public.reward_entries SET amount=0",
        "DELETE FROM public.reward_entries",
    ]:
        with pytest.raises(ProgrammingError):
            with resource.transaction(a) as s:
                s.execute(text(command))


def test_auth_cascade_removes_only_test_account_rewards(resource, profile_accounts, db_environment):
    a, b, c = profile_accounts
    fund(resource, a)
    fund(resource, b)
    fund(resource, c)
    with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
        admin.execute("DELETE FROM auth.users WHERE id=%s", (c.user_id,))
    with resource.transaction(c) as s:
        assert s.scalars(select(RewardEntry)).all() == []
    for owner in [a, b]:
        with resource.transaction(owner) as s:
            assert view(s, NOW).balance == 50


def test_completion_funds_wallet_once_and_deleted_quest_keeps_credits(resource, profile_accounts):
    from app.repositories.quest_execution import put_outcome
    from app.repositories.quests import delete_own_quest
    from tests.db.test_quest_execution import DAY, create, schedule
    from tests.db.test_quest_execution import NOW as SCHEDULED

    a = profile_accounts[0]
    id = create(resource, a)
    schedule(resource, a, id)
    for _ in range(2):
        with resource.transaction(a) as s:
            put_outcome(s, id, 1, DAY, "completed", SCHEDULED + timedelta(days=2))
    with resource.transaction(a) as s:
        assert view(s, NOW).balance == 50
        delete_own_quest(s, id, 1)
    with resource.transaction(a) as s:
        assert view(s, NOW).balance == 50
        assert len(s.scalars(select(RewardEntry)).all()) == 1


def test_real_http_feed_receipt_replay_and_other_account_isolation(
    profile_client, profile_accounts
):
    from tests.support.profiles import headers
    from tests.support.schema import wire_validator

    client, resource, signer = profile_client
    a, b, _ = profile_accounts
    fund(resource, a)
    ah, bh = headers(signer, a), headers(signer, b)
    wallet = client.get("/v1/rewards", headers=ah).json()
    wire_validator("RewardView").validate(wallet)
    id = uuid4()
    url = f"/v1/rewards/feed/{id}"
    assert client.get(url, headers=ah).json()["recorded"] is False
    body = {"expected_revision": wallet["revision"]}
    for _ in range(2):
        r = client.put(url, headers=ah, json=body)
        assert r.status_code == 200
        wire_validator("FeedResult").validate(r.json())
        assert r.json()["wallet"]["balance"] == 40
    receipt = client.get(url, headers=ah).json()
    wire_validator("FeedReceipt").validate(receipt)
    assert receipt["recorded"] and receipt["health_added"] == 20
    assert client.get(url, headers=bh).json()["recorded"] is False
    assert client.get("/v1/rewards", headers=bh).json()["balance"] == 0
    assert client.put(url, headers=ah, json={"expected_revision": 999}).status_code == 409
    now = datetime.now(UTC)
    payload = batch([signal(at=now)]).model_dump(mode="json")
    for _ in range(2):
        r = client.put("/v1/rewards/events", headers=ah, json=payload)
        assert r.status_code == 200
        wire_validator("RewardBatchResult").validate(r.json())
        assert r.json()["wallet"]["balance"] == 45
    assert resource.engine.pool.checkedout() == 0


@pytest.mark.parametrize(
    "damage",
    [
        "ALTER TABLE public.reward_wallets NO FORCE ROW LEVEL SECURITY",
        "GRANT SELECT ON public.reward_entries TO authenticated",
        "GRANT UPDATE ON public.reward_entries TO disconnect_api",
        "DROP POLICY reward_streams_select_own ON public.reward_streams",
        "ALTER TABLE public.reward_wallets DROP CONSTRAINT ck_reward_wallets_balance_range",
    ],
)
def test_verification_rejects_reward_security_drift(migration_engine, damage):
    from app.db.migrations import MigrationSafetyError, verify

    with migration_engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text(damage))
            with pytest.raises(MigrationSafetyError):
                verify(connection)
        finally:
            transaction.rollback()


def test_previous_head_backfills_completion_without_touching_existing_rows(
    migration_engine, resource, profile_accounts
):
    from alembic import command
    from app.db.migrations import HEAD, config, run
    from app.repositories.quest_execution import put_outcome
    from tests.db.test_quest_execution import DAY, create, schedule
    from tests.db.test_quest_execution import NOW as SCHEDULED

    owner = profile_accounts[0]
    id = create(resource, owner)
    schedule(resource, owner, id)
    with resource.transaction(owner) as s:
        put_outcome(s, id, 1, DAY, "completed", SCHEDULED + timedelta(days=2))
    with migration_engine.begin() as connection:
        rows = {
            table: connection.execute(text(f"SELECT * FROM public.{table} ORDER BY user_id")).all()
            for table in ("profiles", "user_settings", "quest_occurrence_outcomes")
        }
        command.downgrade(config(connection), "20261111_0004")
        assert connection.scalar(text("SELECT to_regclass('public.reward_entries')")) is None
        assert run(connection)["revision"] == HEAD
        assert (
            connection.scalar(
                text("SELECT balance FROM public.reward_wallets WHERE user_id=:id"),
                {"id": owner.user_id},
            )
            == 50
        )
        for table, expected in rows.items():
            assert (
                connection.execute(text(f"SELECT * FROM public.{table} ORDER BY user_id")).all()
                == expected
            )
        assert run(connection, "check")["revision"] == HEAD


def test_absent_wallet_feed_cannot_spend_a_concurrent_first_credit(
    resource, profile_accounts, db_settings
):
    from threading import Event, local

    from sqlalchemy import event

    from app.db.engine import Database

    owner = profile_accounts[0]
    concurrent = Database(db_settings.model_copy(update={"db_pool_size": 2}))
    created, release = Event(), Event()
    actor = local()

    def intercept(connection, cursor, statement, parameters, context, executemany):
        if getattr(actor, "name", None) == "feed" and statement.startswith(
            "INSERT INTO public.reward_wallets"
        ):
            release.set()

    event.listen(concurrent.engine, "before_cursor_execute", intercept)

    def earn():
        with concurrent.transaction(owner) as s:
            quest_credit(s, uuid4(), 1, NOW.date(), NOW)
            created.set()
            assert release.wait(timeout=5)

    def spend():
        actor.name = "feed"
        assert created.wait(timeout=5)
        try:
            with pytest.raises(ApiError):
                with concurrent.transaction(owner) as s:
                    feed(s, uuid4(), FeedPut(expected_revision=0), NOW)
        finally:
            release.set()

    try:
        with ThreadPoolExecutor(2) as pool:
            first = pool.submit(earn)
            second = pool.submit(spend)
            first.result(timeout=10)
            second.result(timeout=10)
    finally:
        release.set()
        event.remove(concurrent.engine, "before_cursor_execute", intercept)
        concurrent.close()
    with resource.transaction(owner) as s:
        assert view(s, NOW).balance == 50
        assert len(s.scalars(select(RewardEntry)).all()) == 1


def test_notification_accept_awards_thirty_immediately_once(resource, profile_accounts):
    account = profile_accounts[0]
    installation = uuid4()
    event = signal(context="notification_accept")
    request = batch([event], installation)
    with resource.transaction(account) as session:
        assert ingest(session, request, NOW).wallet.balance == 30
    with resource.transaction(account) as session:
        assert ingest(session, request, NOW).wallet.balance == 30
        assert len(session.scalars(select(RewardEntry)).all()) == 1
        assert len(list_own_quests(session, None, 5)) == 1
    duplicate_encounter = signal(
        2,
        NOW + timedelta(seconds=65),
        context="notification_accept",
        encounter_id=event["encounter_id"],
    )
    with resource.transaction(account) as session:
        assert (
            ingest(
                session, batch([duplicate_encounter], installation), NOW + timedelta(seconds=65)
            ).wallet.balance
            == 30
        )

    with resource.transaction(account) as session:
        another = signal(3, NOW + timedelta(seconds=120), context="notification_accept")
        assert (
            ingest(
                session, batch([another], installation), NOW + timedelta(seconds=120)
            ).wallet.balance
            == 60
        )
        assert len(list_own_quests(session, None, 5)) == 1
