package com.hoosh.disconnect.dev

import expo.modules.hooshusage.*
import java.time.Instant
import java.util.TimeZone

/** Actual compiler/engine cases shared by JVM and Android. All dates/owners/apps synthetic. */
internal object WeeklyScheduleChecks {
  private const val OWNER = "qa-development:00000000-0000-4000-8000-000000000031"
  private const val APP = "synthetic.alpha"
  private const val OTHER = "synthetic.beta"
  private fun at(value: String) = Instant.parse(value).toEpochMilli()
  private class Memory : InterventionPersistence {
    var value: InterventionRecord? = null
    override fun read() = value
    override fun write(value: InterventionRecord) { this.value = value }
    override fun erase() { value = null }
  }
  var lastCase = 0
    private set
  fun run(): Int {
    var count = 0
    fun case(action: () -> Unit) { lastCase = count + 1; action(); count++ }
    fun schedule(days: List<Int> = listOf(0), start: String = "09:00", end: String = "17:00", overnight: Boolean = false, zone: String = "UTC") = WeeklySchedule(days, start, end, overnight, zone)
    fun bad(s: WeeklySchedule) { try { WeeklySchedules.validate(s); error("must reject invalid schedule") } catch (_: InterventionFailure) {} }
    fun install(e: InterventionEngine, s: WeeklySchedule, now: Long, expected: Int = 0, apps: Set<String> = setOf(APP)): InterventionRecord =
      e.install(OWNER, expected, expected + 1, SavedSelection(expected + 1, apps), WeeklySchedules.compile(s, now), SessionPolicy(s.timezone, 2, 60), now, WeeklyInstallation(s, apps))
    case { val w = WeeklySchedules.compile(schedule(), at("2026-11-09T08:00:00Z")); check(w.first().startsAt == at("2026-11-09T09:00:00Z") && w.first().endsAt == at("2026-11-09T17:00:00Z")) }
    case { val w = WeeklySchedules.compile(schedule(listOf(6)), at("2026-11-09T08:00:00Z")); check(w.single().startsAt == at("2026-11-15T09:00:00Z")) }
    case { val w = WeeklySchedules.compile(schedule(start = "22:00", end = "02:00", overnight = true), at("2026-11-10T01:00:00Z")); check(w.first().startsAt == at("2026-11-09T22:00:00Z") && w.first().endsAt == at("2026-11-10T02:00:00Z")) }
    case { check(WeeklySchedules.compile(schedule(), at("2026-11-09T17:00:00Z")).none { it.startsAt == at("2026-11-09T09:00:00Z") }) }
    case { val w = WeeklySchedules.compile(schedule((0..6).toList()), at("2026-11-09T08:00:00Z")); check(w.size == 8 && w.map { it.reasonId }.distinct().size == 8) }
    case { bad(schedule(emptyList())); bad(schedule(listOf(0, 0))); bad(schedule(listOf(-1))); bad(schedule(listOf(7))) }
    case { bad(schedule(start = "9:00")); bad(schedule(start = "24:00")); bad(schedule(end = "12:60")) }
    case { bad(schedule(start = "17:00", end = "09:00")); bad(schedule(start = "09:00", end = "09:00")); bad(schedule(overnight = true)); bad(schedule(zone = "Not/A_Zone")) }
    case { val w = WeeklySchedules.compile(schedule(listOf(6), "02:15", "04:00", zone = "America/New_York"), at("2026-03-08T00:00:00Z")).first(); check(w.startsAt == at("2026-03-08T07:00:00Z") && w.endsAt == at("2026-03-08T08:00:00Z")) }
    case { val w = WeeklySchedules.compile(schedule(listOf(6), "02:15", "02:45", zone = "America/New_York"), at("2026-03-08T00:00:00Z")); check(w.none { it.reasonId == "weekly_2026-03-08" }) }
    case { val w = WeeklySchedules.compile(schedule(listOf(6), "01:15", "01:45", zone = "America/New_York"), at("2026-11-01T00:00:00Z")).first(); check(w.startsAt == at("2026-11-01T05:15:00Z") && w.endsAt == at("2026-11-01T06:45:00Z")) }
    case { val w = WeeklySchedules.compile(schedule(listOf(5), "22:00", "04:00", true, "America/New_York"), at("2026-03-08T05:00:00Z")).first(); check(w.endsAt - w.startsAt == 5 * 3600000L) }
    case { val w = WeeklySchedules.compile(schedule(listOf(5), "22:00", "04:00", true, "America/New_York"), at("2026-11-01T04:00:00Z")).first(); check(w.endsAt - w.startsAt == 7 * 3600000L) }
    case { val old = TimeZone.getDefault(); try { TimeZone.setDefault(TimeZone.getTimeZone("Asia/Tokyo")); val w = WeeklySchedules.compile(schedule(zone = "America/New_York"), at("2026-11-09T08:00:00Z")).first(); check(w.startsAt == at("2026-11-09T14:00:00Z")) } finally { TimeZone.setDefault(old) } }
    case { val w = WeeklySchedules.compile(schedule(listOf(6), "01:45", "02:30", zone = "Australia/Lord_Howe"), at("2026-10-03T12:00:00Z")).first(); check(w.endsAt > w.startsAt && w.endsAt - w.startsAt == 15 * 60000L) }
    case { val w = WeeklySchedules.compile(schedule(listOf(4), "09:00", "17:00", zone = "Pacific/Apia"), at("2011-12-29T22:00:00Z")); check(w.none { it.reasonId == "weekly_2011-12-30" }) }
    case { val d = Memory(); val e = InterventionEngine(d); val r = install(e, schedule(), at("2026-11-09T08:00:00Z")); val later = at("2026-12-28T10:00:00Z"); check(e.needed(r, APP, later, 1, 1).single().reasonId == "weekly_2026-12-28"); check(e.read(OWNER)!!.plan.revision == 1) }
    case { val d = Memory(); val e = InterventionEngine(d); val r = install(e, schedule(), at("2026-11-09T08:00:00Z")); check(e.needed(r, APP, at("2026-11-09T08:59:59Z"), 1, 1).isEmpty()); check(e.needed(r, APP, at("2026-11-09T09:00:00Z"), 1, 1).size == 1); check(e.needed(r, APP, at("2026-11-09T17:00:00Z"), 1, 1).isEmpty()) }
    case { val d = Memory(); val e = InterventionEngine(d); val now = at("2026-11-09T10:00:00Z"); install(e, schedule(), now); val changed = install(e, schedule(), now + 1000, 1, setOf(OTHER)); check(e.needed(changed, APP, now + 1000, 1, 1).isNotEmpty()); check(e.needed(changed, OTHER, now + 1000, 1, 1).isEmpty()); check(e.needed(changed, OTHER, at("2026-11-16T10:00:00Z"), 1, 1).isNotEmpty()); check(e.needed(changed, APP, at("2026-11-16T10:00:00Z"), 1, 1).isEmpty()) }
    case { val d = Memory(); val e = InterventionEngine(d); val now = at("2026-12-28T10:00:00Z"); install(e, schedule(), at("2026-11-09T10:00:00Z")); val changed = install(e, schedule(), now, 1, setOf(OTHER)); check(e.needed(changed, APP, now, 1, 1).isNotEmpty()); check(e.needed(changed, OTHER, now, 1, 1).isEmpty()) }
    case { val d = Memory(); val e = InterventionEngine(d); val now = at("2026-11-09T10:00:00Z"); install(e, schedule(), now); val allowed = e.allow(OWNER, 1, APP, now, 1000, 1); val changed = install(e, schedule(), now + 1000, 1); check(changed.daily == allowed.daily && changed.sessions == allowed.sessions); check(e.needed(changed, APP, now + 1000, 2000, 1).isEmpty()); val stopped = e.cancel(OWNER, 2, null, now + 2000); check(stopped.plan.weekly?.enabled == false && stopped.daily == allowed.daily); check(e.needed(stopped, APP, at("2026-11-16T10:00:00Z"), 1, 1).isEmpty()) }
    case { val d = Memory(); val e = InterventionEngine(d); val now = at("2026-11-09T10:00:00Z"); install(e, schedule(), now); try { install(e, schedule(), now, 0); error("stale") } catch (x: InterventionFailure) { check(x.code == "ERR_INTERVENTION_CONFLICT") }; check(e.read(OWNER)!!.plan.revision == 1) }
    case { val d = Memory(); val e = InterventionEngine(d); val now = at("2026-11-09T10:00:00Z"); install(e, schedule(), now); try { install(e, schedule(zone = "America/New_York"), now, 1); error("zone") } catch (x: InterventionFailure) { check(x.code == "ERR_INTERVENTION_TIMEZONE_MIGRATION") }; check(e.read(OWNER)!!.plan.policy.timezoneId == "UTC") }
    case { val d = Memory(); val e = InterventionEngine(d); val now = at("2026-11-09T08:00:00Z"); val r = install(e, schedule(), now); val a = InterventionProtectionSnapshot.read(r, true, true, false, now)["status"] as Map<*, *>; val b = InterventionProtectionSnapshot.read(r, true, true, false, at("2026-12-28T10:00:00Z"))["status"] as Map<*, *>; check(a["state"] == "inactive" && b["state"] == "active"); check((b["installedReasonIds"] as List<*>).contains("weekly_2026-12-28")) }
    return count
  }
}
