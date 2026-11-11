package expo.modules.hooshusage

import android.app.Activity
import expo.modules.kotlin.Promise

/** Explicit QA coordinator; production ProtectionService is not implicitly expanded. */
interface InterventionCoordinator {
  fun open(owner: String, promise: Promise)
  fun release(owner: String, token: String, promise: Promise)
  fun cancelReview()
  fun close()
  fun protectionRead(owner: String, promise: Promise)
  fun status(owner: String, promise: Promise)
  fun reviewAccess(activity: Activity, promise: Promise)
  fun install(owner: String, token: String, expected: Int, revision: Int, selectionRevision: Int, windows: List<Map<String, Any>>, policy: Map<String, Any>, promise: Promise)
  fun scheduleRead(owner: String, promise: Promise)
  fun schedulePreview(spec: Map<String, Any>, promise: Promise)
  fun scheduleApply(owner: String, token: String, expected: Int, revision: Int, selectionRevision: Int, spec: Map<String, Any>, promise: Promise)
  fun cancel(owner: String, token: String, expected: Int, reason: String?, promise: Promise)
  fun drain(owner: String, token: String, limit: Int, promise: Promise)
  fun acknowledge(owner: String, token: String, ids: List<String>, promise: Promise)
  fun endOwner(owner: String, erase: Boolean, promise: Promise)
}
