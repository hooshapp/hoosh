import Foundation

final class CoordinatorDriver: ProtectionInstallationDriver {
  var activationAvailable = true
  var fail = true
  var installed: ProtectionRuntimeRecord?
  var ledger: ProtectionSessionLedger?
  func preflight(_ target: ProtectionRuntimeRecord) throws { try target.validated() }
  func matches(_ target: ProtectionRuntimeRecord, ledger: ProtectionSessionLedger?) throws -> Bool { installed == target && self.ledger == ledger }
  func install(_ target: ProtectionRuntimeRecord, replacing previous: ProtectionRuntimeRecord?, ledger: ProtectionSessionLedger?) throws {
    if fail { throw ProtectionTransactionError.unconfirmed }
    installed = target; self.ledger = ledger
  }
}
@main struct RuntimeCoordinatorChecks {
  static func main() throws {
    let root = FileManager.default.temporaryDirectory.appendingPathComponent("hoosh-coordinator-\(UUID())")
    defer { try? FileManager.default.removeItem(at: root) }
    let store = SharedProtectionStore(directory: root), owner = ProtectionOwner(namespace: "model", userID: UUID())
    let policy = ProtectionSessionPolicy(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 300)
    let selection = ProtectionSelection(revision: 1, encodedTokens: Data([1]))
    let now: Int64 = 1795204800123
    let clock = ProtectionClock(wall: now, elapsed: 100000, boot: "model")
    let reason = ProtectionSessionReason(id: "weekly_test", startsAt: now - 1000, endsAt: now + 900000)
    let runtime = ProtectionRuntimeRecord(revision: 1, enabled: true, selectionRevision: 1, policy: policy,
      weekly: .init(weekdays: [0], hours: .init(start_local: "10:00", end_local: "11:00", next_day: false), timezone_id: "UTC", session_count: 2, session_minutes: 5),
      weeklySelection: selection, quests: [], activeSnapshots: [.init(reasonID: reason.id, startsAt: reason.startsAt,
        endsAt: reason.endsAt, selectionRevision: 1, selection: selection.encodedTokens)], monitors: [])
    try store.update(expectedRevision: nil) { state in
      var record = ProtectionOwnerRecord(owner: owner)
      record.selection = selection; record.installation = runtime
      state.installedOwner = owner; state.owners = [record]
    }
    let engine = ProtectionRuntimeCoordinator(store: store), driver = CoordinatorDriver()
    driver.activationAvailable = false
    let untouched = try store.read()
    do { try engine.refresh(owner: owner, revision: 1, driver: driver); fatalError("gate bypassed") }
    catch ProtectionTransactionError.activationGated {}
    guard try store.read() == untouched else { fatalError("gate changed state") }
    driver.activationAvailable = true
    do {
      try engine.allow(owner: owner, revision: 1, driver: driver, clock: clock) { _, _ in (Data([9]), [reason]) }
      fatalError("SDK failure acknowledged")
    } catch ProtectionTransactionError.unconfirmed {}
    let pending = try store.read()!.owners[0]
    guard pending.coverage == "partial", pending.sessionLedger?.daily.first?.count == 1 else { fatalError("grant was not durable before SDK") }
    guard pending.rewardJournal?.events.count == 1,
      pending.rewardJournal?.events.first?.evidence == "allowance_consumed",
      pending.rewardJournal?.events.first?.exhausted == false else { fatalError("durable consumption evidence missing") }
    let alarms = try ProtectionExpiryPlanner.monitors(runtime: runtime, owner: owner, ledger: pending.sessionLedger, clock: clock)
    guard alarms.count == 1, alarms[0].envelope.endsAt == now + 300877,
      pending.sessionLedger?.sessions.first?.wallEnd == now + 300000 else { fatalError("alarm rounding extended private deadline") }
    let reboot = ProtectionClock(wall: now, elapsed: 100000, boot: "reboot")
    guard try ProtectionExpiryPlanner.monitors(runtime: runtime, owner: owner, ledger: pending.sessionLedger, clock: reboot).isEmpty else { fatalError("reboot reused grant") }
    driver.fail = false
    try engine.allow(owner: owner, revision: 1, driver: driver, clock: clock) { _, _ in (Data([9]), [reason]) }
    let confirmed = try store.read()!.owners[0]
    guard confirmed.sessionLedger?.daily.first?.count == 1, confirmed.coverage == "unknown", driver.ledger == confirmed.sessionLedger else { fatalError("retry double charged or ignored SDK readback") }
    guard confirmed.rewardJournal == pending.rewardJournal else { fatalError("retry duplicated consumption evidence") }
    do {
      try engine.allow(owner: owner, revision: 1, driver: driver, clock: clock,
        applyGrant: { _, _ in throw ProtectionTransactionError.unconfirmed }) { _, _ in (Data([9]), [reason]) }
      fatalError("shield action acknowledged an unconfirmed unlock")
    } catch ProtectionTransactionError.unconfirmed {}
    var applied = false
    try engine.allow(owner: owner, revision: 1, driver: driver, clock: clock,
      applyGrant: { runtime, ledger in
        guard runtime.revision == 1, ledger.daily.first?.count == 1 else {
          fatalError("shield retry used a different revision or consumed a second session")
        }
        applied = true
      }) { _, _ in (Data([9]), [reason]) }
    guard applied else { fatalError("shield action returned before applying the unlock") }
    do { try engine.refresh(owner: owner, revision: 2, driver: driver); fatalError("stale generation accepted") }
    catch ProtectionStoreError.staleLease {}
    var writes = 0
    let interruptedStore = SharedProtectionStore(directory: root, beforeRename: {
      writes += 1
      if writes == 2 { throw ProtectionStoreError.unavailable }
    })
    driver.installed = nil
    do {
      try ProtectionRuntimeCoordinator(store: interruptedStore).allow(owner: owner, revision: 1, driver: driver, clock: clock) { _, _ in (Data([9]), [reason]) }
      fatalError("lost commit acknowledgment accepted")
    } catch ProtectionStoreError.unavailable {}
    guard try store.read()!.owners[0].sessionLedger?.daily.first?.count == 1 else { fatalError("lost acknowledgment lost allowance") }
    try engine.refresh(owner: owner, revision: 1, driver: driver)
    guard try store.read()!.owners[0].coverage == "unknown" else { fatalError("readback recovery failed") }
    let other = ProtectionOwner(namespace: "model", userID: UUID())
    do { try engine.refresh(owner: other, revision: 1, driver: driver); fatalError("wrong owner accepted") }
    catch ProtectionStoreError.staleLease {}
    var overlapping = confirmed.sessionLedger!
    let shortReason = ProtectionSessionReason(id: "quest_test", startsAt: now - 1000, endsAt: now + 60000)
    _ = try overlapping.allow(app: Data([10]), revision: 1, reasons: [reason, shortReason], clock: clock)
    var mixedRuntime = runtime
    mixedRuntime.activeSnapshots.append(.init(reasonID: shortReason.id, startsAt: shortReason.startsAt,
      endsAt: shortReason.endsAt, selectionRevision: 1, selection: selection.encodedTokens))
    let mixed = try ProtectionExpiryPlanner.monitors(runtime: mixedRuntime, owner: owner, ledger: overlapping, clock: clock)
    guard mixed.count == 2, overlapping.sessions.count == 2 else { fatalError("overlap alarm dedup or independent apps failed") }
    let afterShort = ProtectionClock(wall: now + 60000, elapsed: 160000, boot: "model")
    guard try ProtectionExpiryPlanner.monitors(runtime: mixedRuntime, owner: owner, ledger: overlapping, clock: afterShort).count == 1 else { fatalError("ended reason retained its alarm") }
    let expired = ProtectionClock(wall: now + 300000, elapsed: 400000, boot: "model")
    guard try ProtectionExpiryPlanner.monitors(runtime: runtime, owner: owner, ledger: confirmed.sessionLedger, clock: expired).isEmpty else { fatalError("expired alarm retained") }
    print("PASS: durable allowance before SDK, failed-install recovery without double charge, owner/generation fencing, exact private deadline, alarm alignment, reboot/expiry rejection. Model checks only.")
  }
}
