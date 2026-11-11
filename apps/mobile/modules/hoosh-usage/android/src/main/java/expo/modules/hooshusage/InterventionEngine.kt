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
    InterventionValidation.require(value.allowances.size <= 512 && value.sessions.size <= 512 && value.daily.size <= 512, "ERR_INTERVENTION_LIMIT")
    // Diagnostics must not disable protection/Open anyway when JS/network stays away.
    // A durable gap counter prevents future reward consumers from treating this as complete evidence.
    val dropped = maxOf(0, value.events.size - 256)
    val record = value.copy(events = value.events.takeLast(256), discardedEventCount =
      minOf(Int.MAX_VALUE.toLong(), value.discardedEventCount.toLong() + dropped).toInt())
    disk.write(record); return record
  }
  fun install(owner: String, expected: Int, revision: Int, selection: SavedSelection, windows: List<InterventionWindow>, policy: SessionPolicy, now: Long, weekly: WeeklyInstallation? = null): InterventionRecord {
    InterventionValidation.owner(owner); InterventionValidation.windows(windows); InterventionValidation.policy(policy)
    InterventionValidation.require(revision > 0 && revision > expected && selection.revision > 0 && selection.apps.isNotEmpty())
    SelectionDrafts.validateApps(selection.apps)
    val old = read(owner)
    InterventionValidation.require((old?.plan?.revision ?: 0) == expected, "ERR_INTERVENTION_CONFLICT")
    InterventionValidation.require(old == null || old.plan.policy.timezoneId == policy.timezoneId, "ERR_INTERVENTION_TIMEZONE_MIGRATION")
    if (weekly != null) {
      WeeklySchedules.validate(weekly.schedule)
      InterventionValidation.require(weekly.enabled && weekly.apps == selection.apps && weekly.schedule.timezone == policy.timezoneId)
    }
    val previousWindows = old?.let { WeeklySchedules.windows(it.plan, now) }.orEmpty()
    val quests = old?.plan?.quests.orEmpty().map { it.copy(apps = selection.apps) }
    val questWindows = quests.flatMap { QuestSchedules.compile(it, now) }
      .filter { it.reasonId !in old?.plan?.cancelledQuestReasons.orEmpty() }
    val snapshots = (windows + questWindows).map { w ->
      val previous = previousWindows.find { it.reasonId == w.reasonId && it.startsAt == w.startsAt && now >= it.startsAt && now < it.endsAt }
      w.copy(apps = previous?.apps ?: selection.apps.toSet())
    }
    val allApps = selection.apps + snapshots.flatMap { it.apps }; SelectionDrafts.validateApps(allApps)
    InterventionValidation.windows(snapshots, 512)
    val plan = InterventionPlan(owner, revision, selection.revision, allApps, snapshots, policy, weekly,
      quests, old?.plan?.questReceipts.orEmpty(), old?.plan?.cancelledQuestReasons.orEmpty())
    val kept = old?.allowances.orEmpty().filter { a -> snapshots.any { w -> w.reasonId == a.reasonId && a.app in w.apps && previousWindows.any { it.reasonId == w.reasonId && it.startsAt == w.startsAt && it.endsAt == w.endsAt } } }.map { it.copy(revision = revision) }
    val events = old?.events.orEmpty() + event("rule_activated", null, revision, now)
    return persist(InterventionRecord(plan, allowances = kept, events = events, sessions = old?.sessions.orEmpty(), daily = old?.daily.orEmpty(), discardedEventCount = old?.discardedEventCount ?: 0))
  }
  fun applyQuest(owner: String, expected: Int, selection: SavedSelection, questId: String, remoteRevision: Int, requestId: String, enabled: Boolean,
      versions: List<QuestInstallation>, cancelled: Set<String>, policy: SessionPolicy, now: Long): InterventionRecord {
    InterventionValidation.owner(owner); QuestSchedules.id(questId); QuestSchedules.id(requestId); InterventionValidation.policy(policy)
    val old = read(owner)
    InterventionValidation.require((old?.plan?.revision ?: 0) == expected && expected < Int.MAX_VALUE, "ERR_INTERVENTION_CONFLICT")
    InterventionValidation.require(old == null || old.plan.policy.timezoneId == policy.timezoneId, "ERR_INTERVENTION_TIMEZONE_MIGRATION")
    InterventionValidation.require(remoteRevision >= 0 && versions.size <= 128 && selection.revision > 0 && selection.apps.isNotEmpty())
    versions.forEach { QuestSchedules.validate(it); InterventionValidation.require(it.questId == questId && it.revision <= remoteRevision && it.apps == selection.apps) }
    InterventionValidation.require(!enabled || remoteRevision >= (old?.plan?.questReceipts?.get(questId)?.revision ?: 0), "ERR_QUEST_STALE")
    InterventionValidation.require(enabled || versions.isEmpty())
    val otherQuests = old?.plan?.quests.orEmpty().filter { it.questId != questId && QuestSchedules.compile(it, now).isNotEmpty() }
      .map { if (enabled) it.copy(apps = selection.apps) else it }
    val installed = versions.filter { QuestSchedules.compile(it, now).isNotEmpty() }
    val quests = otherQuests + installed
    InterventionValidation.require(quests.size <= 32 && quests.map { it.questId to it.revision }.toSet().size == quests.size, "ERR_QUEST_LIMIT")
    val prefix = "q_${questId.replace("-", "")}_"
    InterventionValidation.require(cancelled.size <= 256 && cancelled.all { it.startsWith(prefix) && it.matches(Regex("q_[0-9a-f]{32}_v[1-9][0-9]{0,9}_d[0-9]{8}")) })
    val previousWindows = old?.let { WeeklySchedules.windows(it.plan, now) }.orEmpty()
    val remainingQuestReasons = quests.flatMap { QuestSchedules.compile(it, now) }.map { it.reasonId }.toSet()
    val preserved = old?.let { WeeklySchedules.fixed(it.plan) }.orEmpty() +
      previousWindows.filter { it.startsAt <= now && now < it.endsAt &&
        (it.reasonId in remainingQuestReasons || (it.reasonId.startsWith("weekly_") && old?.plan?.weekly?.enabled == true)) }
    val protectedIds = quests.map { it.questId }.toSet() + questId
    val previousReceipts = old?.plan?.questReceipts.orEmpty()
    val receipts = previousReceipts.filterKeys { it in protectedIds }.toMutableMap()
    receipts[questId] = QuestReceipt(maxOf(remoteRevision, previousReceipts[questId]?.revision ?: 0), requestId, enabled)
    // Keep current/active intent receipts; bounded inactive metadata must never become a lifetime quest quota.
    previousReceipts.keys.filter { it !in protectedIds }.sorted().takeLast(256 - receipts.size)
      .forEach { receipts[it] = previousReceipts.getValue(it) }
    val retained = old?.plan?.cancelledQuestReasons.orEmpty().filter { QuestSchedules.pendingCancellation(quests, it, now) }.toSet()
    val skipped = if (versions.isEmpty()) retained.filterNot { it.startsWith(prefix) }.toSet()
      else retained + cancelled.filter { QuestSchedules.pendingCancellation(quests, it, now) }
    InterventionValidation.require(skipped.size <= 256, "ERR_QUEST_LIMIT")
    var plan = InterventionPlan(owner, expected + 1, selection.revision, old?.plan?.apps.orEmpty() + selection.apps,
      preserved, policy, (if (enabled) old?.plan?.weekly?.copy(apps = selection.apps) else old?.plan?.weekly), quests, receipts, skipped)
    val windows = WeeklySchedules.windows(plan, now)
    InterventionValidation.windows(windows, 512)
    // Retain active app snapshots, not an expiring JS-generated future horizon.
    val snapshots = windows.filter { it.startsAt <= now && now < it.endsAt } + WeeklySchedules.fixed(plan)
    val apps = selection.apps + old?.plan?.weekly?.apps.orEmpty() + quests.flatMap { it.apps } + snapshots.flatMap { it.apps }
    SelectionDrafts.validateApps(apps)
    plan = plan.copy(apps = apps, windows = snapshots.distinctBy { it.reasonId })
    val kept = old?.allowances.orEmpty().filter { a -> windows.any { w -> a.reasonId == w.reasonId && a.app in w.apps && previousWindows.any { it.reasonId == w.reasonId && it.startsAt == w.startsAt && it.endsAt == w.endsAt } } }.map { it.copy(revision = plan.revision) }
    return persist(InterventionRecord(plan, kept, old?.events.orEmpty() + event(if (versions.isEmpty()) "rule_deactivated" else "rule_activated", null, plan.revision, now), old?.sessions.orEmpty(), old?.daily.orEmpty(), old?.discardedEventCount ?: 0))
  }
  fun cancelQuestOccurrence(owner: String, expected: Int, questId: String, reason: String, now: Long): InterventionRecord {
    val old = record(owner); QuestSchedules.id(questId)
    InterventionValidation.require(old.plan.revision == expected && expected < Int.MAX_VALUE, "ERR_INTERVENTION_CONFLICT")
    val prefix = "q_${questId.replace("-", "")}_"
    InterventionValidation.require(reason.startsWith(prefix) && reason.matches(Regex("q_[0-9a-f]{32}_v[1-9][0-9]{0,9}_d[0-9]{8}")))
    if (reason in old.plan.cancelledQuestReasons) return old
    val valid = QuestSchedules.pendingCancellation(old.plan.quests.filter { it.questId == questId }, reason, now)
    InterventionValidation.require(valid, "ERR_QUEST_OCCURRENCE")
    val skipped = old.plan.cancelledQuestReasons.filter { QuestSchedules.pendingCancellation(old.plan.quests, it, now) }.toSet() + reason
    InterventionValidation.require(skipped.size <= 256, "ERR_QUEST_LIMIT")
    val plan = old.plan.copy(revision = expected + 1, cancelledQuestReasons = skipped, windows = old.plan.windows.filter { it.reasonId != reason })
    return persist(old.copy(plan = plan, allowances = old.allowances.filter { it.reasonId != reason }.map { it.copy(revision = plan.revision) }, events = old.events + event("rule_deactivated", reason, plan.revision, now)))
  }
  fun cancel(owner: String, expected: Int, reason: String?, now: Long): InterventionRecord {
    val old = record(owner)
    InterventionValidation.require(old.plan.revision == expected && expected < Int.MAX_VALUE, "ERR_INTERVENTION_CONFLICT")
    InterventionValidation.require(reason == null || (old.plan.weekly == null && old.plan.windows.any { it.reasonId == reason }))
    // Preserve unrelated reasons and their existing per-app deadlines across cancellation.
    val plan = old.plan.copy(revision = expected + 1, windows = old.plan.windows.filter { (reason != null && it.reasonId != reason) || (reason == null && QuestSchedules.isReasonId(it.reasonId)) }, weekly = old.plan.weekly?.copy(enabled = false))
    val remaining = WeeklySchedules.windows(plan, now)
    return persist(old.copy(plan = plan, allowances = old.allowances.filter { a -> remaining.any { it.reasonId == a.reasonId } }.map { it.copy(revision = plan.revision) }, events = old.events + event("rule_deactivated", reason, plan.revision, now)))
  }
  fun needed(value: InterventionRecord, app: String, wall: Long, elapsed: Long, boot: Int): List<InterventionWindow> {
    if (app !in value.plan.apps) return emptyList()
    return WeeklySchedules.windows(value.plan, wall).filter { w -> app in w.apps && wall >= w.startsAt && wall < w.endsAt && value.allowances.none { a ->
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
