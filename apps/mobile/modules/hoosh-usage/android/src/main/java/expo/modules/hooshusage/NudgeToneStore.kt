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
  fun line(owner: String): String = when (prefs.getString(key(owner), "Supportive")) {
    "Direct" -> "Pause now. Choose what you want to do next."
    "Playful" -> "Plot twist: your next chapter is off the feed."
    "Intense" -> "Protect the time you chose. Make your next move intentional."
    else -> "A small pause can make room for what matters to you."
  }
}
