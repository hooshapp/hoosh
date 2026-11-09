package expo.modules.hooshusage

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/** Debug implementation only. All session/dialog state is confined to the main thread. */
internal class NativeSelectionPreview(context: Context) : SelectionPreview {
  private class Request(val activity: Activity, val owner: String, val promise: Promise) {
    val cancelled = AtomicBoolean(false)
    var dialog: SelectionPreviewDialog? = null
    var confirming = false
  }
  private val main = Handler(Looper.getMainLooper())
  private val worker = Executors.newSingleThreadExecutor()
  private val catalog = LauncherAppCatalog(context)
  private val selection = VolatileSelection()
  private var pending: Request? = null
  private var disposed = false

  override fun open(activity: Activity, owner: String, promise: Promise) {
    if (disposed) return reject(promise, "ERR_SELECTION_PREVIEW_UNAVAILABLE")
    if (pending != null) return reject(promise, "ERR_SELECTION_BUSY")
    if (!owner.matches(Regex("[A-Za-z0-9_-]{1,80}"))) return reject(promise, "ERR_SELECTION_OWNER_INVALID")
    if (activity.isFinishing || activity.isDestroyed || !activity.hasWindowFocus()) {
      return reject(promise, "ERR_SELECTION_ACTIVITY_UNAVAILABLE")
    }
    val previous = selection.begin(owner)
    val request = Request(activity, owner, promise)
    pending = request
    worker.execute {
      try {
        val rows = catalog.load { request.cancelled.get() }
        main.post {
          if (!current(request)) return@post
          if (activity.isFinishing || activity.isDestroyed || !activity.hasWindowFocus()) {
            finish(request, "ERR_SELECTION_CANCELLED")
            return@post
          }
          try {
            request.dialog = SelectionPreviewDialog(
              activity, rows, previous, worker, main, request.cancelled,
              onCancel = { finish(request, "ERR_SELECTION_CANCELLED") },
              onConfirm = { draft -> confirm(request, draft) },
            ).also { it.show() }
          } catch (_: Exception) { finish(request, "ERR_SELECTION_PREVIEW_UNAVAILABLE") }
        }
      } catch (_: Exception) {
        main.post { if (current(request)) finish(request, "ERR_SELECTION_PREVIEW_UNAVAILABLE") }
      }
    }
  }

  private fun confirm(request: Request, draft: Set<String>) {
    if (!current(request) || request.confirming) return
    request.confirming = true
    request.dialog?.setBusy()
    worker.execute {
      try {
        val eligible = catalog.eligibleKeys()
        main.post {
          if (!current(request)) return@post
          if (request.activity.isDestroyed || request.activity.isFinishing ||
            request.dialog?.hasFocus() != true) {
            finish(request, "ERR_SELECTION_CANCELLED")
          } else if (!eligible.containsAll(draft)) {
            finish(request, "ERR_SELECTION_CHANGED")
          } else {
            val summary = selection.confirm(request.owner, draft)
            finish(request, summary = summary)
          }
        }
      } catch (_: Exception) {
        main.post { if (current(request)) finish(request, "ERR_SELECTION_PREVIEW_UNAVAILABLE") }
      }
    }
  }

  private fun current(request: Request) = pending === request && !request.cancelled.get()
  private fun finish(request: Request, error: String? = null, summary: Map<String, Int>? = null) {
    if (!current(request)) return
    pending = null
    request.cancelled.set(true)
    try { request.dialog?.dismiss() } catch (_: Exception) { /* Window may already be detached. */ }
    if (error != null) reject(request.promise, error) else request.promise.resolve(summary)
  }
  private fun reject(promise: Promise, code: String) {
    promise.reject(code, "Temporary app selection did not complete.", null)
  }
  override fun summary(owner: String) = selection.summary(owner)
  override fun release(owner: String) {
    pending?.takeIf { it.owner == owner }?.let { finish(it, "ERR_SELECTION_CANCELLED") }
    selection.release(owner)
  }
  override fun cancelPending() {
    pending?.let { finish(it, "ERR_SELECTION_CANCELLED") }
  }
  override fun clear() { cancelPending(); selection.clear() }
  override fun dispose() {
    if (Looper.myLooper() != Looper.getMainLooper()) { main.post { dispose() }; return }
    if (disposed) return
    disposed = true
    clear()
    worker.shutdownNow()
  }
}
