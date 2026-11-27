package expo.modules.hooshusage

import org.json.JSONArray
import org.json.JSONObject

/** Stored in the same AtomicFile commit as rule/session changes. */
object RewardPersistence {
  private fun JSONObject.long(key: String): Long { val n = get(key); check(n is Int || n is Long); return (n as Number).toLong() }
  private fun JSONObject.string(key: String): String = (get(key) as? String) ?: error("Invalid string")
  private fun JSONObject.bool(key: String): Boolean = (get(key) as? Boolean) ?: error("Invalid boolean")
  private fun JSONObject.optional(key: String): String? = if (isNull(key)) null else string(key)
  fun encode(r: RewardState): JSONObject = JSONObject().put("installation", r.installation)
    .put("next", r.next).put("discarded", r.discarded).put("day", r.day ?: JSONObject.NULL)
    .put("wall", r.wall).put("elapsed", r.elapsed).put("boot", r.boot).put("covered", r.covered).put("exhausted", r.exhausted)
    .put("events", JSONArray(r.events.map { e -> JSONObject().put("id", e.id).put("sequence", e.sequence)
      .put("at", e.at).put("kind", e.kind).put("day", e.day).put("encounter", e.encounter ?: JSONObject.NULL)
      .put("context", e.context ?: JSONObject.NULL).put("exhausted", e.exhausted ?: JSONObject.NULL)
      .put("covered", e.covered ?: JSONObject.NULL).put("sessionMinutes", e.sessionMinutes ?: JSONObject.NULL) }))
  fun decode(r: JSONObject): RewardState {
    val installation = r.string("installation"); QuestSchedules.id(installation)
    val next = r.long("next"); val discarded = r.long("discarded")
    check(next in 1..9007199254740991L && discarded in 0 until next)
    val array = r.getJSONArray("events"); check(array.length() <= 256)
    val events = (0 until array.length()).map { index -> val e = array.getJSONObject(index)
      val id = e.string("id"); QuestSchedules.id(id)
      val kind = e.string("kind"); check(kind in setOf("quit", "allowance", "day_closed", "nudge_skipped", "app_open"))
      val day = e.string("day"); check(java.time.LocalDate.parse(day).toString() == day)
      val encounter = e.optional("encounter"); encounter?.let { QuestSchedules.id(it) }
      val context = e.optional("context"); check(context == null || context in setOf("initial", "expired", "mid_session", "notification_accept"))
      val exhausted = if (e.isNull("exhausted")) null else e.bool("exhausted")
      val covered = if (e.isNull("covered")) null else e.bool("covered")
      check(when (kind) {
        "quit" -> encounter != null && context != null && exhausted == null && covered == null
        "nudge_skipped" -> encounter != null && context == null && exhausted == null && covered == null
        "app_open" -> encounter == null && context == null && exhausted == null && covered == null
        "allowance" -> encounter == null && context == null && exhausted != null && covered == null
        else -> encounter == null && context == null && exhausted != null && covered != null
      })
      val minutes = if (e.isNull("sessionMinutes")) null else e.long("sessionMinutes").also { check(kind in setOf("allowance", "app_open") && it in 1..1440) }.toInt()
      check(kind != "app_open" || minutes != null)
      RewardSignal(id, e.long("sequence"), e.long("at"), kind, day, encounter, context, exhausted, covered, minutes)
    }
    check(events.all { it.sequence in 1 until next && it.at >= 0 } && events.map { it.id }.distinct().size == events.size)
    check(events.zipWithNext().all { (a,b) -> a.sequence < b.sequence && a.at <= b.at })
    val day = r.optional("day"); check(day == null || java.time.LocalDate.parse(day).toString() == day)
    val wall = r.long("wall"); val elapsed = r.long("elapsed"); val boot = r.long("boot")
    check(wall >= 0 && elapsed >= 0 && boot in -1..Int.MAX_VALUE.toLong())
    return RewardState(installation, next, discarded, events, day, wall, elapsed,
      boot.toInt(), r.bool("covered"), r.bool("exhausted"))
  }
}
