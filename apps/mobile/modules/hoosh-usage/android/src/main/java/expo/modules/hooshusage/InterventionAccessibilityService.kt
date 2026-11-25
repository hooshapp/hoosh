package expo.modules.hooshusage

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.widget.ImageView
import android.graphics.BitmapFactory
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
    override fun onReceive(context: Context, intent: Intent) { foreground = null; generation++; hide(); reconcile() }
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
        runtime.engine.activeForeground(app, System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot())
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
      orientation = LinearLayout.VERTICAL; val pad = (24 * resources.displayMetrics.density).toInt(); setPadding(pad, pad, pad, pad); setBackgroundColor(0xfffff1dd.toInt())
      if (!mid && Build.VERSION.SDK_INT >= 30) setOnApplyWindowInsetsListener { view, insets ->
        val safe = insets.getInsets(android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.displayCutout())
        view.setPadding(pad + safe.left, pad + safe.top, pad + safe.right, pad + safe.bottom); insets
      } else if (!mid) fitsSystemWindows = true
      if (mid) { setPadding(0, 0, 0, 0); clipToOutline = true
        background = GradientDrawable().apply { setColor(0xfffffaf2.toInt()); cornerRadius = 24 * resources.displayMetrics.density; setStroke((1.5f * resources.displayMetrics.density).toInt(), 0xffe8d5b0.toInt()) }
      }
      if (Build.VERSION.SDK_INT >= 28) accessibilityPaneTitle = "Hoosh pause"
    }
    val regular = Typeface.createFromAsset(assets, "SpaceGrotesk_400Regular.ttf")
    val bold = Typeface.createFromAsset(assets, "SpaceGrotesk_700Bold.ttf")
    val ink = 0xff3d2800.toInt()
    val green = 0xff33c659.toInt()
    val session = record.sessions.find { it.app == app && (mid || it.wallEnd > (reasons.minOfOrNull { reason -> reason.startsAt } ?: System.currentTimeMillis())) }
    val context = if (mid) "notification_accept" else if (session != null && (session.wallEnd <= System.currentTimeMillis() || session.remainingMs == 0L)) "expired" else if (session != null && session.remainingMs != null) "mid_session" else "initial"
    val encounter = if (mid && session != null) java.util.UUID.nameUUIDFromBytes("${session.id}:nudge:${session.nudgeQuarter + 1}".toByteArray()).toString()
      else session?.id ?: java.util.UUID.randomUUID().toString()
    val appName = try { packageManager.getApplicationLabel(packageManager.getApplicationInfo(app, 0)).toString() } catch (_: Exception) { "Selected app" }
    fun text(value: String, size: Float, heading: Boolean = false): TextView {
      val view = TextView(this).apply { text = value; textSize = size; typeface = if (heading) bold else regular; if (Build.VERSION.SDK_INT >= 28) isAccessibilityHeading = heading; setTextColor(ink); if (mid) setPadding((16 * resources.displayMetrics.density).toInt(), (14 * resources.displayMetrics.density).toInt(), (16 * resources.displayMetrics.density).toInt(), 0) else setPadding(0, 16, 0, 16) }
      body.addView(view); return view
    }
    if (!mid) text("$appName · ${if (context == "expired") "session ended" else "paused"}", 12f).apply {
      gravity = Gravity.CENTER; setTextColor(0xfffff1dd.toInt())
      background = GradientDrawable().apply { setColor(ink); cornerRadius = 32 * resources.displayMetrics.density }
    }
    val checkpoint = LinearLayout(this).apply { gravity = Gravity.CENTER; orientation = LinearLayout.HORIZONTAL }
    try { checkpoint.addView(ImageView(this).apply { setImageBitmap(assets.open("hoosh-checkpoint.png").use { BitmapFactory.decodeStream(it) }); adjustViewBounds = true }, LinearLayout.LayoutParams((32 * resources.displayMetrics.density).toInt(), (32 * resources.displayMetrics.density).toInt())) } catch (_: Exception) { }
    checkpoint.addView(TextView(this).apply { text = "check-point"; textSize = 13f; typeface = bold; setTextColor(0xff009966.toInt()); setPadding(8, 0, 0, 0) })
    if (mid) {
      val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
        setBackgroundColor(0xffffd8a1.toInt()); setPadding((16 * resources.displayMetrics.density).toInt(), (12 * resources.displayMetrics.density).toInt(), (16 * resources.displayMetrics.density).toInt(), (12 * resources.displayMetrics.density).toInt()) }
      header.addView(ImageView(this).apply { setImageBitmap(assets.open("hoosh-nudge-dino.png").use { BitmapFactory.decodeStream(it) }); scaleType = ImageView.ScaleType.FIT_CENTER },
        LinearLayout.LayoutParams((151 * resources.displayMetrics.density).toInt(), (136 * resources.displayMetrics.density).toInt()))
      header.addView(TextView(this).apply { text = "NUDGE\nRecommendation for you\n+30 ✦"; textSize = 13f; typeface = bold; setTextColor(ink) }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
      body.addView(header)
    } else body.addView(checkpoint)
    val message = if (mid) "${maxOf(1, ((session?.remainingMs ?: 0) + 59999) / 60000)} minutes before your timer ends…" else if (context == "expired") "Time to get back to what matters to you." else "Opened out of habit? You chose this time for yourself."
    val headline = text(message, if (mid) 17f else 38f, true)
    // Figma: 250ms lead-in, then a 4.3s (opening) / 3.8s (expiry) left-to-right reveal.
    val reducedMotion = if (Build.VERSION.SDK_INT >= 26) !android.animation.ValueAnimator.areAnimatorsEnabled() else false
    if (!mid && !reducedMotion) {
      headline.text = ""
      val duration = if (context == "expired") 3800L else 4300L
      fun reveal(index: Int) { if (overlayKey != key) return; headline.text = message.take(index); if (index < message.length) main.postDelayed({ reveal(index + 1) }, duration / message.length) }
      main.postDelayed({ reveal(1) }, 250)
    }
    text(if (mid) "Would you like to take a break and earn 30 credits for closing the app now?" else NudgeToneStore(this).line(record.plan.owner), if (mid) 14f else 16f)
    if (!mid) body.addView(android.widget.Space(this), LinearLayout.LayoutParams(1, 0, 1f))
    val today = RewardSignals.day(System.currentTimeMillis(), record.plan.policy.timezoneId)
    val day = maxOf(today, record.daily.maxOfOrNull { it.day } ?: today)
    val used = if (record.plan.policy.sharedBudget) record.daily.find { it.app == "__hoosh_shared_budget_v1__" && it.day == day }?.count
      ?: record.daily.filter { it.day == day && it.app != "__hoosh_shared_budget_v1__" }.sumOf { it.count }
      else record.daily.find { it.app == app && it.day == day }?.count ?: 0
    if (!mid) text("$used/${record.plan.policy.sessionsPerDay} sessions used", 12f).apply { gravity = Gravity.CENTER }
    val actionRow = if (mid) LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL
      setPadding((11 * resources.displayMetrics.density).toInt(), (12 * resources.displayMetrics.density).toInt(), (11 * resources.displayMetrics.density).toInt(), (16 * resources.displayMetrics.density).toInt())
      body.addView(this)
    } else null
    val actions = mutableListOf<Button>()
    fun action(label: String, run: () -> Unit) = Button(this).also { button ->
      button.text = label; button.typeface = bold; button.setOnClickListener { actions.forEach { it.isEnabled = false }; run() }
      if (actionRow != null) { val layout = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply { setMargins((5 * resources.displayMetrics.density).toInt(), 0, (5 * resources.displayMetrics.density).toInt(), 0) }
        if (label == "Skip") actionRow.addView(button, 0, layout) else actionRow.addView(button, layout)
      } else body.addView(button)
      actions.add(button)
    }
    fun perform(allow: Boolean) {
      val token = generation
      // The OS action must succeed before earning a Return-home reward.
      val homeSucceeded = if (!allow) performGlobalAction(GLOBAL_ACTION_HOME) else false
      runtime.execute {
        try {
          if (allow && mid) runtime.engine.dismissNudge(record.plan.owner, record.plan.revision, app)
          else if (allow) runtime.engine.allow(record.plan.owner, record.plan.revision, app, System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot(), activeUse = true)
          else if (homeSucceeded) runtime.engine.quit(record.plan.owner, record.plan.revision, app, encounter, context, System.currentTimeMillis())
          runtime.epoch.incrementAndGet()
          main.post { if (token == generation) { hide(); if (!allow) { foreground = null; generation++; performGlobalAction(GLOBAL_ACTION_HOME) } } }
        } catch (error: Exception) {
          if (error is InterventionFailure && error.code == "ERR_INTERVENTION_EXHAUSTED") {
            main.post { if (token == generation) { actions.forEach { it.isEnabled = true }; android.widget.Toast.makeText(this, "Your shared daily allowance is complete. Return home or review your plan in Hoosh.", android.widget.Toast.LENGTH_LONG).show() } }
            return@execute
          }
          runtime.failure = "ERR_INTERVENTION_ACTION"; main.post { if (token == generation) { hide(); foreground = null; generation++; if (allow) { android.widget.Toast.makeText(this, "App protection disabled: your choice could not be saved.", android.widget.Toast.LENGTH_LONG).show(); disableSelf() } else performGlobalAction(GLOBAL_ACTION_HOME) } } }
      }
    }
    val credits = if (mid) 30 else if (context == "initial") 5 else 20
    val safe = action(if (mid) "Accept" else "Quit Now · +$credits ✦") { perform(false) }.apply {
      setTextColor(ink); isAllCaps = false; textSize = 18f
      background = GradientDrawable().apply { setColor(green); cornerRadius = (if (mid) 16 else 24) * resources.displayMetrics.density }
      minHeight = ((if (mid) 44 else 60) * resources.displayMetrics.density).toInt()
    }
    action(if (mid) "Skip" else "Open anyway · ${maxOf(1, ((session?.remainingMs ?: record.plan.policy.sessionSeconds * 1000L) + 59999) / 60000)} min") { perform(true) }.apply {
      isAllCaps = false; setTextColor(0xff7d756a.toInt()); background = if (mid) GradientDrawable().apply { setColor(0xfff0ebe0.toInt()); cornerRadius = 16 * resources.displayMetrics.density } else android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT)
    }
    if (!mid) action("Protection settings") { hide(); foreground = null; generation++; startActivity(Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }.apply { isAllCaps = false; textSize = 12f }
    val content = object : ScrollView(this) {
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) { perform(false); return true }
        return super.dispatchKeyEvent(event)
      }
    }.apply { addView(body); isFillViewport = true; isFocusableInTouchMode = true }
    val params = WindowManager.LayoutParams(if (mid) resources.displayMetrics.widthPixels - (32 * resources.displayMetrics.density).toInt() else WindowManager.LayoutParams.MATCH_PARENT,
      if (mid) WindowManager.LayoutParams.WRAP_CONTENT else WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY, WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or (if (mid) WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL else 0), PixelFormat.OPAQUE).apply { gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL; if (mid) y = (56 * resources.displayMetrics.density).toInt(); title = "Hoosh pause" }
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
