package expo.modules.hooshusage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.Promise

class HooshUsageModule : Module() {
  private var preview: SelectionPreview? = null
  private var selectionEditor: SelectionEditor? = null
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
  private fun editorOrReject(promise: Promise): SelectionEditor? {
    val context = appContext.reactContext
    if (!previewDisposed && context != null) {
      val value = selectionEditor ?: SelectionPreviewFactory.createEditor(context)?.also { selectionEditor = it }
      if (value != null) return value
    }
    promise.reject("ERR_SELECTION_UNAVAILABLE", "App selection is unavailable.", null)
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
      AsyncFunction("selectionBegin") { owner: String, promise: Promise ->
        editorOrReject(promise)?.begin(owner, promise)
      }.runOnQueue(Queues.MAIN)
      AsyncFunction("selectionPick") { owner: String, draft: String, version: Int, promise: Promise ->
        val editor = editorOrReject(promise)
        val activity = appContext.currentActivity
        if (editor != null) {
          if (activity == null) promise.reject("ERR_SELECTION_UNAVAILABLE", "No foreground activity.", null)
          else editor.pick(activity, owner, draft, version, promise)
        }
      }.runOnQueue(Queues.MAIN)
      AsyncFunction("selectionCommit") { owner: String, draft: String, version: Int, promise: Promise ->
        editorOrReject(promise)?.commit(owner, draft, version, promise)
      }.runOnQueue(Queues.MAIN)
      AsyncFunction("selectionRelease") { owner: String, draft: String, promise: Promise ->
        editorOrReject(promise)?.release(owner, draft, promise)
      }.runOnQueue(Queues.MAIN)
      OnActivityEntersBackground { preview?.cancelPending(); selectionEditor?.cancelPicker() }
      OnActivityDestroys { preview?.clear(); selectionEditor?.clearDrafts() }
      OnDestroy { previewDisposed = true; preview?.dispose(); preview = null; selectionEditor?.dispose(); selectionEditor = null }
    }
  }
}
