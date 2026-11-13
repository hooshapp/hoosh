package expo.modules.hooshusage

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID
import java.util.Calendar

/** Business evidence is independent from the lossy diagnostic journal. No app IDs on the wire. */
data class RewardSignal(val id: String, val sequence: Long, val at: Long, val kind: String,
  val day: String, val encounter: String? = null, val context: String? = null,
  val exhausted: Boolean? = null, val covered: Boolean? = null)
data class RewardState(val installation: String = UUID.randomUUID().toString(), val next: Long = 1,
  val discarded: Long = 0, val events: List<RewardSignal> = emptyList(), val day: String? = null,
  val wall: Long = 0, val elapsed: Long = 0, val boot: Int = -1,
  val covered: Boolean = false, val exhausted: Boolean = false)

object RewardSignals {
  fun day(wall: Long, zone: String) = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
    timeZone = TimeZone.getTimeZone(zone)
  }.format(Date(wall))
  fun yesterday(wall: Long, zone: String): String {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone(zone)).apply { timeInMillis = wall; add(Calendar.DAY_OF_MONTH, -1) }
    return day(calendar.timeInMillis, zone)
  }
  fun append(state: RewardState, wall: Long, kind: String, day: String, encounter: String? = null,
    context: String? = null, exhausted: Boolean? = null, covered: Boolean? = null): RewardState {
    InterventionValidation.require(state.next in 1..9007199254740990L, "ERR_REWARD_LIMIT")
    val event = RewardSignal(UUID.randomUUID().toString(), state.next, maxOf(wall, state.events.lastOrNull()?.at ?: 0), kind, day, encounter, context, exhausted, covered)
    val all = state.events + event
    val dropped = maxOf(0, all.size - 256)
    return state.copy(next = state.next + 1, discarded = state.discarded + dropped, events = all.takeLast(256))
  }
  fun pulse(state: RewardState, wall: Long, elapsed: Long, boot: Int, zone: String, continuityWitness: Boolean = false): RewardState {
    if (state.wall > 0 && wall >= state.wall && wall - state.wall < 60000 && boot == state.boot) return state
    val today = day(wall, zone)
    val continuous = state.wall > 0 && boot == state.boot && wall >= state.wall && elapsed >= state.elapsed &&
      kotlin.math.abs((wall - state.wall) - (elapsed - state.elapsed)) <= 5000 &&
      (continuityWitness || (wall - state.wall <= 120000 && elapsed - state.elapsed <= 120000))
    var value = state
    if (state.day != null && state.day != today) {
      val prior = yesterday(wall, zone)
      value = append(state, wall, "day_closed", prior, exhausted = if (state.day == prior) state.exhausted else false,
        covered = continuous && state.day == prior && state.covered)
    }
    return value.copy(day = today, wall = wall, elapsed = elapsed, boot = boot,
      covered = if (state.day == today) state.covered && continuous else continuous && state.day == yesterday(wall, zone),
      exhausted = if (state.day == today) state.exhausted else false)
  }
}
