package expo.modules.hooshusage

import android.Manifest
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.os.SystemClock
import android.provider.CalendarContract
import android.provider.CalendarContract.Calendars
import android.provider.CalendarContract.Instances
import java.util.concurrent.Executors

/** Keep only the next start time of an explicitly connected Google calendar in memory. */
class GoogleCalendarNudges(context: Context) {
  private val context = context.applicationContext
  private val preferences = NudgeToneStore(context)
  private data class Snapshot(val owner: String, val checkedAt: Long, val startsAt: Long? = null)

  companion object {
    private val worker = Executors.newSingleThreadExecutor()
    private val cacheLock = Any()
    private var snapshot: Snapshot? = null
    private var reading = false
  }

  fun status(owner: String, enabled: Boolean?): String {
    if (enabled == false) {
      preferences.setGoogleCalendar(owner, false)
      synchronized(cacheLock) { if (snapshot?.owner == owner) snapshot = null }
    }
    if (enabled == null && !preferences.googleCalendarEnabled(owner)) return "off"
    if (enabled == false) return "off"
    if (!hasPermission()) return "permission"
    val calendars = googleCalendarIds() ?: return "unavailable"
    if (calendars.isEmpty()) return "sync_required"
    if (enabled == true) preferences.setGoogleCalendar(owner, true)
    reminder(owner, System.currentTimeMillis())
    return "connected"
  }

  /** Called on the intervention worker. Calendar errors must never interrupt protection. */
  fun reminder(owner: String, wall: Long): String? {
    if (!hasPermission() || !preferences.googleCalendarEnabled(owner)) {
      synchronized(cacheLock) { if (snapshot?.owner == owner) snapshot = null }
      return null
    }
    val elapsed = SystemClock.elapsedRealtime()
    val next = synchronized(cacheLock) {
      val cached = snapshot?.takeIf { it.owner == owner }
      if (!reading && (cached == null || elapsed - cached.checkedAt >= 60_000)) {
        val request = Snapshot(owner, elapsed, cached?.startsAt)
        snapshot = request
        reading = true
        worker.execute {
          val start = nextStart(wall)
          synchronized(cacheLock) {
            if (snapshot === request) snapshot = request.copy(startsAt = start)
            reading = false
          }
        }
      }
      cached?.startsAt
    } ?: return null
    return if (next > wall && next - wall <= 30 * 60_000) {
      "You have something coming up. Put your phone down to get ready."
    } else null
  }

  private fun hasPermission() =
    context.checkSelfPermission(Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED

  fun questPlanningContext(owner: String): Map<String, Any> {
    val unavailable: Map<String, Any> = mapOf("windows" to emptyList<List<Long>>(), "calendarChecked" to false)
    if (!hasPermission() || !preferences.googleCalendarEnabled(owner)) return unavailable
    val calendars = googleCalendarIds().orEmpty()
    if (calendars.isEmpty()) return unavailable
    val now = System.currentTimeMillis()
    val uri = Instances.CONTENT_URI.buildUpon().apply {
      ContentUris.appendId(this, now)
      ContentUris.appendId(this, now + 3 * 60 * 60_000)
    }.build()
    val placeholders = calendars.joinToString(",") { "?" }
    return try {
      var nextEvent: Map<String, Any>? = null
      val windows = context.contentResolver.query(
        uri,
        arrayOf(Instances.BEGIN, Instances.END, Instances.TITLE),
        "${Instances.CALENDAR_ID} IN ($placeholders) AND ${Instances.END} > ? " +
          "AND ${Instances.ALL_DAY} = 0 AND (${Instances.STATUS} IS NULL OR ${Instances.STATUS} != ?)",
        (calendars + now.toString() + CalendarContract.Events.STATUS_CANCELED.toString()).toTypedArray(),
        "${Instances.BEGIN} ASC",
      )?.use { rows ->
        buildList<List<Long>> {
          while (rows.moveToNext()) {
            val start = rows.getLong(0)
            add(listOf(start, rows.getLong(1)))
            if (nextEvent == null && start > now) {
              val title = rows.getString(2)?.replace(Regex("\\s+"), " ")?.trim()?.take(100)
              if (!title.isNullOrEmpty()) nextEvent = mapOf("startsAt" to start, "title" to title)
            }
          }
        }
      } ?: return unavailable
      buildMap {
        put("windows", windows)
        put("calendarChecked", true)
        nextEvent?.let { put("event", it) }
      }
    } catch (_: RuntimeException) {
      unavailable
    }
  }

  private fun googleCalendarIds(): List<String>? = try {
    context.contentResolver.query(
      Calendars.CONTENT_URI,
      arrayOf(Calendars._ID),
      "${Calendars.ACCOUNT_TYPE} = ? AND ${Calendars.VISIBLE} = 1",
      arrayOf("com.google"),
      null,
    )?.use { rows ->
      buildList { while (rows.moveToNext()) add(rows.getLong(0).toString()) }
    }
  } catch (_: RuntimeException) {
    null
  }

  private fun nextStart(wall: Long): Long? {
    val calendars = googleCalendarIds().orEmpty()
    if (calendars.isEmpty()) return null
    val uri = Instances.CONTENT_URI.buildUpon().apply {
      ContentUris.appendId(this, wall)
      ContentUris.appendId(this, wall + 31 * 60_000)
    }.build()
    val placeholders = calendars.joinToString(",") { "?" }
    return try {
      context.contentResolver.query(
        uri,
        arrayOf(Instances.BEGIN),
        "${Instances.CALENDAR_ID} IN ($placeholders) AND ${Instances.BEGIN} > ? " +
          "AND ${Instances.ALL_DAY} = 0 AND (${Instances.STATUS} IS NULL OR ${Instances.STATUS} != ?)",
        (calendars + wall.toString() + CalendarContract.Events.STATUS_CANCELED.toString()).toTypedArray(),
        "${Instances.BEGIN} ASC",
      )?.use { rows -> if (rows.moveToFirst()) rows.getLong(0) else null }
    } catch (_: RuntimeException) {
      null
    }
  }
}
