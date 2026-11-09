package com.hoosh.disconnect.dev

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.graphics.drawable.Drawable
import android.os.Process
import android.os.SystemClock
import expo.modules.hooshusage.UsageReader
import expo.modules.hooshusage.LauncherAppCatalog

/** Test APK only. No catalog/identifier, drawable, exception text or usage event is returned. */
internal class SelectionDiscoveryProbe(
  private val context: Context,
  private val query: () -> List<ResolveInfo> = { launcherActivities(context) },
  private val label: (ResolveInfo) -> CharSequence? = { it.loadLabel(context.packageManager) },
  private val icon: (ResolveInfo) -> Drawable? = { it.loadIcon(context.packageManager) },
  private val unlocked: () -> Boolean? = { isUnlocked(context) },
  private val resourceLimit: Int = 64,
) {
  init { require(resourceLimit in 1..64) }

  fun read(): Map<String, Any?> {
    val started = SystemClock.elapsedRealtime()
    val result = mutableMapOf<String, Any?>(
      "schemaVersion" to 1,
      "scope" to "current_profile_launcher_candidates",
      "identitiesExported" to false,
      "resourceCheckLimit" to resourceLimit,
      "usageAuthorization" to null,
      "queryAllPackagesDeclared" to null,
      "overlayDeclared" to null,
      "accessibilityServiceDeclared" to null,
      "targetUidVerified" to false,
    )
    for (key in COUNT_KEYS) result[key] = null
    result["resourceChecksCapped"] = null
    fun finish(state: String, failure: String? = null): Map<String, Any?> {
      result["state"] = state
      result["failureCode"] = failure
      result["elapsedMs"] = SystemClock.elapsedRealtime() - started
      return result.toMap()
    }
    try {
      if (context.applicationInfo.uid != Process.myUid()) {
        return finish("error", "wrong_context")
      }
      result["targetUidVerified"] = true
      if (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE == 0) {
        return finish("error", "not_debuggable")
      }
      @Suppress("DEPRECATION")
      val own = context.packageManager.getPackageInfo(
        context.packageName, PackageManager.GET_PERMISSIONS or PackageManager.GET_SERVICES,
      )
      val permissions = own.requestedPermissions.orEmpty().toSet()
      val broad = "android.permission.QUERY_ALL_PACKAGES" in permissions
      val overlay = "android.permission.SYSTEM_ALERT_WINDOW" in permissions
      val accessibility = own.services.orEmpty().any {
        it.permission == "android.permission.BIND_ACCESSIBILITY_SERVICE"
      }
      result["queryAllPackagesDeclared"] = broad
      result["overlayDeclared"] = overlay
      result["accessibilityServiceDeclared"] = accessibility
      if (broad || overlay || accessibility) return finish("error", "unsafe_manifest")
      result["usageAuthorization"] = UsageReader(context).authorization()
      when (unlocked()) {
        null -> return finish("unavailable", "lock_state_unavailable")
        false -> return finish("locked")
        true -> Unit
      }

      val candidates = query()
      val filtered = LauncherAppCatalog(context).filter(candidates)
      val unique = filtered.apps

      // Cap expensive resource resolution, not discovery counts. Never retain icon data.
      var labels = 0
      var labelFailures = 0
      var blankLabels = 0
      var icons = 0
      var iconFailures = 0
      val sampled = unique.toSortedMap().values.take(resourceLimit)
      for (candidate in sampled) {
        try {
          if (label(candidate).isNullOrBlank()) {
            blankLabels++
            labelFailures++
          } else labels++
        } catch (_: Exception) { labelFailures++ }
        try {
          if (icon(candidate) != null) icons++ else iconFailures++
        } catch (_: Exception) { iconFailures++ }
      }
      // A lock during discovery must not expose even aggregate inventory counts.
      when (unlocked()) {
        null -> return finish("unavailable", "lock_state_unavailable")
        false -> return finish("locked")
        true -> Unit
      }
      result.putAll(mapOf(
        "matchedActivityCount" to candidates.size,
        "eligibleActivityCount" to filtered.eligible,
        "excludedActivityCount" to filtered.excluded,
        "selfActivityCount" to filtered.self,
        "uniquePackageCount" to unique.size,
        "duplicateActivityCount" to filtered.eligible - unique.size,
        "sampledPackageCount" to sampled.size,
        "labelResolutionSuccessCount" to labels,
        "labelResolutionFailureCount" to labelFailures,
        "blankLabelCount" to blankLabels,
        "iconResolutionSuccessCount" to icons,
        "iconResolutionFailureCount" to iconFailures,
        "resourceChecksCapped" to (sampled.size < unique.size),
      ))
      return finish("ready")
    } catch (_: SecurityException) {
      return finish("unavailable", "query_denied")
    } catch (_: Exception) {
      return finish("error", "probe_failed")
    }
  }

  companion object {
    val COUNT_KEYS = listOf(
      "matchedActivityCount", "eligibleActivityCount", "excludedActivityCount",
      "selfActivityCount", "uniquePackageCount", "duplicateActivityCount",
      "sampledPackageCount", "labelResolutionSuccessCount", "labelResolutionFailureCount",
      "blankLabelCount", "iconResolutionSuccessCount", "iconResolutionFailureCount",
    )

    private fun launcherActivities(context: Context): List<ResolveInfo> = LauncherAppCatalog(context).query()
    private fun isUnlocked(context: Context): Boolean? = LauncherAppCatalog(context).isUnlocked()
  }
}
