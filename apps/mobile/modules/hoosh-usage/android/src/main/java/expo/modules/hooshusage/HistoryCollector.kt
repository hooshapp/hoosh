package expo.modules.hooshusage

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileNotFoundException
import java.security.MessageDigest
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

/** Actor-confined, owner-private aggregate cache. No package names/class/event lists persist. */
class HistoryCollector(private val context: Context) {
  private var lastCapture = 0L
  private fun digest(value: String) = MessageDigest.getInstance("SHA-256").digest(value.toByteArray()).joinToString("") { "%02x".format(it.toInt() and 255) }
  private fun file(owner: String): AtomicFile {
    InterventionValidation.owner(owner)
    return AtomicFile(File(context.noBackupFilesDir, "history-v1/${digest(owner)}.json"))
  }
  private fun load(owner: String): JSONObject? = try {
    val raw = file(owner).openRead().use { val buffer = ByteArray(32769); var size = 0
      while (size < buffer.size) { val count = it.read(buffer,size,buffer.size-size); if (count < 0) break; size += count }
      check(size <= 32768); buffer.copyOf(size) }
    JSONObject(String(raw, Charsets.UTF_8)).also { value ->
      check(value.get("version") == 1 && value.get("owner") == owner)
      QuestSchedules.id(value.getString("series_id")); ZoneId.of(value.getString("timezone_id"))
      LocalDate.parse(value.getString("started_on")); check(value.getJSONArray("days").length() <= 56)
      check(value.getString("selection").matches(Regex("[0-9a-f]{64}")))
      val selected = value.get("selected_count"); check(selected is Int && selected in 1..512)
      val zone = ZoneId.of(value.getString("timezone_id"))
      val started = LocalDate.parse(value.getString("started_on"))
      val days = value.getJSONArray("days"); var previous: LocalDate? = null
      for (i in 0 until days.length()) {
        val row = days.getJSONObject(i); check(row.keys().asSequence().toSet() == setOf("day","usage_ms","coverage"))
        val day = LocalDate.parse(row.getString("day")); check(day >= started && (previous == null || day > previous)); previous = day
        val coverage = row.get("coverage"); check(coverage in setOf("reported","missing","capped","interrupted"))
        if (coverage == "reported") {
          val ms = row.get("usage_ms"); check(ms is Int || ms is Long)
          val length = day.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli() - day.atStartOfDay(zone).toInstant().toEpochMilli()
          check((ms as Number).toLong() in 0..length)
        } else check(row.isNull("usage_ms"))
      }
    }
  } catch (e: FileNotFoundException) { if (file(owner).baseFile.exists()) throw e else null }
  private fun write(owner: String, value: JSONObject) {
    val path = file(owner); path.baseFile.parentFile!!.let { check(it.isDirectory || it.mkdirs()) }
    val bytes = value.toString().toByteArray(); check(bytes.size <= 32768)
    val output = path.startWrite()
    try { output.write(bytes); path.finishWrite(output) } catch (e: Exception) { path.failWrite(output); throw e }
  }
  private fun selection(owner: String) = AtomicSelectionPersistence(File(context.noBackupFilesDir, "selection-editor-debug-v1")).read(owner)
  private fun fingerprint(value: SavedSelection) = digest(value.apps.sorted().joinToString("\n"))
  fun begin(owner: String, zone: String): Map<String,Any?> {
    check(LauncherAppCatalog(context).isUnlocked() == true && UsageReader(context).authorization() == "authorized")
    val selected = selection(owner); check(selected.apps.isNotEmpty())
    check(LauncherAppCatalog(context).eligibleKeys().containsAll(selected.apps))
    val today = LocalDate.now(ZoneId.of(zone))
    val value = JSONObject().put("version",1).put("owner",owner).put("series_id",UUID.randomUUID().toString())
      .put("timezone_id",zone).put("selected_count",selected.apps.size).put("selection",fingerprint(selected))
      .put("started_on",today.minusDays(7).toString()).put("days",JSONArray())
    write(owner,value)
    return read(owner)
  }
  fun erase(owner: String) { file(owner).delete() }
  fun capture(owner: String, now: Long) {
    if (now >= lastCapture && now - lastCapture < 1800000) return
    lastCapture = now
    try { read(owner, now) } catch (_: Exception) { /* History failure must never stop protection. */ }
  }
  fun read(owner: String, now: Long = System.currentTimeMillis()): Map<String,Any?> {
    val value = load(owner) ?: return mapOf("state" to "not_started", "series" to null)
    if (LauncherAppCatalog(context).isUnlocked() != true) return mapOf("state" to "locked", "series" to null)
    if (UsageReader(context).authorization() != "authorized") return mapOf("state" to "needs_permission", "series" to null)
    val selected = selection(owner)
    if (fingerprint(selected) != value.getString("selection") || !LauncherAppCatalog(context).eligibleKeys().containsAll(selected.apps))
      return mapOf("state" to "selection_changed", "series" to null)
    val zone = ZoneId.of(value.getString("timezone_id"))
    if (zone != ZoneId.systemDefault()) return mapOf("state" to "timezone_changed", "series" to null)
    val today = Instant.ofEpochMilli(now).atZone(zone).toLocalDate()
    val stored = value.getJSONArray("days")
    val rows = (0 until stored.length()).map { stored.getJSONObject(it) }.associateBy { it.getString("day") }.toMutableMap()
    val first = maxOf(LocalDate.parse(value.getString("started_on")), today.minusDays(56))
    var day = first
    while (day < today) {
      val key = day.toString()
      if (rows[key]?.optString("coverage") != "reported") {
        val result = if (day < today.minusDays(7)) HistoryUsageDay(key,null,"missing") else query(day,zone,now,selected.apps)
        rows[key] = JSONObject().put("day",key).put("usage_ms",result.usage ?: JSONObject.NULL).put("coverage",result.coverage)
      }
      day = day.plusDays(1)
    }
    val retained = rows.filterKeys { it >= first.toString() && it < today.toString() }.toSortedMap().values.toList()
    value.put("days",JSONArray(retained)); write(owner,value)
    // Deliberately omit owner, selection digest, package identities and raw Android events.
    if (LauncherAppCatalog(context).isUnlocked() != true) return mapOf("state" to "locked", "series" to null)
    if (UsageReader(context).authorization() != "authorized") return mapOf("state" to "needs_permission", "series" to null)
    val days = retained.map { mapOf("day" to it.getString("day"), "usage_ms" to if (it.isNull("usage_ms")) null else it.getLong("usage_ms"), "coverage" to it.getString("coverage")) }
    return mapOf("state" to "ready", "series" to mapOf("series_id" to value.getString("series_id"), "timezone_id" to zone.id,
      "selected_count" to selected.apps.size, "started_on" to value.getString("started_on"), "source" to "android_usage_events_v1", "days" to days))
  }
  internal fun query(day: LocalDate, zone: ZoneId, now: Long, apps: Set<String>): HistoryUsageDay {
    val start = day.atStartOfDay(zone).toInstant().toEpochMilli()
    val end = day.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
    val manager = context.getSystemService(UsageStatsManager::class.java) ?: return HistoryUsageDay(day.toString(),null,"missing")
    val raw = manager.queryEvents(start - 86400000, minOf(now, end + 86400000)) ?: return HistoryUsageDay(day.toString(),null,"missing")
    val events = mutableListOf<HistoryUsageEvent>(); val event = UsageEvents.Event()
    var count = 0; var first: Long? = null; var last: Long? = null
    while (raw.hasNextEvent() && count < 25000) {
      if (!raw.getNextEvent(event)) break
      count++; if (first == null) first = event.timeStamp; last = event.timeStamp
      if (event.eventType in setOf(1,2,23,15,16,17,18,26,27)) events.add(HistoryUsageEvent(event.timeStamp,event.eventType,event.packageName,event.className))
    }
    if (UsageReader(context).authorization() != "authorized" || LauncherAppCatalog(context).isUnlocked() != true) return HistoryUsageDay(day.toString(),null,"missing")
    if (first != null) events.add(0,HistoryUsageEvent(first,0))
    if (last != null) events.add(HistoryUsageEvent(last,0))
    return HistoryUsage.measure(day.toString(),start,end,events,apps,raw.hasNextEvent())
  }
}
