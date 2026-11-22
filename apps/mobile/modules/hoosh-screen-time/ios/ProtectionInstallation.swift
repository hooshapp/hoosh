import Foundation

enum InstallationError: Error { case confirmationRequired, changed, stopUnverified }

/// Same store/lock used by extensions. A durable pending claim fences callbacks
/// before Stop. A failed or interrupted Stop keeps the previous attribution.
final class ProtectionInstallation {
  private let store: SharedProtectionStore
  private let leases: ProtectionOwnerLeases
  init(store: SharedProtectionStore, leases: ProtectionOwnerLeases) {
    self.store = store; self.leases = leases
  }
  func read(owner: ProtectionOwner, token: UUID, legacyPresent: () throws -> Bool) throws -> [String: String] {
    try leases.withLease(owner, token: token) {
      let state = try store.read()
      let legacy = try legacyPresent() && state?.legacyStopped != true
      let status = state?.pendingClaim != nil ? "claim_pending"
        : legacy ? "legacy_review"
        : state?.installedOwner == nil ? "unclaimed"
        : state?.installedOwner == owner
          ? (state?.owners.first(where: { $0.owner == owner })?.pendingInstallation != nil ? "installation_pending" : "owned")
          : "other_owner"
      // No other owner's ID, selection, plan or events leave this boundary.
      return ["status": status, "revision": state.map { String($0.revision) } ?? "missing"]
    }
  }
  func claim(owner: ProtectionOwner, token: UUID, revision: String, confirmed: Bool,
             stopAndVerify: () throws -> Void) throws {
    guard confirmed else { throw InstallationError.confirmationRequired }
    try leases.withLease(owner, token: token) {
      let prior = try store.read()
      guard revision == (prior.map { String($0.revision) } ?? "missing") else { throw InstallationError.changed }
      let pending = try store.update(expectedRevision: prior?.revision) { state in
        // Capacity is checked before affecting device restrictions.
        guard state.owners.contains(where: { $0.owner == owner }) || state.owners.count < 16 else {
          throw ProtectionStoreError.oversized
        }
        state.pendingClaim = ProtectionClaim(id: UUID(), previousOwner: state.installedOwner, nextOwner: owner)
      }
      try store.update(expectedRevision: pending.revision) { state in
        guard state.pendingClaim?.nextOwner == owner else { throw InstallationError.changed }
        // Still holding the cross-process lock: a late extension cannot reapply
        // old rules between Stop/readback and the final owner commit.
        try stopAndVerify()
        state.legacyStopped = true
        if let old = state.installedOwner,
           let index = state.owners.firstIndex(where: { $0.owner == old }) {
          state.owners[index].reasons = []
          state.owners[index].allowances = []
          state.owners[index].pendingInstallation = nil
          if var installed = state.owners[index].installation {
            if installed.revision < 2147483647 { installed.revision += 1 }
            installed.enabled = false
            installed.weeklyEnabled = false
            installed.quests = installed.quests.map { quest in
              ProtectionQuestRecord(questID: quest.questID, remoteRevision: quest.remoteRevision,
                enabled: false, versions: [], cancelled: quest.cancelled, selection: quest.selection, requestID: quest.requestID)
            }
            installed.activeSnapshots = []
            installed.monitors = []
            state.owners[index].installation = installed
            try state.owners[index].sessionLedger?.reconcile(revision: installed.revision, remainingReasons: [])
          }
          state.owners[index].coverage = "unavailable"
        }
        if !state.owners.contains(where: { $0.owner == owner }) {
          state.owners.append(ProtectionOwnerRecord(owner: owner))
        }
        state.installedOwner = owner
        state.pendingClaim = nil
      }
    }
  }
}
