package expo.modules.hooshusage

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/** Debug producer: persisted owner/global group, ephemeral editor draft, no rules/Auth integration. */
internal class NativeSelectionEditor(context: Context) : SelectionEditor {
  private class Request(val promise: Promise, val picker: Boolean = false) {
    val cancelled = AtomicBoolean(false)
    var dialog: SelectionPreviewDialog? = null
    var confirming = false
    var owner: String? = null
    var draft: String? = null
  }
  private val main = Handler(Looper.getMainLooper())
  private val worker = Executors.newSingleThreadExecutor()
  private val catalog = LauncherAppCatalog(context)
  private val drafts = SelectionDrafts(AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1")))
  private var pending: Request? = null
  private var disposed = false
  private fun reject(promise: Promise, code: String) = promise.reject(code, "App selection could not complete.", null)
  private fun code(error: Exception) = (error as? SelectionFailure)?.code ?: "ERR_SELECTION_STORAGE"
  private fun current(request: Request) = pending === request && !request.cancelled.get()
  private fun start(promise: Promise, picker: Boolean = false): Request? {
    if (disposed) { reject(promise, "ERR_SELECTION_UNAVAILABLE"); return null }
    if (pending != null) { reject(promise, "ERR_SELECTION_BUSY"); return null }
    return Request(promise, picker).also { pending = it }
  }
  private fun finish(request: Request, value: Any? = null, error: String? = null) {
    if (!current(request)) return
    pending = null
    request.cancelled.set(true)
    try { request.dialog?.dismiss() } catch (_: Exception) { }
    if (error == null) request.promise.resolve(value) else reject(request.promise, error)
  }
  private fun operation(promise: Promise, action: () -> Any?) {
    val request = start(promise) ?: return
    worker.execute {
      if (request.cancelled.get()) return@execute
      try {
        val value = action()
        main.post { finish(request, value) }
      } catch (error: Exception) { main.post { finish(request, error = code(error)) } }
    }
  }
  private fun eligible(): Set<String> = try { catalog.eligibleKeys() }
    catch (_: Exception) { throw SelectionFailure("ERR_SELECTION_UNAVAILABLE") }
  override fun begin(owner: String, promise: Promise) = operation(promise) { drafts.begin(owner) }
  override fun commit(owner: String, draft: String, version: Int, promise: Promise) = operation(promise) {
    // Empty selection is valid, but even empty Save requires unlocked/current profile.
    val eligible = eligible()
    drafts.commit(owner, draft, version, eligible)
  }
  override fun release(owner: String, draft: String, promise: Promise) {
    if (disposed) { reject(promise, "ERR_SELECTION_UNAVAILABLE"); return }
    // Release is not blocked behind the UI single-flight guard. FIFO orders it after an issued Save.
    pending?.takeIf { it.picker && it.owner == owner && it.draft == draft }?.let { finish(it, error = "ERR_SELECTION_CANCELLED") }
    worker.execute {
      try { drafts.release(owner, draft); main.post { promise.resolve() } }
      catch (error: Exception) { main.post { reject(promise, code(error)) } }
    }
  }
  override fun pick(activity: Activity, owner: String, draft: String, version: Int, promise: Promise) {
    if (activity.isFinishing || activity.isDestroyed || !activity.hasWindowFocus()) {
      reject(promise, "ERR_SELECTION_UNAVAILABLE"); return
    }
    val request = start(promise, picker = true) ?: return
    request.owner = owner; request.draft = draft
    worker.execute {
      try {
        val previous = drafts.selected(owner, draft, version)
        val rows = catalog.load { request.cancelled.get() }
        main.post {
          if (!current(request)) return@post
          if (activity.isFinishing || activity.isDestroyed || !activity.hasWindowFocus()) {
            finish(request, error = "ERR_SELECTION_CANCELLED"); return@post
          }
          try {
            request.dialog = SelectionPreviewDialog(activity, rows, previous, worker, main, request.cancelled,
              onCancel = { finish(request, error = "ERR_SELECTION_CANCELLED") },
              onConfirm = { selected -> confirm(request, activity, owner, draft, version, selected) }, editingSavedDraft = true,
            ).also { it.show() }
          } catch (error: Exception) { finish(request, error = code(error)) }
        }
      } catch (error: Exception) { main.post { finish(request, error = code(error)) } }
    }
  }
  private fun confirm(request: Request, activity: Activity, owner: String, draft: String, version: Int, selected: Set<String>) {
    if (!current(request) || request.confirming) return
    request.confirming = true
    request.dialog?.setBusy()
    worker.execute {
      try {
        val eligible = eligible()
        main.post {
          if (!current(request)) return@post
          if (!eligible.containsAll(selected)) finish(request, error = "ERR_SELECTION_CHANGED")
          else if (request.dialog?.hasFocus() != true || activity.isDestroyed || activity.isFinishing)
            finish(request, error = "ERR_SELECTION_CANCELLED")
          else try { finish(request, drafts.stage(owner, draft, version, selected)) }
            catch (error: Exception) { finish(request, error = code(error)) }
        }
      } catch (error: Exception) { main.post { finish(request, error = code(error)) } }
    }
  }
  override fun cancelPicker() { pending?.takeIf { it.picker }?.let { finish(it, error = "ERR_SELECTION_CANCELLED") } }
  override fun clearDrafts() {
    pending?.let { finish(it, error = "ERR_SELECTION_DRAFT_EXPIRED") }
    if (!disposed) worker.execute { drafts.clear() }
  }
  override fun dispose() {
    if (disposed) return
    clearDrafts()
    disposed = true
    worker.shutdown() // Drain already-issued Save/cleanup; never interrupt an atomic write.
  }
}
