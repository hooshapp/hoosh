#if os(iOS)
import Foundation
import FamilyControls
import ManagedSettings

/// Gated schedule/shield/expiry driver. Caller holds the shared store lock and
/// supplies its latest ledger. Physical timing acceptance is still outstanding.
final class ProtectionNativeDriver: ProtectionInstallationDriver {
  let owner: ProtectionOwner
  init(owner: ProtectionOwner) { self.owner = owner }
  var activationAvailable: Bool { ProtectionActivationGate.enabled }
  func resolved(_ target: ProtectionRuntimeRecord) throws -> ProtectionRuntimeRecord {
    let now = target.enabled ? try ProtectionDeviceClock.sample().wall : 0
    return try ProtectionRuntimePlanner.resolve(target, owner: owner, now: now).runtime
  }
  func preflight(_ target: ProtectionRuntimeRecord) throws {
    try requireActivation()
    try target.validated()
    let now = try ProtectionDeviceClock.sample().wall
    let plan = try ProtectionRuntimePlanner.resolve(target, owner: owner, now: now)
    guard plan.runtime.monitors == target.monitors else { throw ProtectionTransactionError.unconfirmed }
    for monitor in sdkMonitors(plan) { _ = try monitor.schedule() }
    for snapshot in plan.runtime.activeSnapshots { _ = try Self.apps(snapshot.selection) }
  }
  func matches(_ target: ProtectionRuntimeRecord, ledger: ProtectionSessionLedger?) throws -> Bool {
    guard activationAvailable, AuthorizationCenter.shared.authorizationStatus == .approved else { return false }
    let clock = try ProtectionDeviceClock.sample()
    let plan = try ProtectionRuntimePlanner.resolve(target, owner: owner, now: clock.wall)
    guard plan.runtime.monitors == target.monitors, plan.runtime.activeSnapshots == target.activeSnapshots else { return false }
    let monitors = try sdkMonitors(plan, ledger: ledger, clock: clock)
    guard ProtectionOSAdapter.monitorNames(prefix: ProtectionRuntimePlanner.prefix(owner)) == Set(monitors.map(\.name)) else { return false }
    for monitor in monitors { guard try ProtectionOSAdapter.matches(monitor) else { return false } }
    return ProtectionOSAdapter.matchesBlockedApps(try Self.blocked(plan.runtime, ledger: ledger, clock: clock))
  }
  func install(_ target: ProtectionRuntimeRecord, replacing previous: ProtectionRuntimeRecord?, ledger: ProtectionSessionLedger?) throws {
    try preflight(target)
    let clock = try ProtectionDeviceClock.sample()
    let plan = try ProtectionRuntimePlanner.resolve(target, owner: owner, now: clock.wall)
    guard plan.runtime.monitors == target.monitors, plan.runtime.activeSnapshots == target.activeSnapshots else { throw ProtectionTransactionError.unconfirmed }
    let monitors = try sdkMonitors(plan, ledger: ledger, clock: clock)
    // Preserve the confirmed generation while staging the candidate. Unconfirmed
    // attempts under this same owner namespace are retired after exact readback.
    try ProtectionOSAdapter.stage(monitors, preserving: Set(previous?.monitors.map(\.name) ?? []))
    try ProtectionOSAdapter.writeBlockedApps(try Self.blocked(plan.runtime, ledger: ledger, clock: clock))
    let stale = ProtectionOSAdapter.monitorNames(prefix: ProtectionRuntimePlanner.prefix(owner)).subtracting(Set(monitors.map(\.name)))
    try ProtectionOSAdapter.retire(stale)
    guard try matches(target, ledger: ledger) else { throw ProtectionTransactionError.unconfirmed }
  }
  static func apps(_ bytes: Data) throws -> Set<ApplicationToken> {
    let selection: FamilyActivitySelection
    do { selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: bytes) }
    catch { throw ProtectionStoreError.corrupt }
    guard selection.categoryTokens.isEmpty, selection.webDomainTokens.isEmpty,
          selection.applicationTokens.count <= 512 else { throw ProtectionTransactionError.invalid }
    return selection.applicationTokens
  }
  /// Resolve token identity by native equality against retained day/session keys.
  /// An unstable JSON ordering must not spend another allowance for the same app.
  static func key(_ app: ApplicationToken, ledger: ProtectionSessionLedger?) throws -> Data {
    for item in ledger?.daily ?? [] {
      guard let saved = try? JSONDecoder().decode(ApplicationToken.self, from: item.app) else { throw ProtectionStoreError.corrupt }
      if saved == app { return item.app }
    }
    let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
    return try encoder.encode(app)
  }
  static func blocked(_ runtime: ProtectionRuntimeRecord, ledger: ProtectionSessionLedger?, clock: ProtectionClock) throws -> Set<ApplicationToken> {
    guard runtime.enabled else { return [] }
    let values = try runtime.activeSnapshots.map { ($0, try apps($0.selection)) }
    let all = values.reduce(into: Set<ApplicationToken>()) { $0.formUnion($1.1) }
    guard all.count <= 512 else { throw ProtectionStoreError.oversized }
    var blocked: Set<ApplicationToken> = []
    for app in all {
      let key = try key(app, ledger: ledger)
      let reasons = values.filter { $0.1.contains(app) }.map { ProtectionSessionReason(id: $0.0.reasonID, startsAt: $0.0.startsAt, endsAt: $0.0.endsAt) }
      if let ledger {
        if try !ledger.needed(app: key, revision: runtime.revision, reasons: reasons, clock: clock).isEmpty { blocked.insert(app) }
      } else { blocked.insert(app) }
    }
    return blocked
  }
  private func sdkMonitors(_ plan: ProtectionRuntimePlan) -> [ProtectionOSMonitor] {
    plan.monitors.map { ProtectionOSMonitor(name: $0.name, envelope: $0.envelope) }
  }
  private func sdkMonitors(_ plan: ProtectionRuntimePlan, ledger: ProtectionSessionLedger?, clock: ProtectionClock) throws -> [ProtectionOSMonitor] {
    let expiry = try ProtectionExpiryPlanner.monitors(runtime: plan.runtime, owner: owner, ledger: ledger, clock: clock)
    let monitors = sdkMonitors(plan) + expiry.map { ProtectionOSMonitor(name: $0.name, envelope: $0.envelope) }
    guard monitors.count <= 512 else { throw SessionFailure.capacity }
    return monitors
  }
  private func requireActivation() throws {
    guard activationAvailable else { throw ProtectionTransactionError.activationGated }
    guard AuthorizationCenter.shared.authorizationStatus == .approved else { throw ProtectionStoreError.unavailable }
  }
}
#endif
