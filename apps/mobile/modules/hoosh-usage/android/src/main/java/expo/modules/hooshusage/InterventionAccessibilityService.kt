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
import android.text.SpannableString
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.view.accessibility.AccessibilityNodeInfo
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
  private var overlayCopy: InterventionLeases.ShieldCopy? = null
  val visible get() = overlay != null
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) { switchForeground(null); reconcile() }
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
    if (app != foreground) switchForeground(app)
    reconcile()
  }
  private fun switchForeground(app: String?) {
    generation++
    hide()
    foreground = app
    if (!::runtime.isInitialized || !runtime.authorized() || runtime.failure != null) return
    // Persist each observed departure, even when two window changes occur within one read.
    val wall = System.currentTimeMillis()
    val elapsed = SystemClock.elapsedRealtime()
    runtime.execute {
      try { runtime.engine.activeForeground(app, wall, elapsed, runtime.boot()) }
      catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_STORAGE" }
    }
  }
  fun reconcile() {
    if (!::runtime.isInitialized) return
    if (runtime.failure != null || !runtime.authorized()) { foreground = null; generation++; hide(); return }
    val app = if (runtime.unlocked()) foreground else null
    if (reading) { readPending = true; return }
    reading = true
    val token = generation
    val epoch = runtime.epoch.get()
    val wall = System.currentTimeMillis()
    val elapsed = SystemClock.elapsedRealtime()
    runtime.execute {
      try {
        runtime.engine.activeForeground(app, wall, elapsed, runtime.boot())
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
    val old = overlay; overlay = null; overlayKey = null; overlayCopy = null
    if (old != null) try { getSystemService(WindowManager::class.java).removeView(old) } catch (_: Exception) { runtime.failure = "ERR_INTERVENTION_OVERLAY"; disableSelf() }
  }
  private fun show(record: InterventionRecord, app: String, reasons: List<InterventionWindow>, nudge: AppSession?) {
    val mid = reasons.isEmpty() && nudge != null
    val key = "${record.plan.owner}:${record.plan.revision}:$app:${if (mid) nudge?.id else reasons.joinToString { it.reasonId }}"
    val shieldCopy = runtime.leases.shieldCopy(record.plan.owner)
    val sameEncounter = key == overlayKey
    if (sameEncounter && shieldCopy == overlayCopy) return
    hide()
    fun dp(value: Float) = (value * resources.displayMetrics.density + 0.5f).toInt()
    val cream = 0xfffff1dd.toInt()
    val card = 0xfffffaf2.toInt()
    val outline = 0xffe8d5b0.toInt()
    val ink = 0xff3d2800.toInt()
    val green = 0xff33c659.toInt()
    val deepGreen = 0xff08734e.toInt()
    fun capsule(color: Int, radius: Float, bordered: Boolean = false) = GradientDrawable().apply {
      setColor(color)
      cornerRadius = dp(radius).toFloat()
      if (bordered) setStroke(dp(1.5f), outline)
    }
    val body = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      val pad = dp(20f)
      setPadding(pad, dp(18f), pad, dp(32f))
      background = GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
        intArrayOf(0xffffecd1.toInt(), cream, cream, cream, cream, cream, cream, cream))

      if (!mid && Build.VERSION.SDK_INT >= 30) setOnApplyWindowInsetsListener { view, insets ->
        val safe = insets.getInsets(android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.displayCutout())
        view.setPadding(pad + safe.left, dp(18f) + safe.top, pad + safe.right, dp(32f) + safe.bottom); insets
      } else if (!mid) fitsSystemWindows = true
      if (mid) { setPadding(0, 0, 0, 0); clipToOutline = true
        background = GradientDrawable().apply { setColor(0xfffffaf2.toInt()); cornerRadius = 24 * resources.displayMetrics.density; setStroke((1.5f * resources.displayMetrics.density).toInt(), 0xffe8d5b0.toInt()) }
      }
      if (Build.VERSION.SDK_INT >= 28) accessibilityPaneTitle = "Hoosh pause"
    }
    val regular = Typeface.createFromAsset(assets, "SpaceGrotesk_400Regular.ttf")
    val bold = Typeface.createFromAsset(assets, "SpaceGrotesk_700Bold.ttf")
    val session = record.sessions.find { it.app == app && (mid || it.wallEnd > (reasons.minOfOrNull { reason -> reason.startsAt } ?: System.currentTimeMillis())) }
    val resumable = if (mid) null else runtime.engine.resumable(record, app, System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot())
    val continuing = resumable != null
    val today = RewardSignals.day(System.currentTimeMillis(), record.plan.policy.timezoneId)
    val day = maxOf(today, record.daily.maxOfOrNull { it.day } ?: today)
    val used = if (record.plan.policy.sharedBudget) record.daily.find { it.app == "__hoosh_shared_budget_v1__" && it.day == day }?.count
      ?: record.daily.filter { it.day == day && it.app != "__hoosh_shared_budget_v1__" }.sumOf { it.count }
      else record.daily.find { it.app == app && it.day == day }?.count ?: 0
    val limit = record.plan.policy.sessionsPerDay
    val exhausted = !mid && !continuing && used >= limit
    val context = if (mid) "notification_accept" else if (session != null && (session.wallEnd <= System.currentTimeMillis() || session.remainingMs == 0L)) "expired" else if (session != null && session.remainingMs != null) "mid_session" else "initial"
    val encounter = if (mid && session != null) java.util.UUID.nameUUIDFromBytes("${session.id}:nudge:${session.nudgeQuarter + 1}".toByteArray()).toString()
      else java.util.UUID.randomUUID().toString()
    val appName = try { packageManager.getApplicationLabel(packageManager.getApplicationInfo(app, 0)).toString() } catch (_: Exception) { "Selected app" }
    fun text(value: String, size: Float, heading: Boolean = false): TextView {
      val view = TextView(this).apply { text = value; textSize = size; typeface = if (heading) bold else regular; if (Build.VERSION.SDK_INT >= 28) isAccessibilityHeading = heading; setTextColor(ink); if (mid) setPadding((16 * resources.displayMetrics.density).toInt(), (14 * resources.displayMetrics.density).toInt(), (16 * resources.displayMetrics.density).toInt(), 0) else setPadding(0, 16, 0, 16) }
      body.addView(view); return view
    }
    fun label(value: CharSequence, size: Float, face: Typeface, color: Int) = TextView(this).apply {
      text = value
      textSize = size
      typeface = face
      setTextColor(color)
      includeFontPadding = false
    }
    fun center(view: View, top: Float, bottom: Float = 0f) {
      body.addView(view, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
        gravity = Gravity.CENTER_HORIZONTAL
        topMargin = dp(top)
        bottomMargin = dp(bottom)
      })
    }
    val status = when {
      exhausted -> "daily limit reached"
      context == "expired" -> "session ended"
      else -> "paused"
    }
    if (!mid) {
      val badge = LinearLayout(this).apply {
        gravity = Gravity.CENTER
        orientation = LinearLayout.HORIZONTAL
        setPadding(dp(14f), dp(6f), dp(14f), dp(6f))
        background = capsule(ink, 20f)
      }
      badge.addView(View(this).apply { background = capsule(0xffe1306c.toInt(), 4f) },
        LinearLayout.LayoutParams(dp(8f), dp(8f)).apply { marginEnd = dp(6f) })
      badge.addView(label(appName, 12f, bold, 0xffffd8a1.toInt()))
      badge.addView(label(" · $status", 12f, regular, android.graphics.Color.WHITE))
      center(badge, 0f)
    }
    val checkpoint = LinearLayout(this).apply {
      gravity = Gravity.CENTER
      orientation = LinearLayout.HORIZONTAL
      background = capsule(card, 14f, true)
      setPadding(dp(14f), dp(6f), dp(14f), dp(6f))
    }
    try {
      checkpoint.addView(ImageView(this).apply {
        setImageBitmap(assets.open("hoosh-checkpoint.png").use { BitmapFactory.decodeStream(it) })
        scaleType = ImageView.ScaleType.FIT_CENTER
      }, LinearLayout.LayoutParams(dp(27.4f), dp(23.2f)).apply { marginEnd = dp(6f) })
    } catch (_: Exception) {}
    checkpoint.addView(label("check-point", 12f, bold, deepGreen))
    if (mid) {
      val amber = 0xffffd8a1.toInt()
      val header = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setBackgroundColor(amber)
        setPadding(dp(16f), dp(12f), dp(16f), dp(12f))
      }
      header.addView(ImageView(this).apply {
        setImageBitmap(assets.open("hoosh-nudge-dino.png").use { BitmapFactory.decodeStream(it) })
        scaleType = ImageView.ScaleType.FIT_CENTER
      }, LinearLayout.LayoutParams(dp(151f), dp(136f)).apply { marginEnd = dp(10f) })
      val reward = label("+30 ✦", 10f, bold, amber).apply {
        setPadding(dp(10f), dp(4f), dp(10f), dp(4f))
        background = capsule(0xff1a1a1a.toInt(), 12f)
      }
      val headerCopy = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        minimumHeight = dp(136f)
        addView(reward, LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { gravity = Gravity.END; topMargin = dp(12f) })
        val copy = LinearLayout(this@InterventionAccessibilityService).apply {
          orientation = LinearLayout.VERTICAL
          gravity = Gravity.CENTER_VERTICAL
          setPadding(0, dp(4f), 0, dp(24f))
          addView(label("NUDGE", 10f, bold, ink))
          addView(label("Recommendation for you", 13f, bold, ink), LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT,
          ).apply { topMargin = dp(2f) })
        }
        addView(copy, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
      }
      header.addView(headerCopy, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
      body.addView(header)
    } else center(checkpoint, 24f, 24f)
    val copy = NudgeToneStore(this)
    val name = shieldCopy?.name.orEmpty()
    val activity = copy.activityLabel(shieldCopy?.activity)
    val address = name.takeIf { it.isNotBlank() }?.let { ", $it" }.orEmpty()
    val goal = activity.ifBlank { "what matters to you" }
    fun durationLabel(milliseconds: Long): String {
      val seconds = maxOf(1, (milliseconds + 999) / 1000)
      val minutes = seconds / 60
      val leftover = seconds % 60
      return when {
        minutes == 0L -> "$seconds sec"
        leftover == 0L -> "$minutes min"
        else -> "$minutes min $leftover sec"
      }
    }
    val message = when {
      mid -> "${durationLabel(session?.let { runtime.engine.remaining(it, SystemClock.elapsedRealtime()) } ?: 0)} left in this session"
      exhausted -> "You’re out of sessions for today$address. Make time for $goal."
      context == "expired" -> "Time to get back to $goal$address."
      else -> "Opened out of habit? You chose this time for $goal$address."
    }
    if (mid) {
      text(message, 17f, true)
      text("${copy.line(record.plan.owner.takeIf { shieldCopy != null }, goal)} Earn 30 credits for closing the app now.", 14f)
    } else {
      val headline = label(message, 45f, regular, ink).apply {
        setLineSpacing(dp(3f).toFloat(), 1f)
        if (Build.VERSION.SDK_INT >= 28) isAccessibilityHeading = true
        contentDescription = message
      }
      body.addView(headline, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
        marginStart = dp(8f)
        marginEnd = dp(8f)
      })
      fun revealed(index: Int, cursor: Boolean): CharSequence {
        val visible = SpannableStringBuilder(message.take(index))
        for (phrase in listOf(goal, name).filter { it.isNotBlank() }) {
          val start = message.lastIndexOf(phrase)
          if (start >= 0 && start < visible.length) {
            visible.setSpan(StyleSpan(Typeface.BOLD), start, minOf(visible.length, start + phrase.length), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
          }
        }
        if (cursor) visible.append("▏")
        return visible
      }
      val reducedMotion = Build.VERSION.SDK_INT >= 26 && !android.animation.ValueAnimator.areAnimatorsEnabled()
      if (reducedMotion || exhausted) headline.text = revealed(message.length, false)
      else {
        val start = SystemClock.uptimeMillis()
        val duration = if (context == "expired") 3800L else 4300L
        fun reveal() {
          if (overlayKey != key || overlayCopy != shieldCopy) return
          val elapsed = SystemClock.uptimeMillis() - start
          val index = (((elapsed - 250).coerceIn(0, duration) * message.length) / duration).toInt()
          headline.text = revealed(index, elapsed < duration + 700 && elapsed / 450 % 2 == 0L)
          if (elapsed < duration + 700) main.postDelayed({ reveal() }, 35)
        }
        headline.text = ""
        main.postDelayed({ reveal() }, 250)
      }
      body.addView(android.widget.Space(this), LinearLayout.LayoutParams(1, dp(18f), 1f))
      center(label("${used.coerceIn(0, limit)}/$limit sessions used", 12f, bold, deepGreen).apply {
        setPadding(dp(14f), dp(6f), dp(14f), dp(6f))
        background = capsule(card, 14f, true)
      }, 0f, 20f)
    }
    val actionRow = if (mid) LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL
      setPadding((11 * resources.displayMetrics.density).toInt(), (12 * resources.displayMetrics.density).toInt(), (11 * resources.displayMetrics.density).toInt(), (16 * resources.displayMetrics.density).toInt())
      body.addView(this)
    } else null
    val actions = mutableListOf<View>()
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
          if (allow && mid) runtime.engine.dismissNudge(record.plan.owner, record.plan.revision, app, System.currentTimeMillis(), encounter)
          else if (allow) runtime.engine.allow(record.plan.owner, record.plan.revision, app, System.currentTimeMillis(), SystemClock.elapsedRealtime(), runtime.boot(), activeUse = true)
          else if (homeSucceeded) {
            val now = System.currentTimeMillis()
            runtime.engine.activeForeground(null, now, SystemClock.elapsedRealtime(), runtime.boot())
            runtime.engine.quit(record.plan.owner, record.plan.revision, app, encounter, context, now)
          }
          runtime.epoch.incrementAndGet()
          main.post { if (token == generation) { hide(); if (!allow) { foreground = null; generation++; performGlobalAction(GLOBAL_ACTION_HOME) } } }
        } catch (error: Exception) {
          if (error is InterventionFailure && error.code in setOf("ERR_INTERVENTION_EXHAUSTED", "ERR_INTERVENTION_CONFLICT")) {
            main.post { if (token == generation) { hide(); reconcile() } }
            return@execute
          }
          runtime.failure = "ERR_INTERVENTION_ACTION"; main.post { if (token == generation) { hide(); foreground = null; generation++; if (allow) { android.widget.Toast.makeText(this, "App protection disabled: your choice could not be saved.", android.widget.Toast.LENGTH_LONG).show(); disableSelf() } else performGlobalAction(GLOBAL_ACTION_HOME) } } }
      }
    }
    val credits = if (mid) 30 else if (context == "initial") 5 else 20
    val safe: View = if (mid) action("Accept") { perform(false) }.apply {
      setTextColor(ink)
      isAllCaps = false
      textSize = 18f
      background = capsule(green, 16f)
      minHeight = dp(44f)
    } else {
      LinearLayout(this).apply {
        gravity = Gravity.CENTER
        orientation = LinearLayout.HORIZONTAL
        background = capsule(green, 24f)
        elevation = dp(2f).toFloat()
        minimumHeight = dp(68f)
        setPadding(dp(12f), dp(12f), dp(12f), dp(12f))
        contentDescription = "Quit Now, earn $credits credits"
        isFocusable = true
        accessibilityDelegate = object : View.AccessibilityDelegate() {
          override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfo) {
            super.onInitializeAccessibilityNodeInfo(host, info)
            info.className = Button::class.java.name
          }
        }
        addView(label("✓  Quit Now", 20f, bold, 0xff0b3320.toInt()))
        addView(label("+$credits ✦", 14f, bold, cream).apply {
          setPadding(dp(12f), dp(5f), dp(12f), dp(5f))
          background = capsule(deepGreen, 14f)
        }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
          marginStart = dp(8f)
        })
        setOnClickListener { actions.forEach { it.isEnabled = false }; perform(false) }
        actions.add(this)
        body.addView(this)
      }
    }
    if (mid) action("Skip") { perform(true) }.apply {
      isAllCaps = false
      setTextColor(ink)
      background = capsule(0xfff0ebe0.toInt(), 16f)
    } else if (!exhausted) {
      val allowanceMs = if (resumable != null) runtime.engine.remaining(resumable, SystemClock.elapsedRealtime()) else record.plan.policy.sessionSeconds * 1000L
      val remainingLabel = durationLabel(allowanceMs)
      val title = if (continuing) "Resume session" else "Open anyway"
      val detail = when {
        continuing -> "$remainingLabel remaining"
        context == "expired" -> "Get another $remainingLabel · no points awarded"
        else -> "Open for $remainingLabel · no points awarded"
      }
      action(title) { perform(true) }.apply {
        text = SpannableString("$title\n$detail").apply {
          setSpan(android.text.style.RelativeSizeSpan(11f / 13f), title.length + 1, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
          setSpan(ForegroundColorSpan(0xff71675a.toInt()), title.length + 1, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        typeface = regular
        textSize = 13f
        isAllCaps = false
        setTextColor(0xff635b51.toInt())
        minHeight = dp(48f)
        background = android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT)
      }
    }
    val content = object : ScrollView(this) {
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) { perform(false); return true }
        return super.dispatchKeyEvent(event)
      }
    }.apply { addView(body); isFillViewport = true; isFocusableInTouchMode = true }
    val params = WindowManager.LayoutParams(if (mid) resources.displayMetrics.widthPixels - (32 * resources.displayMetrics.density).toInt() else WindowManager.LayoutParams.MATCH_PARENT,
      if (mid) WindowManager.LayoutParams.WRAP_CONTENT else WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY, WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or (if (mid) WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL else 0), if (mid) PixelFormat.TRANSLUCENT else PixelFormat.OPAQUE).apply { gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL; if (mid) y = (56 * resources.displayMetrics.density).toInt(); title = "Hoosh pause" }
    try {
      getSystemService(WindowManager::class.java).addView(content, params); overlay = content; overlayKey = key; overlayCopy = shieldCopy; safe.requestFocus()
      if (sameEncounter) return
      runtime.execute {
        try { runtime.engine.action(record.plan.owner, record.plan.revision, "shield_presented", System.currentTimeMillis()) }
        catch (error: Exception) {
          if (error !is InterventionFailure || error.code != "ERR_INTERVENTION_CONFLICT") {
            runtime.failure = "ERR_INTERVENTION_JOURNAL"
          }
          main.post { if (overlayKey == key) { hide(); reconcile() } }
        }
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
