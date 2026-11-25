import Foundation

/// Shared host/extension transaction boundary. An explicit allowance is persisted
/// before removing a shield. Failure leaves the charged desired state recoverable;
/// a retry within the same live grant cannot spend another allowance.
final class ProtectionRuntimeCoordinator {
  let store: SharedProtectionStore
  init(store: SharedProtectionStore) { self.store = store }

  func refresh(owner: ProtectionOwner, revision: Int, driver: ProtectionInstallationDriver) throws {
    guard driver.activationAvailable else { throw ProtectionTransactionError.activationGated }
    let state = try owned(owner, revision: revision)
    try store.update(expectedRevision: state.revision) { next in
      let index = try self.index(next, owner: owner, revision: revision)
      var record = next.owners[index]
      let previous = record.installation!
      let runtime = try driver.resolved(previous)
      guard ProtectionRuntimePlanner.sameIntent(previous, runtime) else { throw ProtectionTransactionError.invalid }
      try runtime.validated()
      var ledger = try record.sessionLedger ?? ProtectionSessionLedger(policy: runtime.policy)
      try ledger.updatePolicy(runtime.policy)
      try ledger.reconcile(revision: runtime.revision, remainingReasons: Set(runtime.activeSnapshots.map(\.reasonID)))
      try driver.preflight(runtime)
      if try !driver.matches(runtime, ledger: ledger) {
        try driver.install(runtime, replacing: previous, ledger: ledger)
      }
      guard try driver.matches(runtime, ledger: ledger) else { throw ProtectionTransactionError.unconfirmed }
      record.installation = runtime; record.sessionLedger = ledger
      record.coverage = "unknown"
      next.owners[index] = record
    }
  }

  func allow(owner: ProtectionOwner, revision: Int, driver: ProtectionInstallationDriver,
             clock: ProtectionClock, usageBased: Bool = false,
             applyGrant: ((ProtectionRuntimeRecord, ProtectionSessionLedger) throws -> Void)? = nil,
             context: (ProtectionRuntimeRecord, ProtectionSessionLedger) throws -> (Data, [ProtectionSessionReason])) throws {
    guard driver.activationAvailable else { throw ProtectionTransactionError.activationGated }
    try clock.validate()
    let state = try owned(owner, revision: revision)
    try store.update(expectedRevision: state.revision) { next in
      let index = try self.index(next, owner: owner, revision: revision)
      var record = next.owners[index]
      let previous = record.installation!
      let runtime = try driver.resolved(previous)
      guard ProtectionRuntimePlanner.sameIntent(previous, runtime) else { throw ProtectionTransactionError.invalid }
      try runtime.validated()
      var ledger = try record.sessionLedger ?? ProtectionSessionLedger(policy: runtime.policy)
      try ledger.updatePolicy(runtime.policy)
      try ledger.reconcile(revision: runtime.revision, remainingReasons: Set(runtime.activeSnapshots.map(\.reasonID)))
      let (app, reasons) = try context(runtime, ledger)
      guard !reasons.isEmpty, reasons.allSatisfy({ $0.startsAt <= clock.wall && clock.wall < $0.endsAt }) else {
        throw ProtectionTransactionError.invalid
      }
      if try !ledger.needed(app: app, revision: revision, reasons: reasons, clock: clock).isEmpty {
        let grant = try ledger.allow(app: app, revision: revision, reasons: reasons, clock: clock, usageBased: usageBased)
        var journal = record.rewardJournal ?? ProtectionRewardJournal(timezone: runtime.policy.timezoneId)
        try journal.append(grant: grant, revision: revision, clock: clock, timezone: runtime.policy.timezoneId)
        record.rewardJournal = journal
      }
      record.installation = runtime; record.sessionLedger = ledger
      record.coverage = "partial"
      next.owners[index] = record
    }
    if let applyGrant {
      try store.withSnapshot { latest in
        guard let latest else { throw ProtectionStoreError.staleLease }
        let index = try self.index(latest, owner: owner, revision: revision)
        let record = latest.owners[index]
        guard let runtime = record.installation, let ledger = record.sessionLedger else {
          throw ProtectionStoreError.staleLease
        }
        try applyGrant(runtime, ledger)
      }
    } else {
      try refresh(owner: owner, revision: revision, driver: driver)
    }
  }
  private func owned(_ owner: ProtectionOwner, revision: Int) throws -> ProtectionState {
    guard let state = try store.read() else { throw ProtectionStoreError.staleLease }
    _ = try index(state, owner: owner, revision: revision)
    return state
  }
  private func index(_ state: ProtectionState, owner: ProtectionOwner, revision: Int) throws -> Int {
    guard state.installedOwner == owner, state.pendingClaim == nil,
      let index = state.owners.firstIndex(where: { $0.owner == owner }),
      state.owners[index].pendingInstallation == nil,
      let runtime = state.owners[index].installation, runtime.enabled, runtime.revision == revision else {
      throw ProtectionStoreError.staleLease
    }
    return index
  }
}
