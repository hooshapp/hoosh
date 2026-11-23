package expo.modules.hooshusage

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/** Only window package metadata; never requests nodes, contents, gestures or text. Native schedule evaluation in every build. */
class InterventionAccessibilityService : AccessibilityService() {
  private lateinit var runtime: InterventionRuntime
  private val main = Handler(Looper.getMainLooper())
  private var foreground: String? = null
  private var generation = 0L
  private var reading = false
  private var readPending = false
  @Volatile private var overlay: View? = null
  private var overlayKey: String? = null
  val visible get() = overlay != null
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) { foreground = null; generation++; hide() }
  }
  private val pulse = object : Runnable {
    override fun run() { reconcile(); main.postDelayed(this, 1000) }
  }
  override fun onServiceConnected() {
    runtime = InterventionRuntime.get(this); runtime.service = this
    val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
    if (Build.VERSION.SDK_INT >= 33) registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED) else registerReceiver(receiver, filter)
    // A service reconnect/process restart cannot prove the intervening coverage.
    runtime.execute { try { runtime.engine.interruptCoverage() } catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_STORAGE" } }
    main.post(pulse)
  }
  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || !::runtime.isInitialized) return
    val app = event.packageName?.toString() ?: return
    if (app == packageName) {
      // Our own overlay emits window events; the host activity itself should dismiss the pause.
      if (event.className?.toString()?.endsWith("MainActivity") != true) return
    }
    if (app != foreground) { generation++; hide(); foreground = app }
    reconcile()
  }
  fun reconcile() {
    if (!::runtime.isInitialized) return
    if (runtime.failure != null || !runtime.authorized()) { foreground = null; generation++; hide(); return }
    val app = if (runtime.unlocked()) foreground else null
    if (reading) { readPending = true; return }
    reading = true
    val token = generation
    val epoch = runtime.epoch.get()
    runtime.execute {
      try {
        val record = runtime.engine.checkpoint(System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot())
        val needed = if (app == null) emptyList() else record?.let { runtime.engine.needed(it, app, System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot()) }.orEmpty()
        val nudge = if (app == null) null else record?.let { runtime.engine.nudge(it, app, System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot()) }
        main.post {
          finishRead()
          if (token != generation || epoch != runtime.epoch.get() || foreground != app || runtime.service !== this || !runtime.unlocked()) return@post
          if (app == null || record == null || (needed.isEmpty() && nudge == null)) hide() else show(record, app, needed, nudge)
        }
        if (record != null) runtime.history.capture(record.plan.owner, System.currentTimeMillis())
      } catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_STORAGE"; main.post { finishRead(); if (token == generation) hide() } }
    }
  }
  private fun finishRead() {
    reading = false
    if (readPending) { readPending = false; main.post { reconcile() } }
  }
  private fun hide() {
    val old = overlay; overlay = null; overlayKey = null
    if (old != null) try { getSystemService(WindowManager::class.java).removeView(old) } catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_OVERLAY"; disableSelf() }
  }
  private fun show(record: InterventionRecord, app: String, reasons: List<InterventionWindow>, nudge: AppSession?) {
    val mid = reasons.isEmpty() && nudge != null
    val key = "${record.plan.owner}:${record.plan.revision}:$app:${if (mid) nudge?.id else reasons.joinToString { it.reasonId }}"
    if (key == overlayKey) return
    hide()
    val body = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL; val pad = (24 * resources.displayMetrics.density).toInt(); setPadding(pad, pad, pad, pad); setBackgroundColor(0xfffff2dd.toInt())
      if (Build.VERSION.SDK_INT >= 30) setOnApplyWindowInsetsListener { view, insets ->
        val safe = insets.getInsets(android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.displayCutout())
        view.setPadding(pad + safe.left, pad + safe.top, pad + safe.right, pad + safe.bottom); insets
      } else fitsSystemWindows = true
      if (Build.VERSION.SDK_INT >= 28) accessibilityPaneTitle = "Hoosh pause"
    }
    fun text(value: String, size: Float, heading: Boolean = false) { body.addView(TextView(this).apply { text = value; textSize = size; if (Build.VERSION.SDK_INT >= 28) isAccessibilityHeading = heading; setTextColor(0xff222222.toInt()); setPadding(0, 16, 0, 24) }) }
    text("Hoosh", 20f)
    text(if (mid) "Ready to return?" else "Take a moment", 32f, heading = true)
    text(if (mid) "You are halfway through this allowance. Return home to finish this session, or keep going until your time ends. The choice is yours."
      else "You chose a pause for this app. ${reasons.size} schedule reason(s) apply. You can return home or open the app anyway. Finishing an activity is your choice; this pause does not confirm quest completion.", 18f)
    val session = record.sessions.find { it.app == app }
    val context = if (mid) "mid_session" else if (session != null && session.wallEnd <= System.currentTimeMillis()) "expired" else "initial"
    val encounter = session?.id ?: java.util.UUID.randomUUID().toString()
    val actions = mutableListOf<Button>()
    fun action(label: String, run: () -> Unit) = Button(this).also { button ->
      button.text = label; button.setOnClickListener { actions.forEach { it.isEnabled = false }; run() }; body.addView(button); actions.add(button)
    }
    fun perform(allow: Boolean) {
      val token = generation
      // The OS action must succeed before earning a Return-home reward.
      val homeSucceeded = if (!allow) performGlobalAction(GLOBAL_ACTION_HOME) else false
      runtime.execute {
        try {
          if (allow && mid) runtime.engine.dismissNudge(record.plan.owner, record.plan.revision, app)
          else if (allow) runtime.engine.allow(record.plan.owner, record.plan.revision, app, System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot())
          else if (homeSucceeded) runtime.engine.quit(record.plan.owner, record.plan.revision, app, encounter, context, System.currentTimeMillis())
          runtime.epoch.incrementAndGet()
          main.post { if (token == generation) { hide(); if (!allow) { foreground = null; generation++; performGlobalAction(GLOBAL_ACTION_HOME) } } }
        } catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_ACTION"; main.post { if (token == generation) { hide(); foreground = null; generation++; if (allow) { android.widget.Toast.makeText(this, "App protection disabled: your choice could not be saved.", android.widget.Toast.LENGTH_LONG).show(); disableSelf() } else performGlobalAction(GLOBAL_ACTION_HOME) } } }
      }
    }
    val safe = action("Return home") { perform(false) }
    action(if (mid) "Keep going" else "Open anyway") { perform(true) }
    action("Disable app protection") { hide(); foreground = null; generation++; disableSelf() }
    val content = object : ScrollView(this) {
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) { perform(false); return true }
        return super.dispatchKeyEvent(event)
      }
    }.apply { addView(body); isFocusableInTouchMode = true }
    val params = WindowManager.LayoutParams(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY, WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN, PixelFormat.OPAQUE).apply { gravity = Gravity.TOP; title = "Hoosh pause" }
    try {
      getSystemService(WindowManager::class.java).addView(content, params); overlay = content; overlayKey = key; safe.requestFocus()
      runtime.execute {
        try { runtime.engine.action(record.plan.owner, record.plan.revision, "shield_presented", System.currentTimeMillis()) }
        catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_JOURNAL"; main.post { if (overlayKey == key) hide() } }
      }
    } catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_OVERLAY"; hide() }
  }
  override fun onInterrupt() {
    // This callback interrupts spoken/haptic feedback, not authorization or the foreground app.
    // We emit neither. Clearing tracking here loses expiry after another service interrupts feedback.
  }
  override fun onDestroy() {
    main.removeCallbacks(pulse); generation++; hide()
    if (::runtime.isInitialized && runtime.service === this) runtime.service = null
    try { unregisterReceiver(receiver) } catch (_: Exception) { }
    super.onDestroy()
  }
}
