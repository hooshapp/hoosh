package com.hoosh.disconnect.dev

import android.app.Activity
import android.app.Instrumentation
import android.os.Bundle
import expo.modules.hooshusage.UsageReader
import org.json.JSONObject

/** Installed only in the development test APK. Does not export package identities/events. */
class UsageProbeInstrumentation : Instrumentation() {
  private var emptyWindow = false
  private var selection = false
  private var previewChecks = false
  override fun onCreate(arguments: Bundle?) {
    super.onCreate(arguments)
    emptyWindow = arguments?.getString("emptyWindow") == "true"
    selection = arguments?.getString("probe") == "selection"
    previewChecks = arguments?.getString("probe") == "selectionPreviewChecks"
    start()
  }
  override fun onStart() {
    val result = Bundle()
    try {
      if (previewChecks) {
        result.putInt("previewChecksPassed", SelectionPreviewChecks.run())
        finish(Activity.RESULT_OK, result)
        return
      }
      if (selection) {
        result.putInt("selfChecksPassed", SelectionDiscoveryProbeChecks.run(targetContext))
        val summary = SelectionDiscoveryProbe(targetContext).read()
        result.putString("selectionProbe", JSONObject(summary).toString())
        finish(if (summary["state"] == "error") Activity.RESULT_CANCELED else Activity.RESULT_OK, result)
        return
      }
      val reader = UsageReader(targetContext)
      result.putString("probe", JSONObject(reader.probe(1, emptyWindow)).toString())
      result.putString("capabilities", JSONObject(reader.capabilities()).toString())
      result.putString("status", JSONObject(reader.status()).toString())
      finish(Activity.RESULT_OK, result)
    } catch (_: Exception) {
      // Test assertions may fail; never print exceptions containing package/resource data.
      if (previewChecks) {
        result.putString("previewChecks", "failed")
      } else if (selection) {
        result.putString("selectionProbe", JSONObject(mapOf(
          "state" to "error", "failureCode" to "self_check_failed",
        )).toString())
      } else result.putString("probe", "unavailable")
      finish(Activity.RESULT_CANCELED, result)
    }
  }
}
