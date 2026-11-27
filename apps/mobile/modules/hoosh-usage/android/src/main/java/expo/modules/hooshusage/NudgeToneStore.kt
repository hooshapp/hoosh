package expo.modules.hooshusage

import android.content.Context
import java.security.MessageDigest

/** Owner-scoped, local copy preference; it never installs or resumes protection. */
class NudgeToneStore(context: Context) {
  private val prefs = context.getSharedPreferences("hoosh-nudge-tone-v1", Context.MODE_PRIVATE)
  private fun key(owner: String): String {
    InterventionValidation.owner(owner)
    return MessageDigest.getInstance("SHA-256").digest(owner.toByteArray()).joinToString("") { "%02x".format(it) }
  }
  fun set(owner: String, tone: String) {
    InterventionValidation.require(tone in setOf("Supportive", "Direct", "Playful", "Intense"))
    InterventionValidation.require(prefs.edit().putString(key(owner), tone).commit(), "ERR_INTERVENTION_STORAGE")
  }
  fun setShieldContext(owner: String, name: String, activity: String) {
    val ownerKey = key(owner)
    val displayName = name.filterNot { it.isISOControl() }.trim().take(40)
    val custom = activity.takeIf { it.startsWith("custom:") }?.removePrefix("custom:")
      ?.filterNot { it.isISOControl() || it == '\u2028' || it == '\u2029' }?.trim()?.take(48).orEmpty()
    val savedActivity = if (activity in activities) activity else if (custom.isNotEmpty()) "custom:$custom" else ""
    InterventionValidation.require(prefs.edit().putString("$ownerKey.name", displayName)
      .putString("$ownerKey.activity", savedActivity).commit(), "ERR_INTERVENTION_STORAGE")
  }
  fun shieldContext(owner: String): Pair<String, String> {
    val ownerKey = key(owner)
    val activity = prefs.getString("$ownerKey.activity", "").orEmpty()
    val goal = activities[activity] ?: activity.takeIf { it.startsWith("custom:") }?.removePrefix("custom:").orEmpty()
    return prefs.getString("$ownerKey.name", "").orEmpty() to goal
  }
  fun googleCalendarEnabled(owner: String): Boolean = prefs.getBoolean("${key(owner)}.googleCalendar", false)
  fun setGoogleCalendar(owner: String, enabled: Boolean) {
    InterventionValidation.require(prefs.edit().putBoolean("${key(owner)}.googleCalendar", enabled)
      .commit(), "ERR_INTERVENTION_STORAGE")
  }
  fun erase(owner: String) {
    val ownerKey = key(owner)
    InterventionValidation.require(prefs.edit().remove(ownerKey).remove("$ownerKey.name")
      .remove("$ownerKey.activity").remove("$ownerKey.googleCalendar").commit(), "ERR_INTERVENTION_STORAGE")
  }
  fun line(owner: String, goal: String, quarter: Int): String {
    val lines = when (prefs.getString(key(owner), "Supportive")) {
      "Direct" -> listOf("Pick one next step for $goal.", "Put the phone down and make time for $goal.", "Start with one small step toward $goal.")
      "Playful" -> listOf("Give $goal the next spot in your lineup.", "Plot twist: $goal gets a turn.", "Let the feed wait. Make time for $goal.")
      "Intense" -> listOf("Protect the time you set aside for $goal.", "Choose $goal. Put the phone down and follow through.", "Take the first step toward $goal now.")
      else -> listOf("Think of one small way to make time for $goal.", "Take a breath and give yourself a little time for $goal.", "Ready for $goal? A small start is enough.")
    }
    return lines[(quarter - 1).coerceIn(0, lines.lastIndex)]
  }
  private val activities = mapOf("reading" to "reading", "gym" to "the gym", "arts_and_crafts" to "arts and crafts",
    "walking" to "a walk", "music" to "music", "cooking" to "cooking")
}
