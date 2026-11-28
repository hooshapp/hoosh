package expo.modules.hooshusage

import java.util.UUID

/** Lifetime handles fence stale bridge writes; handles/storage owner keys are not authentication. */
class InterventionLeases {
  private data class Lease(val bridge: String, val owner: String)
  data class ShieldCopy(val name: String, val activity: String)
  private data class CopyLease(val scope: Lease, val copy: ShieldCopy)
  private var shieldCopy: CopyLease? = null
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
  @Synchronized fun retainForClaim(owner: String, token: String) {
    check(owner, token)
    leases.entries.removeAll { it.key != token }
  }
  @Synchronized fun setShieldCopy(bridge: String, owner: String, name: String, activity: String) {
    InterventionValidation.owner(owner)
    InterventionValidation.require(bridge in bridges && owner !in erasing, "ERR_INTERVENTION_LEASE_EXPIRED")
    shieldCopy = CopyLease(Lease(bridge, owner), ShieldCopy(name.filterNot { it.isISOControl() }.trim().take(40), activity))
  }
  @Synchronized fun shieldCopy(owner: String): ShieldCopy? =
    shieldCopy?.takeIf { it.scope.owner == owner }?.copy
  @Synchronized fun end(owner: String, erase: Boolean) {
    InterventionValidation.owner(owner)
    InterventionValidation.require(erase || owner !in erasing, "ERR_INTERVENTION_CLEANUP_PENDING")
    if (shieldCopy?.scope?.owner == owner) shieldCopy = null
    leases.entries.removeAll { it.value.owner == owner }; if (erase) erasing.add(owner)
  }
  @Synchronized fun erased(owner: String) { erasing.remove(owner) }
  @Synchronized fun close(bridge: String) {
    if (shieldCopy?.scope?.bridge == bridge) shieldCopy = null
    bridges.remove(bridge)
    leases.entries.removeAll { it.value.bridge == bridge }
  }
}
