package expo.modules.hooshusage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.Promise

class HooshUsageModule : Module() {
  private var preview: SelectionPreview? = null
  @Volatile private var previewDisposed = false
  private fun reader() = UsageReader(requireNotNull(appContext.reactContext) { "Context unavailable" })
  private fun previewOrReject(promise: Promise): SelectionPreview? {
    val context = appContext.reactContext
    if (!previewDisposed && context != null) {
      val value = preview ?: SelectionPreviewFactory.create(context)?.also { preview = it }
      if (value != null) return value
    }
    promise.reject("ERR_SELECTION_PREVIEW_UNAVAILABLE", "Temporary app selection is unavailable.", null)
    return null
  }
  override fun definition() = ModuleDefinition {
    Name("HooshUsage")
    AsyncFunction("probe") { minutes: Int -> reader().probe(minutes) }
    AsyncFunction("getAuthorization") { reader().authorization() }
    AsyncFunction("getCapabilities") { reader().capabilities() }
    AsyncFunction("getStatus") { reader().status() }
    AsyncFunction("openUsageAccess") { reader().openUsageAccess() }.runOnQueue(Queues.MAIN)
    if (SelectionPreviewFactory.enabled) {
      // Private QA API; the production ProtectionService still rejects selection.
      AsyncFunction("previewPickApps") { owner: String, promise: Promise ->
        val current = previewOrReject(promise)
        if (current != null) {
          val activity = appContext.currentActivity
          if (activity == null) promise.reject("ERR_SELECTION_ACTIVITY_UNAVAILABLE", "No foreground activity.", null)
          else current.open(activity, owner, promise)
        }
      }.runOnQueue(Queues.MAIN)
      AsyncFunction("previewGetSelection") { owner: String, promise: Promise ->
        previewOrReject(promise)?.let { promise.resolve(it.summary(owner)) }
      }.runOnQueue(Queues.MAIN)
      AsyncFunction("previewRelease") { owner: String, promise: Promise ->
        previewOrReject(promise)?.let { it.release(owner); promise.resolve() }
      }.runOnQueue(Queues.MAIN)
      OnActivityEntersBackground { preview?.cancelPending() }
      OnActivityDestroys { preview?.clear() }
      OnDestroy { previewDisposed = true; preview?.dispose(); preview = null }
    }
  }
}
