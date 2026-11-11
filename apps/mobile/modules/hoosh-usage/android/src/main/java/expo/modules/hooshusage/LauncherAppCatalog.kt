package expo.modules.hooshusage

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.os.Build
import android.os.Process
import android.os.UserHandle
import android.os.UserManager
import java.text.Collator
import java.util.concurrent.CancellationException

/** Device-native candidates only. Never serialize these objects into a bridge response. */
class LauncherAppCatalog(private val context: Context) {
  data class Candidates(
    val apps: Map<String, ResolveInfo>, val matched: Int, val eligible: Int,
    val excluded: Int, val self: Int,
  )
  data class Row(val key: String, val label: String, val resolution: ResolveInfo)

  fun isUnlocked(): Boolean? {
    val users = context.getSystemService(UserManager::class.java) ?: return null
    val keyguard = context.getSystemService(KeyguardManager::class.java) ?: return null
    return users.isUserUnlocked && !keyguard.isDeviceLocked
  }

  fun query(): List<ResolveInfo> {
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    return if (Build.VERSION.SDK_INT >= 33) {
      context.packageManager.queryIntentActivities(intent, PackageManager.ResolveInfoFlags.of(0L))
    } else {
      @Suppress("DEPRECATION")
      context.packageManager.queryIntentActivities(intent, 0)
    }
  }

  fun filter(candidates: List<ResolveInfo>): Candidates {
    val unique = linkedMapOf<String, ResolveInfo>()
    var eligible = 0; var excluded = 0; var self = 0
    for (candidate in candidates) {
      val activity = candidate.activityInfo
      val application = activity?.applicationInfo
      if (activity?.packageName == context.packageName) self++
      else if (
        activity == null || application == null || activity.packageName.isNullOrBlank() ||
        !activity.enabled || !activity.exported || !application.enabled ||
        UserHandle.getUserHandleForUid(application.uid) != Process.myUserHandle() ||
        (Build.VERSION.SDK_INT >= 30 && candidate.isCrossProfileIntentForwarderActivity())
      ) excluded++
      else {
        eligible++
        unique.putIfAbsent(activity.packageName, candidate)
      }
    }
    return Candidates(unique.toMap(), candidates.size, eligible, excluded, self)
  }

  fun load(cancelled: () -> Boolean): List<Row> {
    check(isUnlocked() == true)
    val rows = filter(query()).apps.map { (key, candidate) ->
      if (cancelled()) throw CancellationException()
      val label = try { candidate.loadLabel(context.packageManager)?.toString()?.takeIf { it.isNotBlank() } }
        catch (_: Exception) { null }
      Row(key, label ?: key, candidate)
    }
    check(isUnlocked() == true)
    val collator = Collator.getInstance()
    return rows.sortedWith { a, b ->
      val compared = collator.compare(a.label, b.label)
      if (compared == 0) a.key.compareTo(b.key) else compared
    }
  }

  fun eligibleKeys(): Set<String> {
    check(isUnlocked() == true)
    val keys = filter(query()).apps.keys
    check(isUnlocked() == true)
    return keys
  }
}
