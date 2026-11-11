package expo.modules.hooshusage

import android.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileNotFoundException

/** One bounded atomic record: installation, allowances and unacknowledged events commit together. */
class AtomicInterventionPersistence(private val path: File) : InterventionPersistence {
  private val file = AtomicFile(path)
  private fun JSONObject.strictString(key: String): String = (get(key) as? String) ?: error("Invalid string")
  private fun JSONArray.strictString(index: Int): String = (get(index) as? String) ?: error("Invalid string")
  private fun JSONObject.strictBoolean(key: String): Boolean = (get(key) as? Boolean) ?: error("Invalid boolean")
  private fun JSONObject.strictLong(key: String): Long {
    val n = get(key); check(n is Int || n is Long); return (n as Number).toLong()
  }
  private fun JSONObject.strictInt(key: String): Int { val n = strictLong(key); check(n in Int.MIN_VALUE..Int.MAX_VALUE); return n.toInt() }
  private fun numbers(value: JSONArray) = (0 until value.length()).map { value.getJSONObject(it) }
  override fun read(): InterventionRecord? {
    try {
      val bytes = file.openRead().use { it.readNBytesCompat(262145) }
      check(bytes.size <= 262144)
      val root = JSONObject(bytes.toString(Charsets.UTF_8)); check(root.strictInt("version") == 1)
      val p = root.getJSONObject("plan")
      val apps = p.getJSONArray("apps"); check(apps.length() <= 512)
      val keys = (0 until apps.length()).map { apps.strictString(it) }; check(keys.size == keys.toSet().size)
      SelectionDrafts.validateApps(keys.toSet())
      val windows = numbers(p.getJSONArray("windows")).map { InterventionWindow(it.strictString("id"), it.strictLong("start"), it.strictLong("end"), it.getJSONArray("apps").let { a -> (0 until a.length()).map { i -> a.strictString(i) }.toSet() }) }
      InterventionValidation.windows(windows)
      val plan = InterventionPlan(p.strictString("owner"), p.strictInt("revision"), p.strictInt("selectionRevision"), keys.toSet(), windows, p.getJSONObject("policy").let { SessionPolicy(it.strictString("timezone"), it.strictInt("count"), it.strictInt("seconds")) })
      InterventionValidation.policy(plan.policy); check(windows.all { it.apps.isNotEmpty() && plan.apps.containsAll(it.apps) }); InterventionValidation.owner(plan.owner); check(plan.revision > 0 && plan.selectionRevision > 0 && plan.apps.isNotEmpty())
      val allowances = numbers(root.getJSONArray("allowances")).map { AppAllowance(it.strictString("app"), it.strictString("reason"), it.strictInt("revision"), it.strictLong("wall"), it.strictLong("elapsed"), it.strictInt("boot")) }
      check(allowances.size <= 512 && allowances.all { a -> a.app in plan.apps && a.revision == plan.revision && windows.any { it.reasonId == a.reasonId } && a.wallEnd >= 0 && a.elapsedEnd >= 0 } && allowances.map { it.app to it.reasonId }.toSet().size == allowances.size)
      val events = numbers(root.getJSONArray("events")).map { InterventionEvent(it.strictString("id"), it.strictLong("at"), it.strictString("kind"), if (it.isNull("reason")) null else it.strictString("reason"), it.strictInt("revision"), if (it.isNull("index")) null else it.strictInt("index"), if (it.isNull("exhausted")) null else it.strictBoolean("exhausted")) }
      check(events.size <= 256 && events.map { it.id }.toSet().size == events.size)
      check(events.all { it.id.matches(Regex("[0-9a-f-]{36}")) && it.at >= 0 && it.revision > 0 && it.kind in setOf("rule_activated", "rule_deactivated", "shield_presented", "override_selected", "quit_selected") })
      val sessions = numbers(root.getJSONArray("sessions")).map { AppSession(it.strictString("app"), it.strictLong("wall"), it.strictLong("elapsed"), it.strictInt("boot"), it.strictInt("seconds")) }
      val daily = numbers(root.getJSONArray("daily")).map { DailySessions(it.strictString("app"), it.strictString("day"), it.strictInt("count")) }
      check(sessions.size <= 512 && daily.size <= 512 && sessions.map { it.app }.toSet().size == sessions.size && daily.map { it.app }.toSet().size == daily.size)
      SelectionDrafts.validateApps((sessions.map { it.app } + daily.map { it.app }).toSet())
      check(sessions.all { it.wallEnd >= 0 && it.elapsedEnd >= 0 && it.seconds in 1..86400 } && daily.all { it.day.matches(Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}")) && it.count > 0 })
      return InterventionRecord(plan, allowances, events, sessions, daily)
    } catch (_: FileNotFoundException) {
      if (listOf(path, File(path.path + ".bak"), File(path.path + ".new")).any { it.exists() } || (path.parentFile!!.exists() && !path.parentFile!!.canRead())) throw InterventionFailure("ERR_INTERVENTION_STORAGE")
      return null
    } catch (_: Exception) { throw InterventionFailure("ERR_INTERVENTION_STORAGE") }
  }
  override fun write(value: InterventionRecord) {
    val p = value.plan
    val windows = JSONArray(p.windows.map { JSONObject().put("id", it.reasonId).put("start", it.startsAt).put("end", it.endsAt).put("apps", JSONArray(it.apps.sorted())) })
    val allowances = JSONArray(value.allowances.map { JSONObject().put("app", it.app).put("reason", it.reasonId).put("revision", it.revision).put("wall", it.wallEnd).put("elapsed", it.elapsedEnd).put("boot", it.boot) })
    val events = JSONArray(value.events.map { JSONObject().put("id", it.id).put("at", it.at).put("kind", it.kind).put("reason", it.reasonId ?: JSONObject.NULL).put("revision", it.revision).put("index", it.sessionIndex ?: JSONObject.NULL).put("exhausted", it.exhausted ?: JSONObject.NULL) })
    val root = JSONObject().put("version", 1).put("plan", JSONObject().put("owner", p.owner).put("revision", p.revision).put("selectionRevision", p.selectionRevision).put("apps", JSONArray(p.apps.sorted())).put("windows", windows).put("policy", JSONObject().put("timezone", p.policy.timezoneId).put("count", p.policy.sessionsPerDay).put("seconds", p.policy.sessionSeconds))).put("allowances", allowances).put("events", events)
      .put("sessions", JSONArray(value.sessions.map { JSONObject().put("app", it.app).put("wall", it.wallEnd).put("elapsed", it.elapsedEnd).put("boot", it.boot).put("seconds", it.seconds) }))
      .put("daily", JSONArray(value.daily.map { JSONObject().put("app", it.app).put("day", it.day).put("count", it.count) }))
    val bytes = root.toString().toByteArray(Charsets.UTF_8)
    if (bytes.size > 262144 || (!path.parentFile!!.isDirectory && !path.parentFile!!.mkdirs())) throw InterventionFailure("ERR_INTERVENTION_STORAGE")
    val stream = try { file.startWrite() } catch (_: Exception) { throw InterventionFailure("ERR_INTERVENTION_STORAGE") }
    try { stream.write(bytes); file.finishWrite(stream) } catch (_: Exception) { file.failWrite(stream); throw InterventionFailure("ERR_INTERVENTION_STORAGE") }
    if (read() != value) throw InterventionFailure("ERR_INTERVENTION_STORAGE")
  }
  override fun erase() {
    try { file.delete() } catch (_: Exception) { throw InterventionFailure("ERR_INTERVENTION_STORAGE") }
    if (listOf(path, File(path.path + ".bak"), File(path.path + ".new")).any { it.exists() } || (path.parentFile!!.exists() && (!path.parentFile!!.isDirectory || !path.parentFile!!.canRead()))) throw InterventionFailure("ERR_INTERVENTION_STORAGE")
  }
  private fun java.io.InputStream.readNBytesCompat(limit: Int): ByteArray {
    val bytes = ByteArray(limit); var size = 0
    while (size < limit) { val n = read(bytes, size, limit - size); if (n < 0) break; size += n }
    return bytes.copyOf(size)
  }
}
