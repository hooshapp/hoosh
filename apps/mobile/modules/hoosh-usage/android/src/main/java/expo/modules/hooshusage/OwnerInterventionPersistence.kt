package expo.modules.hooshusage

import java.io.File
import java.security.MessageDigest
import java.util.UUID

/** One active device owner. Stopped account records retain private allowance history separately. */
class OwnerInterventionPersistence(private val directory: File) : InterventionPersistence {
  private val active = AtomicInterventionPersistence(File(directory, "intervention-debug-v1/state.json"))
  override fun read() = active.read()
  override fun write(value: InterventionRecord) = active.write(value)
  override fun erase() = active.erase()
  fun eraseOwner(owner: String) {
    InterventionValidation.owner(owner)
    if (active.read()?.plan?.owner == owner) active.erase()
    archive(owner).erase()
  }
  private fun archive(owner: String): AtomicInterventionPersistence {
    InterventionValidation.owner(owner)
    val key = MessageDigest.getInstance("SHA-256").digest(owner.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it.toInt() and 255) }
    return AtomicInterventionPersistence(File(directory, "intervention-accounts-v1/$key.json"))
  }
  private fun stopped(value: InterventionRecord, now: Long): InterventionRecord {
    InterventionValidation.require(value.plan.revision < Int.MAX_VALUE, "ERR_INTERVENTION_LIMIT")
    val plan = value.plan.copy(revision = value.plan.revision + 1, windows = emptyList(), weekly = value.plan.weekly?.copy(enabled = false),
      quests = emptyList(), questReceipts = value.plan.questReceipts.mapValues { (_, r) -> r.copy(enabled = false) }, cancelledQuestReasons = emptySet())
    val events = value.events + InterventionEvent(UUID.randomUUID().toString(), now, "rule_deactivated", null, plan.revision)
    val dropped = maxOf(0, events.size - 256)
    return value.copy(plan = plan, allowances = emptyList(), events = events.takeLast(256),
      discardedEventCount = minOf(Int.MAX_VALUE.toLong(), value.discardedEventCount.toLong() + dropped).toInt())
  }
  /** Explicit confirmed device action only; never called by reads, login, token rotation or sign-out. */
  fun claim(owner: String, stopPrevious: Boolean, now: Long) {
    InterventionValidation.owner(owner)
    val previous = active.read()
    if (previous?.plan?.owner == owner) return
    InterventionValidation.require(previous == null || stopPrevious, "ERR_INTERVENTION_OTHER_ACCOUNT")
    // Validate target history before changing the active file. Archives never automatically resume rules.
    val returning = archive(owner).read()?.also { InterventionValidation.require(it.plan.owner == owner, "ERR_INTERVENTION_STORAGE") }
    val restored = returning?.let { stopped(it, now) }
    if (previous != null) archive(previous.plan.owner).write(stopped(previous, now))
    // Each operation is atomic; a failed active write leaves the old active file intact.
    // The durable old archive also covers a crash after successful empty-owner erasure.
    if (restored == null) active.erase() else active.write(restored)
  }
}
