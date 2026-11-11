package expo.modules.hooshusage

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/** Native-only app snapshots; the bridge supplies schedule metadata, never app identifiers. */
data class QuestInstallation(
  val questId: String, val revision: Int, val firstDate: String, val repeat: String,
  val schedule: WeeklySchedule, val effectiveFrom: Long, val effectiveUntil: Long?,
  val apps: Set<String>,
)

object QuestSchedules {
  fun isReasonId(value: String) = value.matches(Regex("q_[0-9a-f]{32}_v[1-9][0-9]{0,9}_d[0-9]{8}"))
  fun id(value: String) = InterventionValidation.require(value.matches(Regex("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")))
  fun validate(value: QuestInstallation) {
    id(value.questId)
    InterventionValidation.require(value.revision > 0 && value.repeat in setOf("none", "daily", "weekly"))
    val day = try { LocalDate.parse(value.firstDate) } catch (_: Exception) { throw InterventionFailure("ERR_QUEST_DATE") }
    InterventionValidation.require(day.year in 2020..2100 && day.toString() == value.firstDate)
    WeeklySchedules.validate(value.schedule)
    InterventionValidation.require(value.effectiveFrom >= 0 && (value.effectiveUntil == null || value.effectiveUntil >= value.effectiveFrom))
    InterventionValidation.require(value.apps.isNotEmpty())
    SelectionDrafts.validateApps(value.apps)
  }
  fun reason(questId: String, revision: Int, day: LocalDate): String =
    "q_${questId.replace("-", "")}_v${revision}_d${day.toString().replace("-", "")}"

  /** Keep future cancellations even outside the read horizon, discard only expired/removed occurrences. */
  fun pendingCancellation(quests: List<QuestInstallation>, reason: String, now: Long): Boolean {
    if (!isReasonId(reason)) return false
    val raw = reason.takeLast(8)
    val day = try { LocalDate.parse("${raw.take(4)}-${raw.substring(4, 6)}-${raw.takeLast(2)}") } catch (_: Exception) { return false }
    return quests.any { q ->
      if (reason(q.questId, q.revision, day) != reason) false
      else compile(q, day.atStartOfDay(ZoneId.of(q.schedule.timezone)).toInstant().toEpochMilli())
        .any { it.reasonId == reason && it.endsAt > now }
    }
  }

  fun compile(value: QuestInstallation, now: Long): List<InterventionWindow> {
    validate(value)
    val first = LocalDate.parse(value.firstDate)
    val zone = ZoneId.of(value.schedule.timezone)
    val today = Instant.ofEpochMilli(now).atZone(zone).toLocalDate()
    val anchor = if (first > today) first.atStartOfDay(zone).toInstant().toEpochMilli() else now
    val schedule = value.schedule.copy(weekdays = when (value.repeat) {
      "daily" -> (0..6).toList()
      "none" -> listOf(first.dayOfWeek.value - 1)
      else -> value.schedule.weekdays
    })
    return WeeklySchedules.compile(schedule, anchor, value.apps).mapNotNull { window ->
      val day = Instant.ofEpochMilli(window.startsAt).atZone(zone).toLocalDate()
      if (day < first || (value.repeat == "none" && day != first) ||
          window.startsAt < value.effectiveFrom || (value.effectiveUntil != null && window.startsAt >= value.effectiveUntil) || window.endsAt <= now) null
      else window.copy(reasonId = reason(value.questId, value.revision, day))
    }
  }
  fun windows(plan: InterventionPlan, now: Long): List<InterventionWindow> = plan.quests.flatMap { compile(it, now) }
    .filter { it.reasonId !in plan.cancelledQuestReasons }.map { current ->
      // Active selections never change under a global selection or schedule update.
      plan.windows.find { it.reasonId == current.reasonId && it.startsAt == current.startsAt && now >= it.startsAt && now < it.endsAt }
        ?.let { current.copy(apps = it.apps) } ?: current
    }
}
