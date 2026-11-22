import Foundation
import CryptoKit

enum ProtectionTransactionError: Error {
  case activationGated, conflict, requestMismatch, recoveryRequired, unconfirmed, invalid
}
struct ProtectionQuestRecord: Codable, Equatable {
  let questID: UUID
  let remoteRevision: Int
  let enabled: Bool
  let versions: [QuestProtectionVersion]
  let cancelled: [String]
  let selection: ProtectionSelection
  var requestID: UUID? = nil
}
struct ProtectionMonitorBinding: Codable, Equatable {
  let name: String
  let reasonID: String
}
/// Native-only installed configuration. Do not serialize this record to JS.
/// Definitions recur independently of a bounded preview; snapshots are active app
/// snapshots, not the complete recurrence horizon.
struct ProtectionRuntimeRecord: Codable, Equatable {
  var revision: Int
  var enabled: Bool
  var selectionRevision: UInt64
  var policy: ProtectionSessionPolicy
  var weekly: WeeklyProtectionSpec?
  var weeklySelection: ProtectionSelection?
  var quests: [ProtectionQuestRecord]
  var weeklyEnabled: Bool? = nil
  var weeklyIsEnabled: Bool { enabled && weekly != nil && (weeklyEnabled ?? enabled) }
  var activeSnapshots: [ProtectionOccurrence]
  var monitors: [ProtectionMonitorBinding]
  func validated() throws {
    try policy.validate()
    guard (1...2147483647).contains(revision), (1...2147483647).contains(selectionRevision),
          quests.count <= 128, activeSnapshots.count <= 512, monitors.count <= 512,
          Set(quests.map(\.questID)).count == quests.count,
          Set(activeSnapshots.map(\.reasonID)).count == activeSnapshots.count,
          Set(monitors.map(\.name)).count == monitors.count,
          (weekly == nil) == (weeklySelection == nil),
          enabled || (monitors.isEmpty && activeSnapshots.isEmpty) else { throw ProtectionTransactionError.invalid }
    guard weeklyEnabled != true || weekly != nil else { throw ProtectionTransactionError.invalid }
    if let weekly {
      try weekly.validate()
      guard weekly.timezone_id == policy.timezoneId, weekly.session_count == policy.sessionsPerDay,
            weekly.session_minutes * 60 == policy.sessionSeconds else { throw ProtectionTransactionError.invalid }
    }
    guard !enabled || weekly != nil || quests.contains(where: { $0.enabled }) else { throw ProtectionTransactionError.invalid }
    if let selection = weeklySelection { try validate(selection) }
    for quest in quests {
      guard (1...2147483647).contains(quest.remoteRevision), quest.versions.count <= 32,
            quest.enabled || quest.versions.isEmpty, quest.cancelled.count <= 256,
            Set(quest.versions.map(\.revision)).count == quest.versions.count,
            Set(quest.cancelled).count == quest.cancelled.count else { throw ProtectionTransactionError.invalid }
      try validate(quest.selection)
      let prefix = "q_\(quest.questID.uuidString.lowercased().replacingOccurrences(of: "-", with: ""))_"
      guard quest.cancelled.allSatisfy({ $0.hasPrefix(prefix) && $0.range(of: "^q_[0-9a-f]{32}_v[1-9][0-9]{0,9}_d[0-9]{8}$", options: .regularExpression) != nil }) else { throw ProtectionTransactionError.invalid }
      for version in quest.versions {
        try version.validate()
        guard version.revision <= quest.remoteRevision else { throw ProtectionTransactionError.invalid }
      }
    }
    var snapshotBytes = 0
    for window in activeSnapshots {
      guard window.reasonID.range(of: "^[a-z0-9_-]{1,64}$", options: .regularExpression) != nil,
            window.startsAt >= 0, window.endsAt > window.startsAt,
            window.endsAt - window.startsAt <= 172800000 else { throw ProtectionTransactionError.invalid }
      try validate(ProtectionSelection(revision: window.selectionRevision, encodedTokens: window.selection))
      snapshotBytes += window.selection.count
    }
    snapshotBytes += weeklySelection?.encodedTokens.count ?? 0
    snapshotBytes += quests.reduce(0) { $0 + $1.selection.encodedTokens.count }
    guard snapshotBytes <= 1048576 else { throw ProtectionStoreError.oversized }
    guard monitors.allSatisfy({ $0.name.hasPrefix("hoosh.shared.") && $0.name.utf8.count <= 256 &&
      $0.reasonID.range(of: "^[a-z0-9_-]{1,64}$", options: .regularExpression) != nil }) else { throw ProtectionTransactionError.invalid }
  }
  private func validate(_ selection: ProtectionSelection) throws {
    guard selection.revision > 0, selection.revision <= selectionRevision,
          !selection.encodedTokens.isEmpty, selection.encodedTokens.count <= 262144 else { throw ProtectionTransactionError.invalid }
  }
}
struct ProtectionPendingInstallation: Codable, Equatable {
  let requestID: UUID
  let fingerprint: Data
  let target: ProtectionRuntimeRecord
}
/// The real iOS adapter must prove capabilities, preflight capacity/permission,
/// reconcile stable monitor names, and verify SDK state. The native checkpoint
/// remains activation-gated until callbacks and physical acceptance are complete.
protocol ProtectionInstallationDriver {
  var activationAvailable: Bool { get }
  func resolved(_ target: ProtectionRuntimeRecord) throws -> ProtectionRuntimeRecord
  func preflight(_ target: ProtectionRuntimeRecord) throws
  func matches(_ target: ProtectionRuntimeRecord, ledger: ProtectionSessionLedger?) throws -> Bool
  func install(_ target: ProtectionRuntimeRecord, replacing previous: ProtectionRuntimeRecord?, ledger: ProtectionSessionLedger?) throws
}

