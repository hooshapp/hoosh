package expo.modules.hooshusage

import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

/** Monday=0. A selected day owns the start; overnight ends on the next calendar date. */
data class WeeklySchedule(val weekdays: List<Int>, val start: String, val end: String, val nextDay: Boolean, val timezone: String)
data class WeeklyInstallation(val schedule: WeeklySchedule, val apps: Set<String>, val enabled: Boolean = true)

/** Pure native compiler. Resolves on demand indefinitely; returned preview is bounded, not an expiry horizon. */
object WeeklySchedules {
  fun validate(s: WeeklySchedule) {
    InterventionValidation.require(s.weekdays.isNotEmpty() && s.weekdays.size <= 7 && s.weekdays.distinct().size == s.weekdays.size && s.weekdays.all { it in 0..6 })
    val format = Regex("([01][0-9]|2[0-3]):[0-5][0-9]")
    InterventionValidation.require(format.matches(s.start) && format.matches(s.end))
    InterventionValidation.require(if (s.nextDay) s.end < s.start else s.end > s.start)
    InterventionValidation.require(s.timezone.length <= 128 && s.timezone in ZoneId.getAvailableZoneIds(), "ERR_SCHEDULE_TIMEZONE")
  }
  private fun boundary(date: LocalDate, time: String, zone: ZoneId, end: Boolean): Long {
    val local = LocalDateTime.of(date, LocalTime.parse(time))
    val offsets = zone.rules.getValidOffsets(local)
    // Gaps clamp to first valid instant. Overlaps use the earliest start/latest end once, never duplicate timers.
    val instant = if (offsets.isEmpty()) zone.rules.getTransition(local).instant
      else local.toInstant(if (end) offsets.last() else offsets.first())
    return instant.toEpochMilli()
  }
  fun compile(s: WeeklySchedule, now: Long, apps: Set<String> = emptySet()): List<InterventionWindow> {
    validate(s)
    InterventionValidation.require(now in 0..4102444800000L) // Product dates through 2100, not arbitrary JVM date extremes.
    val zone = ZoneId.of(s.timezone)
    val today = Instant.ofEpochMilli(now).atZone(zone).toLocalDate()
    // Include yesterday for overnight, plus seven future start dates so every selected weekday can be previewed.
    return (-1L..7L).mapNotNull { offset ->
      val day = today.plusDays(offset)
      if (day.dayOfWeek.value - 1 !in s.weekdays) return@mapNotNull null
      val start = boundary(day, s.start, zone, false)
      val finish = boundary(if (s.nextDay) day.plusDays(1) else day, s.end, zone, true)
      if (finish <= start || finish <= now) null
      else InterventionWindow("weekly_${day}", start, finish, apps)
    }
  }
  fun windows(plan: InterventionPlan, now: Long): List<InterventionWindow> {
    val weekly = plan.weekly ?: return plan.windows
    if (!weekly.enabled) return emptyList()
    return compile(weekly.schedule, now, weekly.apps).map { current ->
      // Preserve only the active occurrence's app snapshot on explicit re-apply. Future occurrences use latest saved selection.
      plan.windows.find { it.reasonId == current.reasonId && it.startsAt == current.startsAt && now >= it.startsAt && now < it.endsAt }
        ?.let { current.copy(apps = it.apps) } ?: current
    }
  }
}
