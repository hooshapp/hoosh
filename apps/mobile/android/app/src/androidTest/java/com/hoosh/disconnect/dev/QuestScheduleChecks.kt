package com.hoosh.disconnect.dev

import expo.modules.hooshusage.*
import java.time.Instant

/** Pure product compiler/actor checks, shared by the JVM runner and actual Android instrumentation. */
internal object QuestScheduleChecks {
  private const val OWNER = "quest-native:00000000-0000-4000-8000-000000000041"
  private const val Q = "00000000-0000-4000-8000-000000000042"
  private const val OTHER = "00000000-0000-4000-8000-000000000043"
  private const val REQUEST = "00000000-0000-4000-8000-000000000044"
  private const val APP = "synthetic.alpha"
  private const val SECOND = "synthetic.beta"
  private val policy = SessionPolicy("UTC", 2, 60)
  private fun at(value: String) = Instant.parse(value).toEpochMilli()
  private val before = at("2026-11-09T08:00:00Z")
  private val during = at("2026-11-09T09:30:00Z")
  private fun quest(id: String = Q, repeat: String = "daily", start: String = "09:00", end: String = "10:00", zone: String = "UTC", first: String = "2026-11-09", revision: Int = 1, from: Long = before, until: Long? = null, apps: Set<String> = setOf(APP)) =
    QuestInstallation(id, revision, first, repeat, WeeklySchedule(listOf(0), start, end, false, zone), from, until, apps)
  private class Memory : InterventionPersistence {
    var value: InterventionRecord? = null
    var failAfterWrite = false
    override fun read() = value
    override fun write(value: InterventionRecord) { this.value = value; if (failAfterWrite) throw InterventionFailure("ERR_INTERVENTION_STORAGE") }
    override fun erase() { value = null }
  }
  private fun apply(engine: InterventionEngine, expected: Int = 0, id: String = Q, versions: List<QuestInstallation> = listOf(quest(id)), now: Long = before, apps: Set<String> = setOf(APP), remote: Int = 1) =
    engine.applyQuest(OWNER, expected, SavedSelection(expected + 1, apps), id, remote, REQUEST, versions.isNotEmpty(), versions, emptySet(), policy, now)
  var lastCase = 0
    private set
  fun run(): Int {
    var count = 0
    fun case(action: () -> Unit) { lastCase = count + 1; action(); count++ }
    fun failure(action: () -> Unit) { try { action(); error("Expected rejection") } catch (_: InterventionFailure) { } }
    case {
      val w = QuestSchedules.compile(quest(repeat = "none"), before)
      check(w.size == 1 && w.single().startsAt == at("2026-11-09T09:00:00Z"))
      check(QuestSchedules.compile(quest(repeat = "none"), at("2026-11-10T09:00:00Z")).isEmpty())
    }
    case {
      val w = QuestSchedules.compile(quest(first = "2027-01-01", repeat = "none"), before).single()
      check(w.startsAt == at("2027-01-01T09:00:00Z"))
    }
    case {
      val w = QuestSchedules.compile(quest(repeat = "weekly"), before)
      check(w.all { it.reasonId.endsWith("20261109") || it.reasonId.endsWith("20261116") })
    }
    case {
      val q = quest().copy(schedule = WeeklySchedule(listOf(0), "23:30", "00:30", true, "America/New_York"))
      val w = QuestSchedules.compile(q, before).first()
      check(w.startsAt == at("2026-11-10T04:30:00Z") && w.endsAt == at("2026-11-10T05:30:00Z"))
    }
    case {
      val q = quest(first = "2026-11-01", repeat = "none", start = "01:15", end = "01:45", zone = "America/New_York", from = 0)
      val w = QuestSchedules.compile(q, at("2026-11-01T00:00:00Z")).single()
      check(w.startsAt == at("2026-11-01T05:15:00Z") && w.endsAt == at("2026-11-01T06:45:00Z"))
    }
    case {
      val q = quest(first = "2026-03-08", repeat = "none", start = "02:15", end = "02:45", zone = "America/New_York", from = 0)
      check(QuestSchedules.compile(q, at("2026-03-08T00:00:00Z")).isEmpty())
    }
    case {
      check(QuestSchedules.compile(quest(from = at("2026-11-09T09:00:00.001Z")), before).none { it.startsAt == at("2026-11-09T09:00:00Z") })
      check(QuestSchedules.compile(quest(until = at("2026-11-09T09:00:00Z")), before).isEmpty())
    }
    case { failure { QuestSchedules.validate(quest(first = "2026-02-30")) }; failure { QuestSchedules.validate(quest(zone = "Not/A_Zone")) }; failure { QuestSchedules.validate(quest(revision = 0)) } }
    case {
      val d = Memory(); val e = InterventionEngine(d); val r = apply(e)
      check(e.needed(r, APP, during, 1, 1).size == 1)
      check(e.needed(r, APP, at("2026-11-09T10:00:00Z"), 1, 1).isEmpty())
      val restarted = InterventionEngine(d)
      check(restarted.needed(restarted.read(OWNER)!!, APP, at("2027-01-01T09:30:00Z"), 1, 2).size == 1)
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val both = apply(e, 1, OTHER)
      check(e.needed(both, APP, during, 1, 1).size == 2)
      val stopped = apply(e, 2, Q, emptyList(), during, remote = 2)
      check(e.needed(stopped, APP, during, 1, 1).single().reasonId.contains(OTHER.replace("-", "")))
      check(stopped.plan.questReceipts[Q]?.enabled == false)
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val reason = e.needed(e.read(OWNER)!!, APP, during, 1, 1).single().reasonId
      val cancelled = e.cancelQuestOccurrence(OWNER, 1, Q, reason, during)
      check(e.needed(cancelled, APP, during, 1, 1).isEmpty())
      check(e.needed(cancelled, APP, at("2026-11-10T09:30:00Z"), 1, 1).isNotEmpty())
      check(e.cancelQuestOccurrence(OWNER, 2, Q, reason, during).plan.revision == 2)
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val allowed = e.allow(OWNER, 1, APP, during, 1000, 1)
      val updated = apply(e, 1, versions = listOf(quest()), now = during + 1000)
      check(updated.daily == allowed.daily && updated.sessions == allowed.sessions)
      check(e.needed(updated, APP, during + 1000, 2000, 1).isEmpty())
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val updated = apply(e, 1, versions = listOf(quest(apps = setOf(SECOND))), now = during, apps = setOf(SECOND))
      check(e.needed(updated, APP, during, 1, 1).isNotEmpty())
      check(e.needed(updated, SECOND, during, 1, 1).isEmpty())
      check(e.needed(updated, SECOND, at("2026-11-10T09:30:00Z"), 1, 1).isNotEmpty())
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val old = quest(until = during)
      val new = quest(revision = 2, from = during, start = "11:00", end = "12:00")
      val updated = apply(e, 1, versions = listOf(old, new), now = during, remote = 2)
      check(e.needed(updated, APP, during, 1, 1).single().reasonId.contains("_v1_"))
      check(e.needed(updated, APP, at("2026-11-09T11:30:00Z"), 1, 1).single().reasonId.contains("_v2_"))
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val schedule = WeeklySchedule(listOf(0), "09:00", "11:00", false, "UTC")
      val both = e.install(OWNER, 1, 2, SavedSelection(2, setOf(APP)), WeeklySchedules.compile(schedule, before), policy, before, WeeklyInstallation(schedule, setOf(APP)))
      check(e.needed(both, APP, during, 1, 1).size == 2)
      val stopped = e.cancel(OWNER, 2, null, during)
      check(e.needed(stopped, APP, during, 1, 1).single().reasonId.startsWith("q_"))
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      failure { apply(e, 0) }; failure { e.read("other:00000000-0000-4000-8000-000000000041") }
      check(e.read(OWNER)!!.plan.revision == 1)
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); d.failAfterWrite = true
      failure { apply(e) }
      check(e.read(OWNER)!!.plan.questReceipts[Q]?.requestId == REQUEST)
    }
    case {
      val leases = InterventionLeases(); val bridge = leases.bridge()
      val old = leases.open(bridge, OWNER); val current = leases.open(bridge, "other:00000000-0000-4000-8000-000000000041")
      leases.retainForClaim("other:00000000-0000-4000-8000-000000000041", current)
      failure { leases.check(OWNER, old) }
      leases.check("other:00000000-0000-4000-8000-000000000041", current)
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val old = d.value!!
      val inactive = (1..255).associate { i -> "10000000-0000-4000-8000-${i.toString(16).padStart(12, '0')}" to QuestReceipt(1, REQUEST, false) }
      d.value = old.copy(plan = old.plan.copy(questReceipts = old.plan.questReceipts + inactive))
      val updated = apply(e, 1, OTHER)
      check(updated.plan.questReceipts.size == 256 && updated.plan.questReceipts.containsKey(Q) && updated.plan.questReceipts.containsKey(OTHER))
      check(e.needed(updated, APP, during, 1, 1).size == 2)
    }
    case {
      val d = Memory(); val e = InterventionEngine(d)
      val windows = listOf(InterventionWindow("q_legacy", before, during + 60000), InterventionWindow("weekly_legacy", before, during + 60000))
      val installed = e.install(OWNER, 0, 1, SavedSelection(1, setOf(APP)), windows, policy, before)
      check(e.needed(installed, APP, during, 1, 1).size == 2)
      check(e.needed(e.cancel(OWNER, 1, null, during), APP, during, 1, 1).isEmpty())
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val start = java.time.LocalDate.parse("2026-01-01")
      val expired = (0L..255L).map { QuestSchedules.reason(Q, 1, start.plusDays(it)) }.toSet()
      d.value = d.value!!.copy(plan = d.value!!.plan.copy(cancelledQuestReasons = expired))
      val reason = QuestSchedules.reason(Q, 1, java.time.LocalDate.parse("2026-11-09"))
      val cancelled = e.cancelQuestOccurrence(OWNER, 1, Q, reason, during)
      check(cancelled.plan.cancelledQuestReasons == setOf(reason))
      check(e.needed(cancelled, APP, during, 1, 1).isEmpty())
    }
    case {
      val d = Memory(); val e = InterventionEngine(d); apply(e)
      val far = QuestSchedules.reason(Q, 1, java.time.LocalDate.parse("2027-01-01"))
      val cancelled = e.cancelQuestOccurrence(OWNER, 1, Q, far, before)
      val updated = apply(e, 2)
      check(far in cancelled.plan.cancelledQuestReasons && far in updated.plan.cancelledQuestReasons)
      check(e.needed(updated, APP, at("2027-01-01T09:30:00Z"), 1, 1).isEmpty())
    }
    return count
  }
}
