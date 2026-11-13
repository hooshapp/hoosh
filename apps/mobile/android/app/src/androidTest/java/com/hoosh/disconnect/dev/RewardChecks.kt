package com.hoosh.disconnect.dev

import expo.modules.hooshusage.*
import java.time.Instant
import java.util.UUID

/** The actual production engine/outbox, not a replacement scoring implementation. */
internal object RewardChecks {
  fun run(): Int {
    var count = 0
    fun case(run: () -> Unit) { run(); count++ }
    val owner = "qa:00000000-0000-4000-8000-000000000021"
    val app = "synthetic.target"
    val now = Instant.parse("2026-11-13T12:00:00Z").toEpochMilli()
    class Memory : InterventionPersistence {
      var value: InterventionRecord? = null
      override fun read() = value
      override fun write(value: InterventionRecord) { this.value = value }
      override fun erase() { value = null }
    }
    fun engine(): Pair<Memory, InterventionEngine> {
      val disk = Memory(); val e = InterventionEngine(disk)
      e.install(owner, 0, 1, SavedSelection(1, setOf(app)), listOf(InterventionWindow("test", now, now + 600000)), SessionPolicy("UTC", 2, 60), now)
      return disk to e
    }
    case {
      val (_, e) = engine(); val encounter = UUID.randomUUID().toString()
      val r = e.quit(owner, 1, app, encounter, "initial", now)
      check(r.rewards.events.single().let { it.kind == "quit" && it.context == "initial" && it.encounter == encounter && it.sequence == 1L })
      check(r.daily.isEmpty())
    }
    case {
      val (_, e) = engine(); val r = e.allow(owner, 1, app, now, 1000, 1)
      check(r.rewards.events.single().let { it.kind == "allowance" && it.exhausted == false })
      val again = e.read(owner)!!
      check(e.needed(again, app, now + 1000, 2000, 1).isEmpty())
      check(again.rewards.events.size == 1 && again.sessions.single().id == r.sessions.single().id)
      val final = e.allow(owner, 1, app, now + 60000, 61000, 1)
      check(final.rewards.events.last().exhausted == false && !final.rewards.exhausted)
      val extra = e.allow(owner, 1, app, now + 120000, 121000, 1)
      check(extra.rewards.events.last().exhausted == true && extra.rewards.exhausted)
    }
    case {
      val (_, e) = engine(); val r = e.allow(owner, 1, app, now, 1000, 1)
      check(e.nudge(r, app, now + 29000, 30000, 1) == null)
      check(e.nudge(r, app, now + 30000, 31000, 1)?.id == r.sessions.single().id)
      e.dismissNudge(owner, 1, app)
      check(e.nudge(e.read(owner)!!, app, now + 40000, 41000, 1) == null)
      check(e.nudge(e.read(owner)!!, app, now + 60000, 61000, 1) == null)
    }
    case {
      val (_, e) = engine(); val r = e.allow(owner, 1, app, now, 1000, 1)
      val quit = e.quit(owner, 1, app, r.sessions.single().id, "mid_session", now + 30000)
      check(quit.sessions.isEmpty() && quit.allowances.isEmpty() && quit.daily.single().count == 1)
      check(quit.rewards.events.last().context == "mid_session")
    }
    case {
      val (_, e) = engine(); e.quit(owner, 1, app, UUID.randomUUID().toString(), "initial", now)
      val first = e.read(owner)!!.rewards
      e.quit(owner, 1, app, UUID.randomUUID().toString(), "initial", now + 1000)
      e.acknowledgeRewards(owner, first.installation, 1)
      check(e.read(owner)!!.rewards.events.single().sequence == 2L)
      e.acknowledgeRewards(owner, first.installation, 1)
      check(e.read(owner)!!.rewards.events.size == 1)
      try { e.acknowledgeRewards(owner, UUID.randomUUID().toString(), 2); error("accepted wrong stream") } catch (_: InterventionFailure) { }
      try { e.acknowledgeRewards("qa:00000000-0000-4000-8000-000000000022", first.installation, 2); error("accepted wrong owner") } catch (_: InterventionFailure) { }
    }
    case {
      val (_, e) = engine(); repeat(300) { e.quit(owner, 1, app, UUID.randomUUID().toString(), "initial", now + it) }
      val r = e.read(owner)!!
      check(r.events.size == 256 && r.rewards.events.size == 256 && r.rewards.discarded == 44L)
      e.acknowledge(owner, r.events.map { it.id })
      check(e.read(owner)!!.rewards == r.rewards && e.read(owner)!!.events.isEmpty())
      val stopped = e.cancel(owner, 1, null, now + 1000)
      check(stopped.rewards == r.rewards)
    }
    case {
      val (_, e) = engine(); e.quit(owner, 1, app, UUID.randomUUID().toString(), "initial", now)
      val r = e.rewardSnapshot(owner, now + 31L * 86400000)!!
      check(r.rewards.events.isEmpty() && r.rewards.discarded == 1L && r.rewards.next == 2L)
    }
    case {
      val midnight = Instant.parse("2026-11-14T00:00:00Z").toEpochMilli()
      var r = RewardSignals.pulse(RewardState(), midnight - 60000, 1000, 1, "UTC")
      r = RewardSignals.pulse(r, midnight, 61000, 1, "UTC")
      check(r.events.single().covered == false && r.covered)
      r = RewardSignals.pulse(r, midnight + 86400000, 86461000, 1, "UTC", true)
      check(r.events.last().covered == true && r.events.last().day == "2026-11-14")
    }
    case {
      val start = RewardState(day = "2026-11-13", wall = now, elapsed = 1000, boot = 1, covered = true)
      check(!RewardSignals.pulse(start, now + 600000, 601000, 1, "UTC").covered)
      check(RewardSignals.pulse(start, now + 600000, 601000, 1, "UTC", true).covered)
      check(!RewardSignals.pulse(start, now + 600000, 601000, 2, "UTC", true).covered)
      check(!RewardSignals.pulse(start, now + 600000, 1000, 1, "UTC", true).covered)
    }
    case {
      val (disk, e) = engine(); disk.value = disk.value!!.copy(rewards = RewardState(covered = true))
      e.interruptCoverage(); check(!e.read(owner)!!.rewards.covered)
    }
    case {
      val instant = Instant.parse("2026-11-02T05:00:00Z").toEpochMilli()
      check(RewardSignals.yesterday(instant, "America/New_York") == "2026-11-01")
    }
    return count
  }
}
