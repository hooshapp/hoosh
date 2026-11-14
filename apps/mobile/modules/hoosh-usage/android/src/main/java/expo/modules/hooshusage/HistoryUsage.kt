package expo.modules.hooshusage

/** Raw identities are ephemeral input only; callers persist/return just the summed duration. */
data class HistoryUsageEvent(val at: Long, val kind: Int, val app: String? = null, val activity: String? = null)
data class HistoryUsageDay(val day: String, val usage: Long?, val coverage: String)
object HistoryUsage {
  /** Selected resumed-activity union, intersected with interactive/unlocked intervals.
   * Bracketing proves retained boundary witnesses, not OS-wide lossless telemetry. */
  fun measure(day: String, start: Long, end: Long, events: List<HistoryUsageEvent>, apps: Set<String>, capped: Boolean = false): HistoryUsageDay {
    fun unknown(reason: String) = HistoryUsageDay(day, null, reason)
    if (capped) return unknown("capped")
    if (end <= start || events.isEmpty() || events.first().at > start || events.last().at < end || events.zipWithNext().any { (a,b) -> b.at < a.at }) return unknown("missing")
    val active = mutableSetOf<Pair<String,String>>()
    var interactive: Boolean? = null
    var locked = false
    var previous = events.first().at
    var usage = 0L
    for (event in events) {
      val left = maxOf(previous, start); val right = minOf(event.at, end)
      if (right > left) {
        if (interactive == null) return unknown("missing")
        if (interactive == true && !locked && active.any { it.first in apps }) usage += right - left
      }
      if (event.at >= end) break
      if (event.kind in setOf(26,27) && event.at >= start) return unknown("interrupted")
      when (event.kind) {
        1 -> {
          val app = event.app ?: return unknown("missing")
          val activity = event.activity ?: return unknown("missing")
          active.add(app to activity)
          // A resumed activity alone does not override a later keyguard/screen-off state.
          if (interactive == null) interactive = true
        }
        2 -> {
          val key = event.app to event.activity
          if (event.app in apps && !active.contains(key) && event.at >= start) return unknown("missing")
          active.remove(key)
        }
        15 -> interactive = true
        16 -> { interactive = false; active.clear() }
        17 -> locked = true // KEYGUARD_SHOWN; foreground-service start is19.
        18 -> locked = false
        26,27 -> { active.clear(); interactive = null }
      }
      previous = event.at
    }
    return HistoryUsageDay(day, usage, "reported")
  }
}
