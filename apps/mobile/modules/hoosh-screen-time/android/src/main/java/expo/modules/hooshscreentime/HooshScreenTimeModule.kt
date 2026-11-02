package expo.modules.hooshscreentime

import android.app.AppOpsManager
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
