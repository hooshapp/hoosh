package expo.modules.hooshscreentime

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import java.util.Calendar
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HooshScreenTimeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HooshScreenTime")
    AsyncFunction("getSelectedWeeklyMinutes") { apps: List<String> -> selectedWeeklyMinutes(apps) }
    AsyncFunction("getAuthorization") { authorization() }
    AsyncFunction("requestAuthorization") {
      val context = requireNotNull(appContext.reactContext) { "Application context unavailable" }
      if (authorization() != "authorized") {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
          data = Uri.parse("package:" + context.packageName)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
          context.startActivity(intent)
        } catch (error: android.content.ActivityNotFoundException) {
          context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          })
        }
      }
      // Settings is asynchronous. JS rechecks on resume; opening it is not approval.
      authorization()
    }
  }

  private fun selectedWeeklyMinutes(apps: List<String>): Int? {
    if (authorization() != "authorized" || apps.isEmpty()) return null
    val packages = apps.map { knownPackages[it] ?: return null }.toSet()
    val context = appContext.reactContext ?: return null
    val usage = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
    val day = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
      add(Calendar.DAY_OF_YEAR, -7)
    }
    var total = 0L
    val observed = mutableSetOf<String>()
    repeat(7) {
      val start = day.timeInMillis
      day.add(Calendar.DAY_OF_YEAR, 1)
      val end = day.timeInMillis
      val buckets = usage.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end)
        ?.filter { it.firstTimeStamp >= start && it.firstTimeStamp < end && it.lastTimeStamp <= end }
        ?: return null
      // An empty day is indistinguishable from unavailable OS history.
      if (buckets.isEmpty()) return null
      val selected = buckets.filter { it.packageName in packages }
      if (selected.distinctBy { it.packageName }.size != selected.size) return null
      observed.addAll(selected.map { it.packageName })
      val daily = selected.sumOf { it.totalTimeInForeground }
      if (daily < 0 || daily > end - start) return null
      total += daily
    }
    return if (observed == packages && authorization() == "authorized") (total / 60_000).toInt() else null
  }

  private val knownPackages = mapOf(
    "Instagram" to "com.instagram.android",
    "Snapchat" to "com.snapchat.android",
    "TikTok" to "com.zhiliaoapp.musically",
    "YouTube" to "com.google.android.youtube",
    "Reddit" to "com.reddit.frontpage",
    "X" to "com.twitter.android"
  )

  private fun authorization(): String {
    val context = appContext.reactContext ?: return "unavailable"
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return if (mode == AppOpsManager.MODE_ALLOWED) "authorized" else "not_requested"
  }
}