extension ProtectionInstallationDriver {
  func resolved(_ target: ProtectionRuntimeRecord) throws -> ProtectionRuntimeRecord { target }
}

struct ProtectionTransactionStatus {
  let phase: String
  let installedRevision: Int?
  let pendingRequestID: UUID?
  let activationAvailable: Bool
}

/// One owner store and lock. A pending intent is durable before any OS mutation.
/// A lost write acknowledgment is recovered using the original request ID; neither
/// retries nor reads manufacture installation success or reset session history.
final class ProtectionTransactions {
  private let store: SharedProtectionStore
  private let leases: ProtectionOwnerLeases
  init(store: SharedProtectionStore, leases: ProtectionOwnerLeases) { self.store = store; self.leases = leases }
  func status(owner: ProtectionOwner, token: UUID, driver: ProtectionInstallationDriver) throws -> ProtectionTransactionStatus {
    try leases.withLease(owner, token: token) {
      let record = try owned(owner).owners.first(where: { $0.owner == owner })!
      let phase: String
      if record.pendingInstallation != nil { phase = "pending" }
      else if !driver.activationAvailable { phase = "gated" }
      else if let installed = record.installation {
        do { phase = try driver.matches(installed, ledger: record.sessionLedger) ? "verified" : "degraded" }
        catch { phase = "degraded" }
      } else { phase = "unconfigured" }
      return ProtectionTransactionStatus(phase: phase, installedRevision: record.installation?.revision,
        pendingRequestID: record.pendingInstallation?.requestID, activationAvailable: driver.activationAvailable)
    }
  }
  func apply(owner: ProtectionOwner, token: UUID, requestID: UUID, expected: Int, selectionRevision: UInt64,
             canonicalCommand: Data, driver: ProtectionInstallationDriver,
             build: (ProtectionRuntimeRecord?, ProtectionSelection) throws -> ProtectionRuntimeRecord) throws -> ProtectionRuntimeRecord {
    guard driver.activationAvailable else { throw ProtectionTransactionError.activationGated }
    guard expected >= 0, expected < 2147483647, !canonicalCommand.isEmpty, canonicalCommand.count <= 65536 else { throw ProtectionTransactionError.invalid }
    var fingerprintInput = Data("v1:\(expected):\(selectionRevision):".utf8)
    fingerprintInput.append(canonicalCommand)
    let fingerprint = Data(SHA256.hash(data: fingerprintInput))
    return try leases.withLease(owner, token: token) {
      let state = try owned(owner)
      let index = state.owners.firstIndex(where: { $0.owner == owner })!
      let record = state.owners[index]
      if let receipt = record.receipts.first(where: { $0.requestID == requestID }) {
        guard receipt.fingerprint == fingerprint, let installed = record.installation else { throw ProtectionTransactionError.requestMismatch }
        guard record.pendingInstallation == nil else { throw ProtectionTransactionError.recoveryRequired }
        guard try driver.matches(installed, ledger: record.sessionLedger) else { throw ProtectionTransactionError.unconfirmed }
        return installed // Actual current state; never an old fabricated acknowledgment.
      }
      if let pending = record.pendingInstallation {
        guard pending.requestID == requestID, pending.fingerprint == fingerprint else { throw ProtectionTransactionError.recoveryRequired }
        return try execute(owner, pending: pending, driver: driver)
      }
      guard (record.installation?.revision ?? 0) == expected,
            let selection = record.selection, selection.revision == selectionRevision,
            record.receipts.count < 512 else { throw ProtectionTransactionError.conflict }
      let intent = try build(record.installation, selection)
      let target = try driver.resolved(intent)
      guard ProtectionRuntimePlanner.sameIntent(intent, target) else { throw ProtectionTransactionError.invalid }
      try target.validated()
      guard target.revision == expected + 1, target.selectionRevision == selectionRevision else { throw ProtectionTransactionError.invalid }
      try validatePolicy(target.policy, ledger: record.sessionLedger)
      try driver.preflight(target)
      let pending = ProtectionPendingInstallation(requestID: requestID, fingerprint: fingerprint, target: target)
      try store.update(expectedRevision: state.revision) { next in
        next.owners[index].pendingInstallation = pending
        next.owners[index].coverage = "partial"
      }
      return try execute(owner, pending: pending, driver: driver)
    }
  }
  func recover(owner: ProtectionOwner, token: UUID, requestID: UUID, driver: ProtectionInstallationDriver) throws -> ProtectionRuntimeRecord {
    guard driver.activationAvailable else { throw ProtectionTransactionError.activationGated }
    return try leases.withLease(owner, token: token) {
      let state = try owned(owner)
      let record = state.owners.first(where: { $0.owner == owner })!
      guard let pending = record.pendingInstallation, pending.requestID == requestID else { throw ProtectionTransactionError.recoveryRequired }
      return try execute(owner, pending: pending, driver: driver)
    }
  }
  private func execute(_ owner: ProtectionOwner, pending: ProtectionPendingInstallation,
                       driver: ProtectionInstallationDriver) throws -> ProtectionRuntimeRecord {
    let state = try owned(owner)
    let index = state.owners.firstIndex(where: { $0.owner == owner })!
    guard state.owners[index].pendingInstallation == pending else { throw ProtectionTransactionError.conflict }
    let written = try store.update(expectedRevision: state.revision) { next in
      var record = next.owners[index]
      guard record.pendingInstallation == pending else { throw ProtectionTransactionError.conflict }
      guard record.receipts.count < 512 else { throw ProtectionStoreError.oversized }
      let effective = try driver.resolved(pending.target)
      guard ProtectionRuntimePlanner.sameIntent(effective, pending.target) else { throw ProtectionTransactionError.invalid }
      try effective.validated()
      // Resolve policy against the latest ledger before touching SDK state.
      var ledger = try record.sessionLedger ?? ProtectionSessionLedger(policy: effective.policy)
      try ledger.updatePolicy(effective.policy)
      try ledger.reconcile(revision: effective.revision,
        remainingReasons: Set(effective.activeSnapshots.map(\.reasonID)))
      try driver.preflight(effective)
      if try !driver.matches(effective, ledger: ledger) {
        try driver.install(effective, replacing: record.installation, ledger: ledger)
      }
      guard try driver.matches(effective, ledger: ledger) else { throw ProtectionTransactionError.unconfirmed }
      record.installation = effective
      record.sessionLedger = ledger
      record.pendingInstallation = nil
      record.receipts.append(ProtectionReceipt(requestID: pending.requestID,
        revision: UInt64(pending.target.revision), cancelled: !pending.target.enabled, fingerprint: pending.fingerprint))
      record.coverage = "unknown" // Registration readback is not measurement coverage.
      next.owners[index] = record
    }
    guard let installed = written.owners[index].installation else { throw ProtectionTransactionError.unconfirmed }
    return installed
  }
  private func owned(_ owner: ProtectionOwner) throws -> ProtectionState {
    guard let state = try store.read(), state.installedOwner == owner, state.pendingClaim == nil,
          state.owners.contains(where: { $0.owner == owner }) else { throw ProtectionStoreError.staleLease }
    return state
  }
  private func validatePolicy(_ policy: ProtectionSessionPolicy, ledger: ProtectionSessionLedger?) throws {
    var copy = try ledger ?? ProtectionSessionLedger(policy: policy)
    try copy.updatePolicy(policy)
  }
}
