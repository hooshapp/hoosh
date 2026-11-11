package expo.modules.hooshusage

import java.util.UUID

/** Lifetime handles fence stale bridge writes; handles/storage owner keys are not authentication. */
class InterventionLeases {
  private data class Lease(val bridge: String, val owner: String)
  private val bridges = mutableSetOf<String>()
  private val leases = mutableMapOf<String, Lease>()
  private val erasing = mutableSetOf<String>()
  @Synchronized fun bridge(): String = UUID.randomUUID().toString().also { bridges.add(it) }
  @Synchronized fun isOpen(bridge: String): Boolean = bridge in bridges
  @Synchronized fun open(bridge: String, owner: String): String {
    InterventionValidation.owner(owner)
    InterventionValidation.require(bridge in bridges && owner !in erasing, "ERR_INTERVENTION_LEASE_EXPIRED")
    InterventionValidation.require(leases.size < 8, "ERR_INTERVENTION_BUSY")
    return UUID.randomUUID().toString().also { leases[it] = Lease(bridge, owner) }
  }
  @Synchronized fun check(owner: String, token: String) {
    InterventionValidation.owner(owner)
    InterventionValidation.require(leases[token]?.let { it.owner == owner && it.bridge in bridges } == true, "ERR_INTERVENTION_LEASE_EXPIRED")
  }
  @Synchronized fun release(owner: String, token: String) { if (leases[token]?.owner == owner) leases.remove(token) }
  @Synchronized fun end(owner: String, erase: Boolean) {
    InterventionValidation.owner(owner)
    InterventionValidation.require(erase || owner !in erasing, "ERR_INTERVENTION_CLEANUP_PENDING")
    leases.entries.removeAll { it.value.owner == owner }; if (erase) erasing.add(owner)
  }
  @Synchronized fun erased(owner: String) { erasing.remove(owner) }
  @Synchronized fun close(bridge: String) { bridges.remove(bridge); leases.entries.removeAll { it.value.bridge == bridge } }
}
