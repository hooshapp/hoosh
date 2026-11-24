package expo.modules.hooshusage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.Promise

class HooshUsageModule : Module() {
  private var intervention: InterventionCoordinator? = null
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
      val value = selectionEditor ?: NativeSelectionEditor(context.applicationContext)?.also { selectionEditor = it }
      if (value != null) return value
    }
    promise.reject("ERR_SELECTION_UNAVAILABLE", "App selection is unavailable.", null)
    return null
  }
  override fun definition() = ModuleDefinition {
    Name("HooshUsage")
    AsyncFunction("setNudgeTone") { owner: String, tone: String -> NudgeToneStore(requireNotNull(appContext.reactContext)).set(owner, tone); mapOf("saved" to true) }
    AsyncFunction("budgetCapabilities") { mapOf("policy" to "selected_apps_shared_v1", "scope" to "all_selected_apps") }
    AsyncFunction("onboardingBaselineRead") { owner: String -> OnboardingBaseline(requireNotNull(appContext.reactContext)).read(owner) }
    AsyncFunction("probe") { minutes: Int -> reader().probe(minutes) }
    AsyncFunction("getAuthorization") { reader().authorization() }
    AsyncFunction("getCapabilities") { reader().capabilities() }
    AsyncFunction("getStatus") { reader().status() }
    AsyncFunction("openUsageAccess") { reader().openUsageAccess() }.runOnQueue(Queues.MAIN)
    run {
      fun interventions(p: Promise): InterventionCoordinator? {
        val value = if (previewDisposed) null else intervention ?: appContext.reactContext?.let { NativeInterventionBridge(InterventionRuntime.get(it)) }?.also { intervention = it }
        if (value == null) p.reject("ERR_INTERVENTION_UNAVAILABLE", "Android interventions are unavailable.", null)
        return value
      }
      AsyncFunction("interventionOpen") { owner: String, p: Promise -> interventions(p)?.open(owner, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionRelease") { owner: String, token: String, p: Promise -> interventions(p)?.release(owner, token, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionProtectionRead") { owner: String, p: Promise -> interventions(p)?.protectionRead(owner, p) }.runOnQueue(Queues.MAIN)
      if (SelectionPreviewFactory.enabled) {
      AsyncFunction("interventionInterruptFeedback") {
        requireNotNull(appContext.reactContext).getSystemService(android.view.accessibility.AccessibilityManager::class.java).interrupt()
        true
      }.runOnQueue(Queues.MAIN)
      // Explicit test-host action: remove this Activity's task, never force-stop the application/service.
      AsyncFunction("interventionRemoveHostTask") { p: Promise ->
        val activity = appContext.currentActivity
        if (activity == null || activity.isFinishing || activity.isDestroyed || !activity.hasWindowFocus()) p.reject("ERR_INTERVENTION_UNAVAILABLE", "No foreground test host.", null)
        else { p.resolve(true); activity.finishAndRemoveTask() }
      }.runOnQueue(Queues.MAIN)
      }
      AsyncFunction("interventionStatus") { owner: String, p: Promise -> interventions(p)?.status(owner, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionReviewAccess") { p: Promise ->
        val activity = appContext.currentActivity
        if (activity == null) p.reject("ERR_INTERVENTION_UNAVAILABLE", "No foreground setup.", null)
        else interventions(p)?.reviewAccess(activity, p)
      }.runOnQueue(Queues.MAIN)
      if (SelectionPreviewFactory.enabled) {
      AsyncFunction("interventionInstall") { owner: String, token: String, expected: Int, revision: Int, selection: Int, windows: List<Map<String, Any>>, policy: Map<String, Any>, p: Promise -> interventions(p)?.install(owner, token, expected, revision, selection, windows, policy, p) }.runOnQueue(Queues.MAIN)
      }
      AsyncFunction("scheduleRead") { owner: String, p: Promise -> interventions(p)?.scheduleRead(owner, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("schedulePreview") { spec: Map<String, Any>, p: Promise -> interventions(p)?.schedulePreview(spec, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("scheduleApply") { owner: String, token: String, expected: Int, revision: Int, selection: Int, spec: Map<String, Any>, p: Promise -> interventions(p)?.scheduleApply(owner, token, expected, revision, selection, spec, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("questRead") { owner: String, questId: String, p: Promise -> interventions(p)?.questRead(owner, questId, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("historyStop") { owner: String, token: String, p: Promise -> interventions(p)?.historyStop(owner, token, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("historyRead") { owner: String, p: Promise -> interventions(p)?.historyRead(owner, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("historyStart") { owner: String, token: String, p: Promise ->
        val activity = appContext.currentActivity
        if (activity == null) p.reject("ERR_HISTORY_UNAVAILABLE", "No foreground History setup.", null)
        else interventions(p)?.historyStart(activity, owner, token, p)
      }.runOnQueue(Queues.MAIN)
      AsyncFunction("rewardsRead") { owner: String, p: Promise -> interventions(p)?.rewardsRead(owner, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("rewardsAck") { owner: String, token: String, installation: String, sequence: Long, p: Promise -> interventions(p)?.rewardsAck(owner, token, installation, sequence, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("questApply") { owner: String, token: String, expected: Int, json: String, p: Promise ->
        try { interventions(p)?.questApply(owner, token, expected, QuestBridgePayload.decode(json), p) }
        catch (_: Exception) { p.reject("ERR_INTERVENTION_INVALID", "Quest metadata is invalid.", null) }
      }.runOnQueue(Queues.MAIN)
      AsyncFunction("questCancel") { owner: String, token: String, expected: Int, questId: String, reason: String, p: Promise -> interventions(p)?.questCancel(owner, token, expected, questId, reason, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionClaimOwner") { owner: String, token: String, stopPrevious: Boolean, p: Promise -> interventions(p)?.claimOwner(owner, token, stopPrevious, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("selectionRead") { owner: String, p: Promise -> interventions(p)?.selectionRead(owner, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionCancel") { owner: String, token: String, expected: Int, reason: String?, p: Promise -> interventions(p)?.cancel(owner, token, expected, reason, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionDrain") { owner: String, token: String, limit: Int, p: Promise -> interventions(p)?.drain(owner, token, limit, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionAcknowledge") { owner: String, token: String, ids: List<String>, p: Promise -> interventions(p)?.acknowledge(owner, token, ids, p) }.runOnQueue(Queues.MAIN)
      AsyncFunction("interventionEndOwner") { owner: String, erase: Boolean, p: Promise -> interventions(p)?.endOwner(owner, erase, p) }.runOnQueue(Queues.MAIN)

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
      }
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
      AsyncFunction("selectionEndOwner") { owner: String, erase: Boolean, promise: Promise ->
        editorOrReject(promise)?.endOwner(owner, erase, promise)
      }.runOnQueue(Queues.MAIN)
      OnActivityEntersBackground { intervention?.cancelReview(); preview?.cancelPending(); selectionEditor?.cancelPicker() }
      OnActivityDestroys { intervention?.cancelReview(); preview?.clear(); selectionEditor?.clearDrafts() }
      OnDestroy { previewDisposed = true; intervention?.close(); intervention = null; preview?.dispose(); preview = null; selectionEditor?.dispose(); selectionEditor = null }
    }
  }
}
