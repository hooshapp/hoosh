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
    InterventionValidation.require(prefs.edit().putString("$ownerKey.name", displayName)
      .putString("$ownerKey.activity", activity.takeIf { it in activities }.orEmpty()).commit(), "ERR_INTERVENTION_STORAGE")
  }
  fun shieldContext(owner: String): Pair<String, String> {
    val ownerKey = key(owner)
    return prefs.getString("$ownerKey.name", "").orEmpty() to
      activities[prefs.getString("$ownerKey.activity", "")].orEmpty()
  }
  fun erase(owner: String) {
    val ownerKey = key(owner)
    InterventionValidation.require(prefs.edit().remove(ownerKey).remove("$ownerKey.name")
      .remove("$ownerKey.activity").commit(), "ERR_INTERVENTION_STORAGE")
  }
  fun line(owner: String, goal: String): String = when (prefs.getString(key(owner), "Supportive")) {
    "Direct" -> "Pause now and make time for $goal."
    "Playful" -> "Plot twist: it’s time for $goal."
    "Intense" -> "Protect the time you chose for $goal."
    else -> "Take a little time for $goal."
  }
  private val activities = mapOf("reading" to "reading", "gym" to "the gym", "arts_and_crafts" to "arts and crafts",
    "walking" to "a walk", "music" to "music", "cooking" to "cooking")
}
