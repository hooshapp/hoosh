from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, timedelta
from threading import Barrier
from uuid import uuid4
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy import select, text

from app.core.errors import ApiError
from app.models.history import HistoryRecord
from app.repositories.history import duration, save, view
from app.repositories.rewards import ingest
from app.schemas.history import HistoryDay, HistoryPut
from tests.db.test_rewards import batch, signal
from tests.support.profiles import headers

pytestmark = pytest.mark.database
NOW = datetime(2026, 11, 13, 12, tzinfo=UTC)


def body(days=42, value=3600000, **patch):
    start = NOW.date() - timedelta(days=days)
    return HistoryPut.model_validate(
        dict(
            expected_revision=0,
            series_id=str(uuid4()),
            timezone_id="UTC",
            selected_count=2,
            started_on=str(start),
            source="android_usage_events_v1",
            days=[
                dict(day=str(start + timedelta(days=i)), usage_ms=value, coverage="reported")
                for i in range(days)
            ],
        )
        | patch
    )


def test_missing_is_nonmutating_and_real_zero_is_not_missing(resource, profile_accounts):
    a, b, _ = profile_accounts
    with resource.transaction(a) as s:
        r = view(s, NOW)
        assert r.revision == 0 and r.week.usage_ms is None and not r.week.eligible
        assert s.scalars(select(HistoryRecord)).all() == []
        r = save(s, body(value=0), NOW)
        assert r.week.eligible and r.week.saved_ms == 0 and r.week.reduction_percent is None
    with resource.transaction(b) as s:
        assert view(s, NOW).series_id is None
        assert s.scalars(select(HistoryRecord)).all() == []


def test_baseline_is_fixed_seven_complete_days_week_and_month_comparable(
    resource, profile_accounts
):
    a = profile_accounts[0]
    data = body()
    with resource.transaction(a) as s:
        r = save(s, data, NOW)
        assert r.week.baseline_ms == r.week.usage_ms == 7 * 3600000
        assert r.month.baseline_ms == r.month.usage_ms == 28 * 3600000
        assert r.baseline_starts_on == data.started_on and r.baseline_reported_days == 7
        revision = r.revision
    with resource.transaction(a) as s:
        assert save(s, data, NOW).revision == revision
        tomorrow = NOW + timedelta(days=1)
        nextday = data.model_copy(
            update={
                "days": [
                    data.days[-1].model_copy(update={"day": NOW.date(), "usage_ms": 2 * 3600000})
                ]
            }
        )
        r = save(s, nextday, tomorrow)
        assert r.baseline_starts_on == data.started_on
        assert r.week.saved_ms == -3600000 and r.week.reduction_percent < 0


def test_missing_coverage_overlap_and_selection_reset_never_invent_savings(
    resource, profile_accounts
):
    a = profile_accounts[0]
    data = body(days=7)
    with resource.transaction(a) as s:
        r = save(s, data, NOW)
        assert r.week.reason == "baseline_overlap" and r.week.saved_ms is None
        rev = r.revision
    with resource.transaction(a) as s:
        changed = body(days=14, expected_revision=rev)
        entries = [d.model_dump(mode="json") for d in changed.days]
        entries[-1] |= {"usage_ms": None, "coverage": "missing"}
        r = save(
            s, HistoryPut.model_validate(changed.model_dump(mode="json") | {"days": entries}), NOW
        )
        assert r.week.reason == "incomplete" and r.week.reported_days == 6
        assert r.week.usage_ms is None and r.week.saved_ms is None
    with pytest.raises(ApiError):
        with resource.transaction(a) as s:
            save(s, body(), NOW)


def test_repair_unknown_but_never_rewrite_complete_evidence(resource, profile_accounts):
    a = profile_accounts[0]
    data = body(days=14)
    entries = [d.model_dump(mode="json") for d in data.days]
    entries[-1] |= {"usage_ms": None, "coverage": "capped"}
    with resource.transaction(a) as s:
        assert not save(
            s, HistoryPut.model_validate(data.model_dump(mode="json") | {"days": entries}), NOW
        ).week.eligible
    with resource.transaction(a) as s:
        assert save(s, data, NOW).week.eligible
    for patch in [
        {"selected_count": 3},
        {"timezone_id": "America/New_York"},
        {"started_on": str(data.started_on - timedelta(days=1))},
        {"days": [data.days[-1].model_dump(mode="json") | {"usage_ms": 4}]},
    ]:
        with pytest.raises(ApiError):
            with resource.transaction(a) as s:
                save(s, HistoryPut.model_validate(data.model_dump(mode="json") | patch), NOW)


