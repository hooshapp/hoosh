#if os(iOS)
import Foundation
import FamilyControls
import ManagedSettings

/// Extension dispatch never trusts callback-supplied owner/reason identifiers.
/// Read the currently claimed generation and re-evaluate its persisted definitions.
enum ProtectionNativeEngine {
  static func monitor(_ name: String) {
    guard ProtectionActivationGate.enabled, name.hasPrefix("hoosh.shared.") else { return }
    do {
      let store = try SharedProtectionStore.appGroup()
      let (owner, revision) = try current(store)
      guard name.hasPrefix(ProtectionRuntimePlanner.prefix(owner) + "r\(revision).") else { return }
      try ProtectionRuntimeCoordinator(store: store).refresh(owner: owner, revision: revision,
        driver: ProtectionNativeDriver(owner: owner))
    } catch { /* No empty-state fallback, legacy mutation or fabricated success. */ }
  }

  static func nudgeLine() -> String {
    let tone = (try? SharedProtectionStore.appGroup().read()).flatMap { state in
      state.installedOwner.flatMap { owner in state.owners.first(where: { $0.owner == owner })?.nudgeTone }
    }
    switch tone {
    case "Direct": return "Pause now. Choose what you want to do next."
    case "Playful": return "Plot twist: your next chapter is off the feed."
    case "Intense": return "Protect the time you chose. Make your next move intentional."
    default: return "A small pause can make room for what matters to you."
    }
  }

  static func allow(_ app: ApplicationToken) -> Bool {
    guard ProtectionActivationGate.enabled else { return false }
    do {
      let store = try SharedProtectionStore.appGroup()
      let (owner, revision) = try current(store)
      let clock = try ProtectionDeviceClock.sample()
      try ProtectionRuntimeCoordinator(store: store).allow(owner: owner, revision: revision,
        driver: ProtectionNativeDriver(owner: owner), clock: clock) { runtime, ledger in
          let key = try ProtectionNativeDriver.key(app, ledger: ledger)
          let reasons = try runtime.activeSnapshots.filter {
            try ProtectionNativeDriver.apps($0.selection).contains(app)
          }.map { ProtectionSessionReason(id: $0.reasonID, startsAt: $0.startsAt, endsAt: $0.endsAt) }
          return (key, reasons)
        }
      return true // Coordinator has read back both SDK shields and expiry alarms.
    } catch { return false }
  }

  /// Read-only presentation. No events, grants, rewards or counters on rendering.
  static func remainingSeconds(_ app: ApplicationToken) -> Int? {
    guard ProtectionActivationGate.enabled, AuthorizationCenter.shared.authorizationStatus == .approved else { return nil }
    do {
      let store = try SharedProtectionStore.appGroup()
      return try store.withSnapshot { state in
        guard let state, let owner = state.installedOwner, state.pendingClaim == nil,
          let record = state.owners.first(where: { $0.owner == owner }), record.pendingInstallation == nil,
          let saved = record.installation, saved.enabled else { return nil }
        let clock = try ProtectionDeviceClock.sample()
        let runtime = try ProtectionRuntimePlanner.resolve(saved, owner: owner, now: clock.wall).runtime
        let ledger = try record.sessionLedger ?? ProtectionSessionLedger(policy: runtime.policy)
        let key = try ProtectionNativeDriver.key(app, ledger: ledger)
        let reasons = try runtime.activeSnapshots.filter { try ProtectionNativeDriver.apps($0.selection).contains(app) }
        guard let earliest = reasons.map(\.endsAt).min() else { return nil }
        let live = ledger.sessions.first(where: { $0.app == key && $0.live(clock) })
        let milliseconds = min(earliest - clock.wall,
          live.map { min($0.wallEnd - clock.wall, $0.elapsedEnd - clock.elapsed) } ?? Int64(runtime.policy.sessionSeconds) * 1000)
        guard milliseconds > 0 else { return nil }
        return Int((milliseconds + 999) / 1000)
      }
    } catch { return nil }
  }

  private static func current(_ store: SharedProtectionStore) throws -> (ProtectionOwner, Int) {
    guard let state = try store.read(), let owner = state.installedOwner, state.pendingClaim == nil,
      let record = state.owners.first(where: { $0.owner == owner }), record.pendingInstallation == nil,
      let runtime = record.installation, runtime.enabled else { throw ProtectionStoreError.staleLease }
    return (owner, runtime.revision)
  }
}
#endif
