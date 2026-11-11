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
  val engine = InterventionEngine(AtomicInterventionPersistence(File(context.noBackupFilesDir, "intervention-debug-v1/state.json")))
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
  fun consented() = preferences.getBoolean("accepted-v1", false)
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
    return mapOf("state" to when { failure != null -> "failed"; !allowed -> "needs_permission"; value == null || windows.none { it.endsAt > now } -> "inactive"; else -> "armed" },
      "installedRevision" to value?.plan?.revision, "selectionRevision" to value?.plan?.selectionRevision,
      "selectedAppCount" to (value?.plan?.apps?.size ?: 0), "reasonCount" to windows.size,
      "pendingEventCount" to (value?.events?.size ?: 0), "overlayVisible" to (connected?.visible == true),
      "disclosureAccepted" to consented(), "serviceConnected" to (connected != null))
  }
  fun open(bridge: String, owner: String, promise: Promise) = call(promise) { engine.read(owner); leases.open(bridge, owner) }
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
    review = AlertDialog.Builder(activity).setTitle("Android intervention test access")
      .setMessage("This development-only test uses Android Accessibility access to receive app-window changes and show a visible pause over the apps you select. It does not read screen contents, typed text, messages or passwords. App identities and events stay on this device; this test sends nothing to a server. You can leave the pause, open the app anyway, stop the test, or disable the service in Android Settings. This is not a disability accessibility tool. Enable only Disconnect intervention test on the next screen. No installed test rule is a production plan.")
      .setNegativeButton("Not now") { _, _ -> promise.resolve(false) }
      .setPositiveButton("I agree — review Settings") { _, _ ->
        execute {
          try {
            if (!preferences.edit().putBoolean("accepted-v1", true).commit()) throw InterventionFailure("ERR_INTERVENTION_STORAGE")
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
    val windows = value?.let { WeeklySchedules.windows(it.plan, now) }.orEmpty()
    return mapOf("observedAt" to now, "native" to summary(value, now, allowed), "spec" to weekly?.let { scheduleWire(it, value.plan.policy) },
      "enabled" to (weekly?.enabled == true), "windows" to previewWindows(windows), "otherInstallation" to (value != null && weekly == null && value.plan.windows.isNotEmpty()))
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
    InterventionValidation.require(old == null || old.plan.weekly != null || old.plan.windows.isEmpty(), "ERR_SCHEDULE_OTHER_INSTALLATION")
    val selection = AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1")).read(owner)
    InterventionValidation.require(selection.revision == selectionRevision && selection.apps.isNotEmpty(), "ERR_INTERVENTION_SELECTION_CHANGED")
    val available = LauncherAppCatalog(context).eligibleKeys()
    InterventionValidation.require(unlocked() && available.containsAll(selection.apps), "ERR_INTERVENTION_SELECTION_CHANGED")
    val now = System.currentTimeMillis()
    engine.install(owner, expected, revision, selection, WeeklySchedules.compile(schedule, now), policy, now, WeeklyInstallation(schedule, selection.apps))
    scheduleSummary(owner)
  }
  fun cancel(owner: String, token: String, expected: Int, reason: String?, promise: Promise) = call(promise, true) { leases.check(owner, token); engine.cancel(owner, expected, reason, System.currentTimeMillis()); summary(owner) }
  fun drain(owner: String, token: String, limit: Int, promise: Promise) = call(promise) {
    leases.check(owner, token)
    InterventionValidation.require(limit in 1..256)
    val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
    engine.read(owner)?.events.orEmpty().take(limit).map { mapOf("eventId" to it.id, "occurredAt" to format.format(Date(it.at)), "kind" to it.kind, "reasonId" to it.reasonId, "configRevision" to it.revision, "evidence" to if (it.kind == "shield_presented") "native_callback" else "native_action", "metadata" to mapOf("sessionIndex" to it.sessionIndex, "allowanceExhausted" to it.exhausted)) }
  }
  fun acknowledge(owner: String, token: String, ids: List<String>, promise: Promise) = call(promise) { leases.check(owner, token); engine.acknowledge(owner, ids); failure = null; notifyService(); null }
  fun endOwner(owner: String, erase: Boolean, promise: Promise) = call(promise, true) {
    // Retain native reasons/event ownership at sign-out; full account deletion must coordinate all stores.
    leases.end(owner, erase) // Fence old handles even when storage/erasure subsequently fails.
    try {
      if (erase) { engine.erase(owner); leases.erased(owner) } else engine.read(owner)
    } catch (e: InterventionFailure) {
      if (e.code == "ERR_INTERVENTION_OWNER") leases.erased(owner) // Never poison a different owner's future scope.
      throw e
    }
    null
  }
  companion object {
    @Volatile private var singleton: InterventionRuntime? = null
    fun get(context: Context): InterventionRuntime = singleton ?: synchronized(this) {
      singleton ?: InterventionRuntime(context.applicationContext).also { singleton = it }
    }
  }
}