def test_dst_day_duration_normalization_future_and_impossible_duration(resource, profile_accounts):
    zone = ZoneInfo("America/New_York")
    assert duration(date(2026, 11, 1), zone) == 25 * 3600000
    assert duration(date(2026, 3, 8), zone) == 23 * 3600000
    a = profile_accounts[0]
    for day, amount in [(NOW.date(), 1), (NOW.date() - timedelta(days=1), 86400001)]:
        with pytest.raises(ApiError):
            with resource.transaction(a) as s:
                save(
                    s,
                    body(days=0, started_on=str(NOW.date() - timedelta(days=1))).model_copy(
                        update={"days": [HistoryDay(day=day, usage_ms=amount, coverage="reported")]}
                    ),
                    NOW,
                )


def test_turnoff_types_dedup_cooldown_and_actual_time_range(resource, profile_accounts):
    a = profile_accounts[0]
    inst = uuid4()
    at = NOW - timedelta(days=1)
    first = signal(1, at, context="initial")
    events = [
        first,
        signal(2, at + timedelta(seconds=10), context="expired"),
        signal(3, at + timedelta(seconds=20), context="mid_session"),
        signal(4, at + timedelta(seconds=90), encounter_id=first["encounter_id"]),
    ]
    with resource.transaction(a) as s:
        assert ingest(s, batch(events, inst), NOW).wallet.balance == 5
    with resource.transaction(a) as s:
        r = view(s, NOW)
        assert r.week.turn_offs == {"initial": 1, "expired": 1, "mid_session": 1}
        assert r.week.usage_ms is None


def test_real_verified_http_roundtrip_auth_isolation_and_no_admin_key(
    profile_client, profile_accounts
):
    client, _, signer = profile_client
    a, b, _ = profile_accounts
    ah, bh = headers(signer, a), headers(signer, b)
    now = datetime.now(UTC)
    shift = now.date() - NOW.date()
    data = body().model_dump(mode="json")
    data["started_on"] = str(date.fromisoformat(data["started_on"]) + shift)
    for d in data["days"]:
        d["day"] = str(date.fromisoformat(d["day"]) + shift)
    r = client.put("/v1/history/series", headers=ah, json=data)
    assert r.status_code == 200 and r.json()["week"]["eligible"]
    assert client.get("/v1/history", headers=ah).json()["series_id"] == data["series_id"]
    assert client.get("/v1/history", headers=bh).json()["series_id"] is None
    assert (
        client.put(
            "/v1/history/series", headers=ah, json=data | {"package_names": ["private.app"]}
        ).status_code
        == 422
    )
    assert client.get("/v1/history").status_code == 401


def test_concurrent_distinct_first_series_cannot_replace_each_other(db_settings, profile_accounts):
    from app.db.engine import Database

    db = Database(db_settings.model_copy(update={"db_pool_size": 2}))
    start = Barrier(2)
    owner = profile_accounts[0]

    def run(_):
        try:
            with db.transaction(owner) as s:
                start.wait(timeout=5)
                save(s, body(), NOW)
            return "ok", None
        except ApiError as error:
            return "conflict", error.details.current_revision

    try:
        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(run, [1, 2]))
        assert sorted(kind for kind, _ in results) == ["conflict", "ok"]
        with db.transaction(owner) as session:
            winning_revision = view(session, NOW).revision
        losing_revision = next(revision for kind, revision in results if kind == "conflict")
        assert losing_revision == winning_revision
    finally:
        db.close()


@pytest.mark.parametrize(
    "damage",
    [
        "ALTER TABLE public.history_records NO FORCE ROW LEVEL SECURITY",
        "GRANT SELECT ON public.history_records TO authenticated",
        "GRANT DELETE ON public.history_records TO disconnect_api",
        "DROP POLICY history_records_select_own ON public.history_records",
        "ALTER TABLE public.history_records DROP CONSTRAINT ck_history_records_selection_range",
    ],
)
def test_history_schema_security_drift_is_rejected(migration_engine, damage):
    from app.db.migrations import MigrationSafetyError, verify

    with migration_engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text(damage))
            with pytest.raises(MigrationSafetyError):
                verify(connection)
        finally:
            transaction.rollback()


def test_additive_0005_upgrade_preserves_rewards_and_profiles(migration_engine, profile_accounts):
    from alembic import command
    from app.db.migrations import HEAD, config, run

    with migration_engine.begin() as connection:
        before = {
            table: connection.execute(
                text(f"SELECT to_jsonb(t)::text FROM public.{table} t ORDER BY to_jsonb(t)::text")
            ).all()
            for table in ("profiles", "reward_wallets", "reward_entries", "reward_streams")
        }
        command.downgrade(config(connection), "20261113_0005")
        assert connection.scalar(text("SELECT to_regclass('public.history_records')")) is None
        assert run(connection)["revision"] == HEAD
        for table, rows in before.items():
            assert (
                connection.execute(
                    text(
                        f"SELECT to_jsonb(t)::text FROM public.{table} t ORDER BY to_jsonb(t)::text"
                    )
                ).all()
                == rows
            )
        assert run(connection, "check")["revision"] == HEAD
