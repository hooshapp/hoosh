package expo.modules.hooshusage

import android.app.Activity
import android.app.Dialog
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Handler
import android.text.Editable
import android.text.TextWatcher
import android.util.LruCache
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.WindowInsets
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.ListView
import android.widget.ScrollView
import android.widget.BaseAdapter
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.atomic.AtomicBoolean

/** Native labels/icons stay in this debug window; only count/revision leave its controller. */
internal class SelectionPreviewDialog(
  private val activity: Activity,
  private val rows: List<LauncherAppCatalog.Row>,
  previous: Set<String>,
  private val worker: ExecutorService,
  private val main: Handler,
  private val cancelled: AtomicBoolean,
  private val onCancel: () -> Unit,
  private val onConfirm: (Set<String>) -> Unit,
  private val editingSavedDraft: Boolean = false,
) {
  private val available = rows.map { it.key }.toSet()
  private val draft = previous.intersect(available).toMutableSet()
  private val missing = previous.size - draft.size
  private val status = TextView(activity)
  private val search = EditText(activity)
  private val cache = LruCache<String, Drawable>(16)
  private val failedIcons = mutableSetOf<String>()
  private var filtered = rows
  private var busy = false
  private val adapter = RowsAdapter()
  private val dialog: Dialog
  private val confirm = Button(activity)
  private val clear = Button(activity)

  init {
    val header = LinearLayout(activity).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(24), dp(16), dp(24), dp(4))
    }
    header.addView(TextView(activity).apply {
      text = if (editingSavedDraft) "Choose distracting apps" else "Choose apps temporarily"
      textSize = 22f
      if (Build.VERSION.SDK_INT >= 28) isAccessibilityHeading = true
    })
    header.addView(TextView(activity).apply {
      text = if (missing > 0)
        "$missing previously chosen apps are unavailable. Confirm to remove them."
      else if (editingSavedDraft) "Names stay on this phone. Use these choices to edit your draft, then Save in the editor."
      else "Names stay on this phone. Nothing is saved or blocked."
    })
    search.hint = "Search apps on this profile"
    search.setSingleLine(true)
    search.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
    if (Build.VERSION.SDK_INT >= 26) search.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO
    header.addView(search, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
    status.accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE
    search.addTextChangedListener(object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
        val query = s?.toString().orEmpty().trim().lowercase(Locale.getDefault())
        filtered = rows.filter { it.label.lowercase(Locale.getDefault()).contains(query) }
        adapter.notifyDataSetChanged()
        updateStatus()
      }
      override fun afterTextChanged(s: Editable?) = Unit
    })
    // A full-height app-owned window avoids platform AlertDialog button clipping
    // at enlarged font sizes. Weighted regions remain scrollable above the IME.
    val content = LinearLayout(activity).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(12), dp(8), dp(12), dp(8))
      setBackgroundColor(android.graphics.Color.WHITE)
      if (Build.VERSION.SDK_INT >= 30) {
        setOnApplyWindowInsetsListener { view, insets ->
          val safe = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout() or WindowInsets.Type.ime())
          view.setPadding(dp(12) + safe.left, dp(8) + safe.top, dp(12) + safe.right, dp(8) + safe.bottom)
          insets
        }
      } else fitsSystemWindows = true
    }
    content.addView(ScrollView(activity).apply { addView(header); isFillViewport = false },
      LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
    status.setPadding(dp(12), dp(4), dp(12), dp(4))
    content.addView(status)
    content.addView(ListView(activity).apply { adapter = this@SelectionPreviewDialog.adapter },
      LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 3f))
    confirm.text = if (editingSavedDraft) "Use these choices" else "Use temporarily"
    confirm.setOnClickListener { if (!busy) onConfirm(draft.toSet()) }
    clear.text = "Clear checks"
    clear.setOnClickListener { if (!busy) { draft.clear(); adapter.notifyDataSetChanged(); updateStatus() } }
    val cancel = Button(activity).apply {
      text = "Cancel"
      setOnClickListener { onCancel() }
    }
    listOf(confirm, clear, cancel).forEach {
      content.addView(it, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
    }
    dialog = Dialog(activity, android.R.style.Theme_DeviceDefault_Light_NoActionBar).apply {
      setTitle(if (editingSavedDraft) "Choose distracting apps" else "Choose apps temporarily")
      setContentView(content)
      if (Build.VERSION.SDK_INT >= 28) content.accessibilityPaneTitle = titleForAccessibility()
      setOwnerActivity(activity)
      setCanceledOnTouchOutside(false)
      setOnCancelListener { onCancel() }
      setOnDismissListener { cache.evictAll(); failedIcons.clear(); onCancel() }
      setOnShowListener {
        window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        window?.clearFlags(WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM)
        window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        cancel.requestFocus()
      }
    }
    updateStatus()
  }

  private fun titleForAccessibility() = if (editingSavedDraft) "Choose distracting apps" else "Choose apps temporarily"
  fun show() = dialog.show()
  fun hasFocus() = dialog.window?.decorView?.hasWindowFocus() == true
  fun setBusy() {
    busy = true
    search.isEnabled = false
    confirm.isEnabled = false
    clear.isEnabled = false
    status.text = "Checking availability…"
    adapter.notifyDataSetChanged()
  }
  fun dismiss() {
    val ime = activity.getSystemService(InputMethodManager::class.java)
    ime?.hideSoftInputFromWindow(search.windowToken, 0)
    dialog.dismiss()
    cache.evictAll()
  }
  private fun dp(value: Int) = (value * activity.resources.displayMetrics.density).toInt()
  private fun updateStatus() { status.text = "${draft.size} selected · ${filtered.size} matches · " + if (editingSavedDraft) "draft only" else "temporary only" }

  private inner class RowsAdapter : BaseAdapter() {
    override fun getCount() = filtered.size
    override fun getItem(position: Int) = filtered[position]
    override fun getItemId(position: Int) = position.toLong()
    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
      val row = getItem(position)
      val container = (convertView as? LinearLayout) ?: LinearLayout(activity).apply {
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        orientation = LinearLayout.HORIZONTAL
        gravity = android.view.Gravity.CENTER_VERTICAL
        setPadding(dp(16), dp(4), dp(16), dp(4))
        minimumHeight = dp(48)
        addView(ImageView(activity).apply { importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO }, LinearLayout.LayoutParams(dp(32), dp(32)))
        addView(CheckBox(activity), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
      }
      val image = container.getChildAt(0) as ImageView
      val checkbox = container.getChildAt(1) as CheckBox
      checkbox.setOnCheckedChangeListener(null)
      checkbox.text = row.label
      checkbox.isChecked = row.key in draft
      checkbox.isEnabled = !busy
      checkbox.setOnCheckedChangeListener { _, checked ->
        if (!busy) { if (checked) draft.add(row.key) else draft.remove(row.key); updateStatus() }
      }
      container.setOnClickListener { if (!busy) checkbox.performClick() }
      container.isFocusable = false
      image.tag = row.key
      image.setImageResource(android.R.drawable.sym_def_app_icon)
      val cached = cache.get(row.key)
      if (cached != null) image.setImageDrawable(cached.constantState?.newDrawable() ?: cached)
      else if (row.key !in failedIcons && !cancelled.get()) {
        worker.execute {
          if (cancelled.get()) return@execute
          val loaded = try { row.resolution.loadIcon(activity.packageManager) } catch (_: Exception) { null }
          main.post {
            if (cancelled.get()) return@post
            if (loaded == null) failedIcons.add(row.key) else cache.put(row.key, loaded)
            if (image.tag == row.key && loaded != null) image.setImageDrawable(loaded)
          }
        }
      }
      return container
    }
  }
}
