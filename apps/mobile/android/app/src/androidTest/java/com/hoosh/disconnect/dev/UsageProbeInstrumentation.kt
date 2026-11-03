package com.hoosh.disconnect.dev

import android.app.Activity
import android.app.Instrumentation
import android.os.Bundle
import expo.modules.hooshusage.UsageReader
import org.json.JSONObject

/** Installed only in the development test APK. Does not export package identities/events. */
class UsageProbeInstrumentation : Instrumentation() {
  override fun onCreate(arguments: Bundle?) {
    super.onCreate(arguments)
    start()
  }
  override fun onStart() {
    val result = Bundle()
    try {
      result.putString("probe", JSONObject(UsageReader(targetContext).probe(1)).toString())
      finish(Activity.RESULT_OK, result)
    } catch (_: Exception) {
      result.putString("probe", "unavailable")
      finish(Activity.RESULT_CANCELED, result)
    }
  }
}
