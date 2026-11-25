package expo.modules.hooshusage

/** Finite windows plus an optional explicitly applied weekly plan; quest/reward policies are separate. All identities remain native. */
data class InterventionWindow(val reasonId: String, val startsAt: Long, val endsAt: Long, val apps: Set<String> = emptySet())
data class AppAllowance(val app: String, val reasonId: String, val revision: Int, val wallEnd: Long, val elapsedEnd: Long, val boot: Int)
data class SessionPolicy(val timezoneId: String, val sessionsPerDay: Int, val sessionSeconds: Int, val sharedBudget: Boolean = false)
data class AppSession(val app: String, val wallEnd: Long, val elapsedEnd: Long, val boot: Int, val seconds: Int, val id: String = java.util.UUID.randomUUID().toString(), val nudged: Boolean = false, val remainingMs: Long? = null, val runningSince: Long? = null, val usageGroup: String? = null, val nudgeQuarter: Int = 0)
data class DailySessions(val app: String, val day: String, val count: Int)
data class InterventionEvent(val id: String, val at: Long, val kind: String, val reasonId: String?, val revision: Int, val sessionIndex: Int? = null, val exhausted: Boolean? = null)
data class QuestReceipt(val revision: Int, val requestId: String, val enabled: Boolean)
data class InterventionPlan(val owner: String, val revision: Int, val selectionRevision: Int, val apps: Set<String>, val windows: List<InterventionWindow>, val policy: SessionPolicy, val weekly: WeeklyInstallation? = null, val quests: List<QuestInstallation> = emptyList(), val questReceipts: Map<String, QuestReceipt> = emptyMap(), val cancelledQuestReasons: Set<String> = emptySet())
data class InterventionRecord(val plan: InterventionPlan, val allowances: List<AppAllowance> = emptyList(), val events: List<InterventionEvent> = emptyList(), val sessions: List<AppSession> = emptyList(), val daily: List<DailySessions> = emptyList(), val discardedEventCount: Int = 0, val rewards: RewardState = RewardState())
class InterventionFailure(val code: String) : RuntimeException(code)
interface InterventionPersistence {
  fun read(): InterventionRecord?
  /** Account reads must not mistake archived history for a brand-new installation. */
  fun readForOwner(owner: String): InterventionRecord? = read()
  fun write(value: InterventionRecord)
  fun erase()
}
object InterventionValidation {
  fun require(value: Boolean, code: String = "ERR_INTERVENTION_INVALID") { if (!value) throw InterventionFailure(code) }
  fun owner(value: String) {
    try { SelectionDrafts.validateOwner(value) } catch (_: Exception) { throw InterventionFailure("ERR_INTERVENTION_OWNER") }
  }
  fun policy(value: SessionPolicy) {
    require(value.timezoneId in java.util.TimeZone.getAvailableIDs().toSet())
    require(value.sessionsPerDay in 1..1000 && value.sessionSeconds in 1..86400)
  }
  fun windows(values: List<InterventionWindow>, limit: Int = 32) {
    require(values.size <= limit && values.map { it.reasonId }.toSet().size == values.size)
    values.forEach {
      require(it.reasonId.matches(Regex("[a-z0-9_-]{1,64}")))
      require(it.startsAt >= 0 && it.endsAt > it.startsAt && it.endsAt <= 8640000000000000L)
      require(it.endsAt - it.startsAt <= 7 * 86400000L)
    }
  }
}
