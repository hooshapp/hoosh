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
    return disk.readForOwner(owner)?.also { InterventionValidation.require(it.plan.owner == owner, "ERR_INTERVENTION_OWNER") }
      ?: throw InterventionFailure("ERR_INTERVENTION_ABSENT")
  }
  fun read(owner: String): InterventionRecord? {
    InterventionValidation.owner(owner)
    return disk.readForOwner(owner)?.also { InterventionValidation.require(it.plan.owner == owner, "ERR_INTERVENTION_OWNER") }
  }
  private fun event(kind: String, reason: String?, revision: Int, now: Long) = InterventionEvent(UUID.randomUUID().toString(), now, kind, reason, revision)
  private fun persist(value: InterventionRecord): InterventionRecord {
    InterventionValidation.require(value.allowances.size <= 512 && value.sessions.size <= 512 && value.daily.size <= 513, "ERR_INTERVENTION_LIMIT")
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
    return persist(InterventionRecord(plan, allowances = kept, events = events, sessions = old?.sessions.orEmpty(), daily = old?.daily.orEmpty(), discardedEventCount = old?.discardedEventCount ?: 0, rewards = old?.rewards ?: RewardState()))
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
    return persist(InterventionRecord(plan, kept, old?.events.orEmpty() + event(if (versions.isEmpty()) "rule_deactivated" else "rule_activated", null, plan.revision, now), old?.sessions.orEmpty(), old?.daily.orEmpty(), old?.discardedEventCount ?: 0, old?.rewards ?: RewardState()))
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
    val running = old.sessions.filter { (old.plan.policy.sharedBudget || it.app == app) && live(it, wall, elapsed, boot) }.minByOrNull { it.elapsedEnd }
    val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = TimeZone.getTimeZone(old.plan.policy.timezoneId) }.format(Date(wall))
    val sharedKey = "__hoosh_shared_budget_v1__"
    val latestDay = old.daily.maxOfOrNull { it.day } ?: today
    val day = maxOf(today, latestDay)
    val prior = old.daily.find { it.app == app && it.day == day }
    val shared = old.daily.find { it.app == sharedKey && it.day == day }?.count?.toLong()
      ?: old.daily.filter { it.day == day && it.app != sharedKey }.sumOf { it.count.toLong() }
    val previousCount = if (old.plan.policy.sharedBudget) shared else (prior?.count ?: 0).toLong()
    InterventionValidation.require(previousCount < Int.MAX_VALUE && shared < Int.MAX_VALUE, "ERR_INTERVENTION_LIMIT")
    InterventionValidation.require(!old.plan.policy.sharedBudget || running != null || previousCount < old.plan.policy.sessionsPerDay, "ERR_INTERVENTION_EXHAUSTED")
    val index = previousCount.toInt() + 1
    val seconds = old.plan.policy.sessionSeconds
    val session = if (running == null) AppSession(app, wall + seconds * 1000L, elapsed + seconds * 1000L, boot, seconds) else if (running.app == app) running else running.copy(app = app, id = UUID.randomUUID().toString())
    val keep = old.allowances.filter { it.wallEnd > wall && it.elapsedEnd > elapsed && it.boot == boot }
    val grants = reasons.map { AppAllowance(app, it.reasonId, revision, minOf(it.endsAt, session.wallEnd), session.elapsedEnd, boot) }
    val daily = if (running != null) old.daily else old.daily.filter { it.app != app && it.app != sharedKey } + DailySessions(app, day, (prior?.count ?: 0) + 1) + (if (old.plan.policy.sharedBudget || old.daily.any { it.app == sharedKey }) listOf(DailySessions(sharedKey, day, shared.toInt() + 1)) else emptyList())
    val sessions = old.sessions.filter { it.app != app && live(it, wall, elapsed, boot) } + session
    val signals = listOf(event("override_selected", null, revision, wall).copy(sessionIndex = if (running == null) index else null, exhausted = if (running == null) index > old.plan.policy.sessionsPerDay else null))
    var rewards = RewardSignals.pulse(old.rewards, wall, elapsed, boot, old.plan.policy.timezoneId)
    if (running == null) rewards = RewardSignals.append(rewards, wall, "allowance", RewardSignals.day(wall, old.plan.policy.timezoneId), exhausted = index > old.plan.policy.sessionsPerDay)
      .copy(exhausted = rewards.exhausted || index > old.plan.policy.sessionsPerDay)
    return persist(old.copy(allowances = keep + grants, sessions = sessions, daily = daily, events = old.events + signals, rewards = rewards))
  }
  private fun live(session: AppSession, wall: Long, elapsed: Long, boot: Int) = session.boot == boot && wall < session.wallEnd && elapsed < session.elapsedEnd &&
    session.wallEnd - wall <= session.seconds * 1000L && session.elapsedEnd - elapsed <= session.seconds * 1000L

  fun action(owner: String, revision: Int, kind: String, now: Long): InterventionRecord {
    InterventionValidation.require(kind in setOf("shield_presented", "quit_selected"))
    val old = record(owner); InterventionValidation.require(old.plan.revision == revision, "ERR_INTERVENTION_CONFLICT")
    return persist(old.copy(events = old.events + event(kind, null, revision, now)))
  }
  fun interruptCoverage() {
    val record = disk.read() ?: return
    if (record.rewards.covered) persist(record.copy(rewards = record.rewards.copy(covered = false)))
  }
  fun checkpoint(wall: Long, elapsed: Long, boot: Int): InterventionRecord? {
    val record = disk.read() ?: return null
    val monitoring = record.plan.weekly?.enabled == true || record.plan.quests.any { it.effectiveUntil == null || it.effectiveUntil > wall } || record.plan.windows.any { it.endsAt > wall }
    val previous = if (monitoring) record.rewards else record.rewards.copy(covered = false)
    val sampled = RewardSignals.pulse(previous, wall, elapsed, boot, record.plan.policy.timezoneId, continuityWitness = true)
    val rewards = if (monitoring) sampled else sampled.copy(covered = false)
    return if (rewards == record.rewards) record else persist(record.copy(rewards = rewards))
  }
  fun running(record: InterventionRecord, app: String, wall: Long, elapsed: Long, boot: Int) =
    record.sessions.find { it.app == app && live(it, wall, elapsed, boot) }
  fun nudge(record: InterventionRecord, app: String, wall: Long, elapsed: Long, boot: Int): AppSession? =
    running(record, app, wall, elapsed, boot)?.takeIf { WeeklySchedules.windows(record.plan, wall).any { w -> app in w.apps } && !it.nudged && it.elapsedEnd - elapsed <= it.seconds * 500L }
  fun dismissNudge(owner: String, revision: Int, app: String) {
    val old = record(owner); InterventionValidation.require(old.plan.revision == revision, "ERR_INTERVENTION_CONFLICT")
    persist(old.copy(sessions = old.sessions.map { if (it.app == app) it.copy(nudged = true) else it }))
  }
  fun quit(owner: String, revision: Int, app: String, encounter: String, context: String, wall: Long): InterventionRecord {
    val old = record(owner); InterventionValidation.require(old.plan.revision == revision, "ERR_INTERVENTION_CONFLICT")
    QuestSchedules.id(encounter); InterventionValidation.require(context in setOf("initial", "expired", "mid_session"))
    val rewards = RewardSignals.append(old.rewards, wall, "quit", RewardSignals.day(wall, old.plan.policy.timezoneId), encounter, context)
    return persist(old.copy(rewards = rewards, sessions = if (context == "mid_session") old.sessions.filter { it.app != app } else old.sessions,
      allowances = if (context == "mid_session") old.allowances.filter { it.app != app } else old.allowances,
      events = old.events + event("quit_selected", null, revision, wall)))
  }
  fun rewardSnapshot(owner: String, wall: Long): InterventionRecord? {
    val old = read(owner) ?: return null
    val retained = old.rewards.events.filter { it.at >= wall - 30L * 86400000 }
    return if (retained.size == old.rewards.events.size) old else persist(old.copy(rewards = old.rewards.copy(
      events = retained, discarded = old.rewards.discarded + old.rewards.events.size - retained.size)))
  }
  fun acknowledgeRewards(owner: String, installation: String, sequence: Long) {
    val old = record(owner); InterventionValidation.require(old.rewards.installation == installation && sequence >= 0 && sequence < old.rewards.next)
    persist(old.copy(rewards = old.rewards.copy(events = old.rewards.events.filter { it.sequence > sequence })))
  }
  fun acknowledge(owner: String, ids: List<String>): InterventionRecord {
    InterventionValidation.require(ids.size <= 256 && ids.all { it.matches(Regex("[0-9a-f-]{36}")) })
    val old = record(owner); return persist(old.copy(events = old.events.filter { it.id !in ids }))
  }
  fun erase(owner: String) { read(owner); disk.erase() }
}
