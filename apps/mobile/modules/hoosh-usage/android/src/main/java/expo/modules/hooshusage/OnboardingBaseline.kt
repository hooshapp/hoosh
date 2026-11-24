package expo.modules.hooshusage

import android.content.Context
import java.io.File
import java.time.Instant
import java.time.ZoneId

/** Read-only, aggregate-only onboarding input. Does not start/reset/persist History. */
class OnboardingBaseline(private val context: Context) {
  fun read(owner: String): Map<String, Any?> {
    InterventionValidation.owner(owner)
    if (LauncherAppCatalog(context).isUnlocked() != true) return mapOf("state" to "locked")
    if (UsageReader(context).authorization() != "authorized") return mapOf("state" to "needs_permission")
    val store = AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1"))
    val selection = store.read(owner)
    if (selection.apps.isEmpty() || !LauncherAppCatalog(context).eligibleKeys().containsAll(selection.apps)) return mapOf("state" to "selection_changed")
    val now = System.currentTimeMillis(); val zone = ZoneId.systemDefault()
    val today = Instant.ofEpochMilli(now).atZone(zone).toLocalDate()
    val collector = HistoryCollector(context)
    val days = (1L downTo 1L).map { offset ->
      val result = collector.query(today.minusDays(offset), zone, now, selection.apps)
      mapOf("date" to result.day, "usageMs" to result.usage, "coverage" to if (result.coverage == "reported") "reported" else "missing")
    }
    if (store.read(owner) != selection) return mapOf("state" to "selection_changed")
    if (UsageReader(context).authorization() != "authorized") return mapOf("state" to "needs_permission")
    return mapOf("state" to "ready", "source" to "android_usage_events_v1", "owner" to owner,
      "selectionRevision" to selection.revision, "selectedAppCount" to selection.apps.size,
      "timezone" to zone.id, "endsBefore" to today.toString(), "days" to days)
  }
}
