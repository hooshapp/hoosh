package expo.modules.hooshusage

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.Promise
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.Executors

/** Process-wide native actor survives React bridge disposal; disk work never runs in window callbacks. */
class InterventionRuntime private constructor(val context: Context) {
  val leases = InterventionLeases()
  private val persistence = OwnerInterventionPersistence(context.noBackupFilesDir)
  val engine = InterventionEngine(persistence)
  val history = HistoryCollector(context)
  private val worker = Executors.newSingleThreadExecutor()
  private val main = Handler(Looper.getMainLooper())
  @Volatile var service: InterventionAccessibilityService? = null
  val epoch = java.util.concurrent.atomic.AtomicLong(0)
  @Volatile var failure: String? = null
  private var reviewOwner: String? = null
  private var review: AlertDialog? = null
  private val preferences get() = context.getSharedPreferences("intervention-disclosure-debug-v1", Context.MODE_PRIVATE)
  fun authorized(): Boolean = try {
    consented() && service != null && context.getSystemService(android.view.accessibility.AccessibilityManager::class.java)
      .getEnabledAccessibilityServiceList(android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
      .any { it.resolveInfo?.serviceInfo?.let { info -> info.packageName == context.packageName && info.name == InterventionAccessibilityService::class.java.name } == true }
  } catch (_: Exception) { false }
  fun consented() = preferences.getBoolean("accepted-v2", false)
  fun boot() = Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT, -1)
  fun unlocked() = LauncherAppCatalog(context).isUnlocked() == true
  internal fun engineRawRead() = engine.readInstalled()
  fun execute(action: () -> Unit) { worker.execute(action) }
  fun notifyService() { main.post { service?.reconcile() } }
  private fun reject(p: Promise, e: Exception) = p.reject((e as? InterventionFailure)?.code ?: "ERR_INTERVENTION_STORAGE", "Android intervention could not complete.", null)
  private fun call(p: Promise, changed: Boolean = false, action: () -> Any?) {
    execute {
      try { val result = action(); if (changed) { failure = null; epoch.incrementAndGet(); notifyService() }; main.post { p.resolve(result) } }
      catch (e: Exception) {
        if (changed && (e !is InterventionFailure || e.code == "ERR_INTERVENTION_STORAGE")) {
          failure = "ERR_INTERVENTION_STORAGE"; epoch.incrementAndGet(); notifyService()
        }
        main.post { reject(p, e) }
      }
    }
  }
  private fun summary(owner: String): Map<String, Any?> = summary(engine.read(owner), System.currentTimeMillis(), authorized())
  private fun summary(value: InterventionRecord?, now: Long, allowed: Boolean): Map<String, Any?> {
    val connected = service
    val windows = value?.let { WeeklySchedules.windows(it.plan, now) }.orEmpty()
    return mapOf("schemaVersion" to 3, "state" to when { failure != null -> "failed"; !allowed -> "needs_permission"; value == null || windows.none { it.endsAt > now } -> "inactive"; else -> "armed" },
      "installedRevision" to value?.plan?.revision, "selectionRevision" to value?.plan?.selectionRevision,
      "selectedAppCount" to (value?.plan?.apps?.size ?: 0), "reasonCount" to windows.size,
      "pendingEventCount" to (value?.events?.size ?: 0), "discardedEventCount" to (value?.discardedEventCount ?: 0), "overlayVisible" to (connected?.visible == true),
      "disclosureAccepted" to consented(), "serviceConnected" to (connected != null))
  }
  // A handle reveals no installation data. All reads/writes still enforce stored ownership;
  // a different account can only take over through the explicitly confirmed claim command.
  fun open(bridge: String, owner: String, promise: Promise) = call(promise) { leases.open(bridge, owner) }
  fun claimOwner(owner: String, token: String, stopPrevious: Boolean, promise: Promise) {
    try { leases.retainForClaim(owner, token) } catch (e: Exception) { reject(promise, e); return }
    call(promise, true) {
      leases.check(owner, token)
      InterventionValidation.require(unlocked(), "ERR_INTERVENTION_PERMISSION")
      persistence.claim(owner, stopPrevious, System.currentTimeMillis())
      summary(owner)
    }
  }
  fun protectionRead(owner: String, promise: Promise) = call(promise) {
    InterventionProtectionSnapshot.read(engine.read(owner), authorized(), consented(), failure != null, System.currentTimeMillis())
  }
  fun status(owner: String, promise: Promise) = call(promise) { summary(owner) }
  fun cancelReview(bridge: String) { main.post { if (reviewOwner == bridge) review?.cancel() } }
  fun reviewAccess(bridge: String, activity: Activity, promise: Promise) {
    if (!leases.isOpen(bridge) || activity.isFinishing || activity.isDestroyed || !activity.hasWindowFocus() || review != null) {
      promise.reject("ERR_INTERVENTION_UNAVAILABLE", "No foreground setup is available.", null); return
    }
    reviewOwner = bridge
    review = AlertDialog.Builder(activity).setTitle("Android app protection access")
      .setMessage("Disconnect uses Android Accessibility access to receive app-window changes and show a visible pause over apps you select during your schedules. It does not read screen contents, typed text, messages or passwords. App identities stay on this device. With your signed-in account, we sync content-free Return home choices, allowance exhaustion and daily protection coverage to calculate credits and streaks. These records include times and dates, not app identities or screen contents. Saved quest details and explicit completion choices also belong to your account. You can always return home, open the app anyway, stop a schedule, or disable this service in Android Settings. Disconnect is not a disability accessibility tool. Enable only Disconnect protection on the next screen.")
      .setNegativeButton("Not now") { _, _ -> promise.resolve(false) }
      .setPositiveButton("I agree — review Settings") { _, _ ->
        execute {
          try {
            if (!preferences.edit().putBoolean("accepted-v2", true).commit()) throw InterventionFailure("ERR_INTERVENTION_STORAGE")
            main.post {
              try {
                // A dismissing Dialog still owns window focus; use Activity lifecycle for the consented settings handoff.
                val resumed = (activity as? LifecycleOwner)?.lifecycle?.currentState?.isAtLeast(Lifecycle.State.RESUMED) ?: activity.hasWindowFocus()
                if (!leases.isOpen(bridge) || activity.isFinishing || activity.isDestroyed || !resumed) throw InterventionFailure("ERR_INTERVENTION_UNAVAILABLE")
                activity.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)); promise.resolve(true)
              } catch (e: Exception) { reject(promise, e) }
            }
          } catch (e: Exception) { main.post { reject(promise, e) } }
        }
      }.setOnCancelListener { promise.resolve(false) }.create().also { dialog ->
        dialog.setOnDismissListener { review = null; reviewOwner = null }; dialog.show()
      }
  }
  fun install(owner: String, token: String, expected: Int, revision: Int, selectionRevision: Int, windows: List<Map<String, Any>>, policy: Map<String, Any>, promise: Promise) = call(promise, true) {
    leases.check(owner, token)
    InterventionValidation.require(authorized() && unlocked(), "ERR_INTERVENTION_PERMISSION")
    InterventionValidation.require(windows.size <= 32)
    fun integer(value: Any?): Long {
      val n = value as? Number ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
      val d = n.toDouble(); InterventionValidation.require(d.isFinite() && d >= 0 && d <= 8640000000000000.0 && d == d.toLong().toDouble()); return d.toLong()
    }
    val parsed = windows.map {
      InterventionValidation.require(it.keys == setOf("reasonId", "startsAt", "endsAt"))
      InterventionWindow(it["reasonId"] as? String ?: throw InterventionFailure("ERR_INTERVENTION_INVALID"), integer(it["startsAt"]), integer(it["endsAt"]))
    }
    val selection = AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1")).read(owner)
    InterventionValidation.require(selection.revision == selectionRevision, "ERR_INTERVENTION_SELECTION_CHANGED")
    val available = LauncherAppCatalog(context).eligibleKeys()
    InterventionValidation.require(unlocked() && available.containsAll(selection.apps), "ERR_INTERVENTION_SELECTION_CHANGED")
    InterventionValidation.require(policy.keys == setOf("timezoneId", "sessionsPerDay", "sessionSeconds"))
    val perDay = integer(policy["sessionsPerDay"]); val seconds = integer(policy["sessionSeconds"])
    InterventionValidation.require(perDay in 1..1000 && seconds in 1..86400)
    val sessionPolicy = SessionPolicy(policy["timezoneId"] as? String ?: throw InterventionFailure("ERR_INTERVENTION_INVALID"), perDay.toInt(), seconds.toInt())
    engine.install(owner, expected, revision, selection, parsed, sessionPolicy, System.currentTimeMillis()); summary(owner)
  }
  private fun scheduleSpec(spec: Map<String, Any>): Pair<WeeklySchedule, SessionPolicy> {
    InterventionValidation.require(spec.keys == setOf("weekdays", "hours", "timezone_id", "session_count", "session_minutes"))
    val hours = spec["hours"] as? Map<*, *> ?: throw InterventionFailure("ERR_SCHEDULE_INCOMPLETE")
    InterventionValidation.require(hours.keys == setOf("start_local", "end_local", "next_day"))
    fun int(value: Any?): Int {
      val number = value as? Number ?: throw InterventionFailure("ERR_SCHEDULE_INCOMPLETE")
      val d = number.toDouble(); InterventionValidation.require(d.isFinite() && d in 0.0..1000.0 * 1440 && d == d.toInt().toDouble())
      return d.toInt()
    }
    val days = spec["weekdays"] as? List<*> ?: throw InterventionFailure("ERR_SCHEDULE_INCOMPLETE")
    val schedule = WeeklySchedule(days.map { int(it) }.sorted(), hours["start_local"] as? String ?: throw InterventionFailure("ERR_SCHEDULE_INCOMPLETE"),
      hours["end_local"] as? String ?: throw InterventionFailure("ERR_SCHEDULE_INCOMPLETE"), hours["next_day"] as? Boolean ?: throw InterventionFailure("ERR_SCHEDULE_INCOMPLETE"),
      spec["timezone_id"] as? String ?: throw InterventionFailure("ERR_SCHEDULE_INCOMPLETE"))
    WeeklySchedules.validate(schedule)
    val minutes = int(spec["session_minutes"]); InterventionValidation.require(minutes in 1..1440)
    val policy = SessionPolicy(schedule.timezone, int(spec["session_count"]), minutes * 60); InterventionValidation.policy(policy)
    return schedule to policy
  }
  private fun scheduleWire(value: WeeklyInstallation, policy: SessionPolicy): Map<String, Any> = mapOf(
    "weekdays" to value.schedule.weekdays, "hours" to mapOf("start_local" to value.schedule.start, "end_local" to value.schedule.end, "next_day" to value.schedule.nextDay),
    "timezone_id" to value.schedule.timezone, "session_count" to policy.sessionsPerDay, "session_minutes" to policy.sessionSeconds / 60)
  private fun previewWindows(windows: List<InterventionWindow>) = windows.map { mapOf("reasonId" to it.reasonId, "startsAt" to it.startsAt, "endsAt" to it.endsAt) }
  private fun scheduleSummary(owner: String): Map<String, Any?> {
    val value = engine.read(owner); val weekly = value?.plan?.weekly; val now = System.currentTimeMillis(); val allowed = authorized()
    val allWindows = value?.let { WeeklySchedules.windows(it.plan, now) }.orEmpty()
    val windows = allWindows.filter { it.reasonId.startsWith("weekly_") }
    return mapOf("observedAt" to now, "native" to summary(value, now, allowed), "spec" to weekly?.let { scheduleWire(it, value.plan.policy) },
      "enabled" to (weekly?.enabled == true), "windows" to previewWindows(windows), "otherReasonCount" to (allWindows.size - windows.size), "otherInstallation" to WeeklySchedules.hasOtherInstallation(value?.plan, allWindows))
  }
  fun scheduleRead(owner: String, promise: Promise) = call(promise) { scheduleSummary(owner) }
  fun schedulePreview(spec: Map<String, Any>, promise: Promise) = call(promise) {
    val (schedule, _) = scheduleSpec(spec)
    mapOf("windows" to previewWindows(WeeklySchedules.compile(schedule, System.currentTimeMillis())))
  }
  fun scheduleApply(owner: String, token: String, expected: Int, revision: Int, selectionRevision: Int, spec: Map<String, Any>, promise: Promise) = call(promise, true) {
    leases.check(owner, token)
    InterventionValidation.require(authorized() && unlocked(), "ERR_INTERVENTION_PERMISSION")
    val (schedule, policy) = scheduleSpec(spec)
    val old = engine.read(owner)
    InterventionValidation.require(old == null || old.plan.weekly != null || old.plan.windows.all { it.reasonId.startsWith("q_") }, "ERR_SCHEDULE_OTHER_INSTALLATION")
    val selection = AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1")).read(owner)
    InterventionValidation.require(selection.revision == selectionRevision && selection.apps.isNotEmpty(), "ERR_INTERVENTION_SELECTION_CHANGED")
    val available = LauncherAppCatalog(context).eligibleKeys()
    InterventionValidation.require(unlocked() && available.containsAll(selection.apps), "ERR_INTERVENTION_SELECTION_CHANGED")
    val now = System.currentTimeMillis()
    engine.install(owner, expected, revision, selection, WeeklySchedules.compile(schedule, now), policy, now, WeeklyInstallation(schedule, selection.apps))
    scheduleSummary(owner)
  }
  private fun questWire(q: QuestInstallation): Map<String, Any?> = mapOf(
    "revision" to q.revision, "firstDate" to q.firstDate, "repeat" to q.repeat,
    "weekdays" to if (q.repeat == "weekly") q.schedule.weekdays else emptyList<Int>(),
    "start" to q.schedule.start, "end" to q.schedule.end, "nextDay" to q.schedule.nextDay,
    "timezone" to q.schedule.timezone, "effectiveFrom" to q.effectiveFrom, "effectiveUntil" to q.effectiveUntil)
  private fun questSummary(owner: String, questId: String): Map<String, Any?> {
    QuestSchedules.id(questId)
    val record = engine.read(owner); val now = System.currentTimeMillis()
    val receipt = record?.plan?.questReceipts?.get(questId)
    val windows = record?.let { QuestSchedules.windows(it.plan, now) }.orEmpty()
      .filter { it.reasonId.startsWith("q_${questId.replace("-", "")}_") }
    return mapOf("owner" to owner, "questId" to questId, "observedAt" to now,
      "remoteRevision" to (receipt?.revision ?: 0), "requestId" to receipt?.requestId,
      "enabled" to (receipt?.enabled == true), "native" to summary(record, now, authorized()),
      "policy" to record?.plan?.policy?.let { mapOf("timezoneId" to it.timezoneId, "sessionsPerDay" to it.sessionsPerDay, "sessionSeconds" to it.sessionSeconds) },
      "versions" to record?.plan?.quests.orEmpty().filter { it.questId == questId }.map { questWire(it) },
      "cancelled" to record?.plan?.cancelledQuestReasons.orEmpty().filter { it.startsWith("q_${questId.replace("-", "")}_") }.sorted(),
      "windows" to previewWindows(windows))
  }
  fun questRead(owner: String, questId: String, promise: Promise) = call(promise) { questSummary(owner, questId) }
  fun selectionRead(owner: String, promise: Promise) = call(promise) {
    InterventionValidation.require(unlocked(), "ERR_SELECTION_UNAVAILABLE")
    val value = AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1")).read(owner)
    val needsReselection = value.apps.isNotEmpty() && !LauncherAppCatalog(context).eligibleKeys().containsAll(value.apps)
    mapOf("owner" to owner, "revision" to value.revision, "selectedAppCount" to value.apps.size,
      "needsReselection" to needsReselection)
  }
  fun questApply(owner: String, token: String, expected: Int, spec: Map<String, Any?>, promise: Promise) = call(promise, true) {
    leases.check(owner, token)
    InterventionValidation.require(unlocked(), "ERR_INTERVENTION_PERMISSION")
    InterventionValidation.require(spec.keys == setOf("questId", "remoteRevision", "requestId", "enabled", "selectionRevision", "versions", "cancelled", "policy"))
    fun whole(value: Any?, max: Long = Int.MAX_VALUE.toLong()): Long {
      val d = (value as? Number)?.toDouble() ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
      InterventionValidation.require(d.isFinite() && d >= 0 && d <= max && d == d.toLong().toDouble())
      return d.toLong()
    }
    fun string(value: Any?) = value as? String ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
    val questId = string(spec["questId"]); val requestId = string(spec["requestId"])
    QuestSchedules.id(questId); QuestSchedules.id(requestId)
    val remote = whole(spec["remoteRevision"]).toInt()
    val enabled = spec["enabled"] as? Boolean ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
    val previous = engine.read(owner)
    if (!enabled && previous == null) return@call questSummary(owner, questId)
    if (enabled) InterventionValidation.require(authorized() && remote > 0, "ERR_INTERVENTION_PERMISSION")
    val selection = if (enabled) AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1")).read(owner)
      else SavedSelection(previous!!.plan.selectionRevision, previous.plan.apps)
    if (enabled) {
      InterventionValidation.require(selection.revision == whole(spec["selectionRevision"]).toInt() && selection.apps.isNotEmpty(), "ERR_INTERVENTION_SELECTION_CHANGED")
      InterventionValidation.require(LauncherAppCatalog(context).eligibleKeys().containsAll(selection.apps) && unlocked(), "ERR_INTERVENTION_SELECTION_CHANGED")
    }
    val raw = spec["versions"] as? List<*> ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
    InterventionValidation.require(raw.size <= 128 && (enabled || raw.isEmpty()))
    val versions = raw.map { item ->
      val q = item as? Map<*, *> ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
      InterventionValidation.require(q.keys == setOf("revision", "firstDate", "repeat", "weekdays", "start", "end", "nextDay", "timezone", "effectiveFrom", "effectiveUntil"))
      val first = string(q["firstDate"])
      val day = try { java.time.LocalDate.parse(first) } catch (_: Exception) { throw InterventionFailure("ERR_QUEST_DATE") }
      val repeat = string(q["repeat"])
      val days = q["weekdays"] as? List<*> ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
      InterventionValidation.require(days.size <= 7 && (repeat == "weekly" || days.isEmpty()))
      val weekdays = if (repeat == "weekly") days.map { whole(it, 6).toInt() }.sorted() else listOf(day.dayOfWeek.value - 1)
      QuestInstallation(questId, whole(q["revision"]).toInt(), first, repeat,
        WeeklySchedule(weekdays, string(q["start"]), string(q["end"]), q["nextDay"] as? Boolean ?: throw InterventionFailure("ERR_INTERVENTION_INVALID"), string(q["timezone"])),
        whole(q["effectiveFrom"], 8640000000000000L), q["effectiveUntil"]?.let { whole(it, 8640000000000000L) }, selection.apps)
    }
    val cancelled = spec["cancelled"] as? List<*> ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
    InterventionValidation.require(cancelled.size <= 256)
    val policy = if (!enabled) previous!!.plan.policy else {
      val p = spec["policy"] as? Map<*, *> ?: throw InterventionFailure("ERR_INTERVENTION_INVALID")
      InterventionValidation.require(p.keys == setOf("timezoneId", "sessionsPerDay", "sessionSeconds"))
      SessionPolicy(string(p["timezoneId"]), whole(p["sessionsPerDay"], 1000).toInt(), whole(p["sessionSeconds"], 86400).toInt())
    }
    engine.applyQuest(owner, expected, selection, questId, remote, requestId, enabled, versions, cancelled.map { string(it) }.toSet(), policy, System.currentTimeMillis())
    questSummary(owner, questId)
  }
  fun questCancel(owner: String, token: String, expected: Int, questId: String, reason: String, promise: Promise) = call(promise, true) {
    leases.check(owner, token)
    InterventionValidation.require(unlocked(), "ERR_INTERVENTION_PERMISSION")
    engine.cancelQuestOccurrence(owner, expected, questId, reason, System.currentTimeMillis())
    questSummary(owner, questId)
  }
  fun cancel(owner: String, token: String, expected: Int, reason: String?, promise: Promise) = call(promise, true) { leases.check(owner, token); engine.cancel(owner, expected, reason, System.currentTimeMillis()); summary(owner) }
  fun drain(owner: String, token: String, limit: Int, promise: Promise) = call(promise) {
    leases.check(owner, token)
    InterventionValidation.require(limit in 1..256)
    val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
    engine.read(owner)?.events.orEmpty().take(limit).map { mapOf("eventId" to it.id, "occurredAt" to format.format(Date(it.at)), "kind" to it.kind, "reasonId" to it.reasonId, "configRevision" to it.revision, "evidence" to if (it.kind == "shield_presented") "native_callback" else "native_action", "metadata" to mapOf("sessionIndex" to it.sessionIndex, "allowanceExhausted" to it.exhausted)) }
  }
  fun acknowledge(owner: String, token: String, ids: List<String>, promise: Promise) = call(promise) { leases.check(owner, token); engine.acknowledge(owner, ids); failure = null; notifyService(); null }
  fun historyStop(owner: String, token: String, promise: Promise) = call(promise) { leases.check(owner,token); history.erase(owner); null }
  fun historyRead(owner: String, promise: Promise) = call(promise) { history.read(owner) }
  fun historyStart(bridge: String, activity: Activity, owner: String, token: String, promise: Promise) {
    if (!leases.isOpen(bridge) || activity.isFinishing || activity.isDestroyed || !activity.hasWindowFocus() || review != null) {
      promise.reject("ERR_HISTORY_UNAVAILABLE", "History setup is unavailable.", null); return
    }
    reviewOwner = bridge
    review = AlertDialog.Builder(activity).setTitle("Start selected-app History?")
      .setMessage("Disconnect will read Android's retained foreground usage for the apps you saved on this device. Only daily durations, dates, selected-app count and coverage are synced to your account. App names, package identities and raw events stay on this device. The first seven complete days become a fixed baseline. Missing data stays unavailable. Restarting replaces this account's current baseline; it does not change app protection. Usage access is separate and can be disabled in Android Settings.")
      .setNegativeButton("Not now") { _, _ -> promise.resolve(null) }
      .setPositiveButton("Start History") { _, _ -> call(promise) {
        leases.check(owner,token); history.begin(owner,java.time.ZoneId.systemDefault().id)
      } }.setOnCancelListener { promise.resolve(null) }.create().also { dialog ->
        dialog.setOnDismissListener { review = null; reviewOwner = null }; dialog.show()
      }
  }
  fun rewardsRead(owner: String, promise: Promise) = call(promise) {
    val record = engine.rewardSnapshot(owner, System.currentTimeMillis()) ?: return@call null
    val r = record.rewards
    val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
    mapOf("installation_id" to r.installation, "timezone_id" to record.plan.policy.timezoneId,
      "discarded" to r.discarded, "events" to r.events.take(32).map { e -> mapOf(
        "event_id" to e.id, "sequence" to e.sequence, "occurred_at" to format.format(Date(e.at)),
        "kind" to e.kind, "day" to e.day, "encounter_id" to e.encounter, "context" to e.context,
        "exhausted" to e.exhausted, "covered" to e.covered) })
  }
  fun rewardsAck(owner: String, token: String, installation: String, sequence: Long, promise: Promise) = call(promise) {
    leases.check(owner, token); engine.acknowledgeRewards(owner, installation, sequence); null
  }
  fun endOwner(owner: String, erase: Boolean, promise: Promise) {
    // Retain native reasons/event ownership at sign-out; full account deletion must coordinate all stores.
    // Fence synchronously at bridge entry, before queued worker mutations can check their handles.
    try { leases.end(owner, erase) } catch (e: Exception) { reject(promise, e); return }
    call(promise, true) {
    try {
      if (erase) { persistence.eraseOwner(owner); history.erase(owner); leases.erased(owner) } else engine.read(owner)
    } catch (e: InterventionFailure) {
      if (e.code == "ERR_INTERVENTION_OWNER") leases.erased(owner) // Never poison a different owner's future scope.
      throw e
    }
    null
    }
  }
  companion object {
    @Volatile private var singleton: InterventionRuntime? = null
    fun get(context: Context): InterventionRuntime = singleton ?: synchronized(this) {
      singleton ?: InterventionRuntime(context.applicationContext).also { singleton = it }
    }
  }
}
