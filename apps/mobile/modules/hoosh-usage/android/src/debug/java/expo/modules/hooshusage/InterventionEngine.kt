package expo.modules.hooshusage

import java.util.UUID
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.Date
import java.util.TimeZone

/** All calls serialized by Runtime; pure clock/boot inputs make boundary/race behavior testable. */
class InterventionEngine(private val disk: InterventionPersistence) {
  internal fun readInstalled(): InterventionRecord? = disk.read()
  private fun record(owner: String): InterventionRecord {
    InterventionValidation.owner(owner)
    return disk.read()?.also { InterventionValidation.require(it.plan.owner == owner, "ERR_INTERVENTION_OWNER") }
      ?: throw InterventionFailure("ERR_INTERVENTION_ABSENT")
  }
  fun read(owner: String): InterventionRecord? {
    InterventionValidation.owner(owner)
    return disk.read()?.also { InterventionValidation.require(it.plan.owner == owner, "ERR_INTERVENTION_OWNER") }
  }
  private fun event(kind: String, reason: String?, revision: Int, now: Long) = InterventionEvent(UUID.randomUUID().toString(), now, kind, reason, revision)
  private fun persist(value: InterventionRecord): InterventionRecord {
    InterventionValidation.require(value.events.size <= 256, "ERR_INTERVENTION_JOURNAL_FULL")
    InterventionValidation.require(value.allowances.size <= 512 && value.sessions.size <= 512 && value.daily.size <= 512, "ERR_INTERVENTION_LIMIT")
    disk.write(value); return value
  }
  fun install(owner: String, expected: Int, revision: Int, selection: SavedSelection, windows: List<InterventionWindow>, policy: SessionPolicy, now: Long): InterventionRecord {
    InterventionValidation.owner(owner); InterventionValidation.windows(windows); InterventionValidation.policy(policy)
    InterventionValidation.require(revision > 0 && revision > expected && selection.revision > 0 && selection.apps.isNotEmpty())
    SelectionDrafts.validateApps(selection.apps)
    val old = read(owner)
    InterventionValidation.require((old?.plan?.revision ?: 0) == expected, "ERR_INTERVENTION_CONFLICT")
    InterventionValidation.require(old == null || old.plan.policy.timezoneId == policy.timezoneId, "ERR_INTERVENTION_TIMEZONE_MIGRATION")
    val snapshots = windows.map { w ->
      val previous = old?.plan?.windows?.find { it.reasonId == w.reasonId && it.startsAt == w.startsAt && now >= it.startsAt && now < it.endsAt }
      w.copy(apps = previous?.apps ?: selection.apps.toSet())
    }
    val allApps = selection.apps + snapshots.flatMap { it.apps }; SelectionDrafts.validateApps(allApps)
    val plan = InterventionPlan(owner, revision, selection.revision, allApps, snapshots, policy)
    val kept = old?.allowances.orEmpty().filter { a -> snapshots.any { w -> w.reasonId == a.reasonId && a.app in w.apps && old!!.plan.windows.any { it.reasonId == w.reasonId && it.startsAt == w.startsAt && it.endsAt == w.endsAt } } }.map { it.copy(revision = revision) }
    val events = old?.events.orEmpty() + event("rule_activated", null, revision, now)
    return persist(InterventionRecord(plan, allowances = kept, events = events, sessions = old?.sessions.orEmpty(), daily = old?.daily.orEmpty()))
  }
  fun cancel(owner: String, expected: Int, reason: String?, now: Long): InterventionRecord {
    val old = record(owner)
    InterventionValidation.require(old.plan.revision == expected && expected < Int.MAX_VALUE, "ERR_INTERVENTION_CONFLICT")
    InterventionValidation.require(reason == null || old.plan.windows.any { it.reasonId == reason })
    // Preserve unrelated reasons and their existing per-app deadlines across cancellation.
    val plan = old.plan.copy(revision = expected + 1, windows = old.plan.windows.filter { reason != null && it.reasonId != reason })
    return persist(old.copy(plan = plan, allowances = old.allowances.filter { a -> plan.windows.any { it.reasonId == a.reasonId } }.map { it.copy(revision = plan.revision) }, events = old.events + event("rule_deactivated", reason, plan.revision, now)))
  }
  fun needed(value: InterventionRecord, app: String, wall: Long, elapsed: Long, boot: Int): List<InterventionWindow> {
    if (app !in value.plan.apps) return emptyList()
    return value.plan.windows.filter { w -> app in w.apps && wall >= w.startsAt && wall < w.endsAt && value.allowances.none { a ->
      a.app == app && a.reasonId == w.reasonId && a.revision == value.plan.revision && a.boot == boot && wall < a.wallEnd && elapsed < a.elapsedEnd &&
        // A wall-clock rollback cannot extend a running allowance.
        value.sessions.any { session -> session.app == app && live(session, wall, elapsed, boot) }
    } }
  }
  fun allow(owner: String, revision: Int, app: String, wall: Long, elapsed: Long, boot: Int): InterventionRecord {
    val old = record(owner); InterventionValidation.require(old.plan.revision == revision, "ERR_INTERVENTION_CONFLICT")
    val reasons = needed(old, app, wall, elapsed, boot); InterventionValidation.require(reasons.isNotEmpty())
    val running = old.sessions.find { it.app == app && live(it, wall, elapsed, boot) }
    val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = TimeZone.getTimeZone(old.plan.policy.timezoneId) }.format(Date(wall))
    val prior = old.daily.find { it.app == app }
    // Do not create a new allowance bucket when the wall date moves backwards.
    val day = if (prior != null && prior.day > today) prior.day else today
    val previousCount = if (prior?.day == day) prior.count else 0
    InterventionValidation.require(previousCount < Int.MAX_VALUE, "ERR_INTERVENTION_LIMIT")
    val index = previousCount + 1
    val seconds = old.plan.policy.sessionSeconds
    val session = running ?: AppSession(app, wall + seconds * 1000L, elapsed + seconds * 1000L, boot, seconds)
    val keep = old.allowances.filter { it.wallEnd > wall && it.elapsedEnd > elapsed && it.boot == boot }
    val grants = reasons.map { AppAllowance(app, it.reasonId, revision, minOf(it.endsAt, session.wallEnd), session.elapsedEnd, boot) }
    val daily = if (running != null) old.daily else old.daily.filter { it.app != app } + DailySessions(app, day, index)
    val sessions = old.sessions.filter { it.app != app && live(it, wall, elapsed, boot) } + session
    val signals = listOf(event("override_selected", null, revision, wall).copy(sessionIndex = if (running == null) index else null, exhausted = if (running == null) index > old.plan.policy.sessionsPerDay else null))
    return persist(old.copy(allowances = keep + grants, sessions = sessions, daily = daily, events = old.events + signals))
  }
  private fun live(session: AppSession, wall: Long, elapsed: Long, boot: Int) = session.boot == boot && wall < session.wallEnd && elapsed < session.elapsedEnd &&
    session.wallEnd - wall <= session.seconds * 1000L && session.elapsedEnd - elapsed <= session.seconds * 1000L

  fun action(owner: String, revision: Int, kind: String, now: Long): InterventionRecord {
    InterventionValidation.require(kind in setOf("shield_presented", "quit_selected"))
    val old = record(owner); InterventionValidation.require(old.plan.revision == revision, "ERR_INTERVENTION_CONFLICT")
    return persist(old.copy(events = old.events + event(kind, null, revision, now)))
  }
  fun acknowledge(owner: String, ids: List<String>): InterventionRecord {
    InterventionValidation.require(ids.size <= 256 && ids.all { it.matches(Regex("[0-9a-f-]{36}")) })
    val old = record(owner); return persist(old.copy(events = old.events.filter { it.id !in ids }))
  }
  fun erase(owner: String) { read(owner); disk.erase() }
}
