package com.hoosh.disconnect.dev

import android.app.Activity
import android.app.Instrumentation
import android.os.Bundle
import expo.modules.hooshusage.UsageReader
import org.json.JSONObject

/** Installed only in the development test APK. Does not export package identities/events. */
class UsageProbeInstrumentation : Instrumentation() {
  private var emptyWindow = false
  override fun onCreate(arguments: Bundle?) {
    super.onCreate(arguments)
    emptyWindow = arguments?.getString("emptyWindow") == "true"
    start()
  }
  override fun onStart() {
    val result = Bundle()
    try {
      val reader = UsageReader(targetContext)
      result.putString("probe", JSONObject(reader.probe(1, emptyWindow)).toString())
      result.putString("capabilities", JSONObject(reader.capabilities()).toString())
      result.putString("status", JSONObject(reader.status()).toString())
      finish(Activity.RESULT_OK, result)
    } catch (_: Exception) {
      result.putString("probe", "unavailable")
      finish(Activity.RESULT_CANCELED, result)
    }
  }
}
