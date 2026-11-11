package expo.modules.hooshusage

import android.app.Activity
import expo.modules.kotlin.Promise

/** One React module lifetime; closing it drops its handles, never installed native policy/events. */
class NativeInterventionBridge(private val runtime: InterventionRuntime) : InterventionCoordinator {
  private val bridge = runtime.leases.bridge()
  override fun open(owner: String, promise: Promise) = runtime.open(bridge, owner, promise)
  override fun release(owner: String, token: String, promise: Promise) { runtime.leases.release(owner, token); promise.resolve() }
  override fun cancelReview() = runtime.cancelReview(bridge)
  override fun close() { runtime.leases.close(bridge); runtime.cancelReview(bridge) }
  override fun protectionRead(owner: String, promise: Promise) = runtime.protectionRead(owner, promise)
  override fun status(owner: String, promise: Promise) = runtime.status(owner, promise)
  override fun reviewAccess(activity: Activity, promise: Promise) = runtime.reviewAccess(bridge, activity, promise)
  override fun install(owner: String, token: String, expected: Int, revision: Int, selectionRevision: Int, windows: List<Map<String, Any>>, policy: Map<String, Any>, promise: Promise) = runtime.install(owner, token, expected, revision, selectionRevision, windows, policy, promise)
  override fun cancel(owner: String, token: String, expected: Int, reason: String?, promise: Promise) = runtime.cancel(owner, token, expected, reason, promise)
  override fun drain(owner: String, token: String, limit: Int, promise: Promise) = runtime.drain(owner, token, limit, promise)
  override fun acknowledge(owner: String, token: String, ids: List<String>, promise: Promise) = runtime.acknowledge(owner, token, ids, promise)
  override fun endOwner(owner: String, erase: Boolean, promise: Promise) = runtime.endOwner(owner, erase, promise)
}
