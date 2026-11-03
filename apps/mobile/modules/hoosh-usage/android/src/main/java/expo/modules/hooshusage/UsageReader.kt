package expo.modules.hooshusage

import android.app.AppOpsManager
import android.app.KeyguardManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.os.Build
import android.os.Process
import android.os.UserManager

/** No package/event identifiers cross the bridge or enter storage/logs. No enforcement. */
class UsageReader(private val context: Context) {
  fun capabilities(): Map<String, Any?> = mapOf(
    "platform" to "android", "mode" to "unsupported", "selectionUI" to "unavailable",
    "supportsUsageThreshold" to false, "supportsScheduledRestriction" to false,
    "supportsTemporaryAllowance" to false, "supportsAdvanceWarning" to false,
    "supportsUsageSummary" to false
  )

  fun status(): Map<String, Any?> {
    val access = authorization()
    return mapOf("authorization" to access, "state" to if (access == "denied") "needs_permission" else "inactive",
      "installedRevision" to null, "installedReasonIds" to emptyList<String>())
  }

  /** Launch only on explicit intent; permission is re-read separately on foreground return. */
  fun openUsageAccess(): Boolean {
    val specific = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:${context.packageName}"))
    val general = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    val intent = if (specific.resolveActivity(context.packageManager) != null) specific else general
    if (intent.resolveActivity(context.packageManager) == null) throw IllegalStateException("Usage access settings unavailable")
    context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    return true
  }
  fun authorization(): String {
    return try {
      val operations = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
        ?: return "unavailable"
      val mode = if (Build.VERSION.SDK_INT >= 29) {
        operations.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        operations.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
      if (mode == AppOpsManager.MODE_ALLOWED) "authorized" else "denied"
    } catch (_: Exception) { "error" }
  }

  fun probe(minutes: Int): Map<String, Any?> {
    require(minutes in 1..15) { "Window must be between 1 and 15 minutes" }
    val end = System.currentTimeMillis()
    val start = end - minutes * 60_000L
    val access = authorization()
    val unlocked = (context.getSystemService(Context.USER_SERVICE) as? UserManager)?.isUserUnlocked == true
    val locked = (context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager)?.isDeviceLocked != false
    val base = mapOf<String, Any?>("apiLevel" to Build.VERSION.SDK_INT, "authorization" to access,
      "userUnlocked" to unlocked, "deviceLocked" to locked, "windowMinutes" to minutes,
      "selfPackageVisible" to selfPackageVisible(), "eventLimit" to 1000)
    if (!unlocked || locked) return base + mapOf("state" to "locked", "eventCount" to null, "capped" to false)
    if (access != "authorized") return base + mapOf("state" to access, "eventCount" to null, "capped" to false)
    return try {
      val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      val events = manager?.queryEvents(start, end)
        ?: return base + mapOf("state" to "unavailable", "eventCount" to null, "capped" to false)
      val event = UsageEvents.Event()
      var count = 0
      while (count < 1000 && events.hasNextEvent()) {
        if (!events.getNextEvent(event)) break
        count++
      }
      // Recheck after the query: a revoked/locked read is unknown, never measured zero.
      if (authorization() != "authorized" || !(context.getSystemService(Context.USER_SERVICE) as UserManager).isUserUnlocked ||
          (context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager)?.isDeviceLocked != false)
        base + mapOf("state" to "unavailable", "eventCount" to null, "capped" to false)
      else base + mapOf("state" to "ready", "eventCount" to count, "capped" to events.hasNextEvent())
    } catch (_: Exception) { base + mapOf("state" to "error", "eventCount" to null, "capped" to false) }
  }

  private fun selfPackageVisible(): Boolean = try {
    @Suppress("DEPRECATION")
    context.packageManager.getPackageInfo(context.packageName, 0)
    true
  } catch (_: Exception) { false }
}
