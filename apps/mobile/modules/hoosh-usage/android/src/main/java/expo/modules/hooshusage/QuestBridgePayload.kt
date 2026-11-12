package expo.modules.hooshusage

import org.json.JSONArray
import org.json.JSONObject

/** Nullable metadata crosses JSI as bounded JSON; native-only app identities never enter this payload. */
object QuestBridgePayload {
  fun decode(json: String): Map<String, Any?> {
    InterventionValidation.require(json.length <= 65536 && json.toByteArray(Charsets.UTF_8).size <= 65536)
    // Reject excessive nesting before JSONObject's recursive parser allocates it.
    var depth = 0; var quoted = false; var escaped = false
    json.forEach { char ->
      if (quoted) {
        if (escaped) escaped = false else if (char == '\\') escaped = true else if (char == '"') quoted = false
      } else when (char) {
        '"' -> quoted = true
        '{', '[' -> { depth++; InterventionValidation.require(depth <= 6) }
        '}', ']' -> { depth--; InterventionValidation.require(depth >= 0) }
      }
    }
    InterventionValidation.require(depth == 0 && !quoted)
    try {
      var remaining = 8192
      fun convert(value: Any?, depth: Int): Any? {
        InterventionValidation.require(depth <= 6 && --remaining >= 0)
        return when (value) {
          null, JSONObject.NULL -> null
          is JSONObject -> {
            InterventionValidation.require(value.length() <= 32)
            value.keys().asSequence().associateWith { key ->
              InterventionValidation.require(key.length <= 64)
              convert(value.get(key), depth + 1)
            }
          }
          is JSONArray -> {
            InterventionValidation.require(value.length() <= 512)
            (0 until value.length()).map { convert(value.get(it), depth + 1) }
          }
          is String -> { InterventionValidation.require(value.length <= 256); value }
          is Boolean, is Number -> value
          else -> throw InterventionFailure("ERR_INTERVENTION_INVALID")
        }
      }
      val root = JSONObject(json)
      return root.keys().asSequence().associateWith { key ->
        InterventionValidation.require(root.length() <= 32 && key.length <= 64)
        convert(root.get(key), 1)
      }
    } catch (error: Exception) {
      throw if (error is InterventionFailure) error else InterventionFailure("ERR_INTERVENTION_INVALID")
    }
  }
}
