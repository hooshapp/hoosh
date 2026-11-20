import Foundation

// Fake SDK state for transaction fault injection only. It proves no iOS timing,
// monitor delivery, shield installation, or availability of the real driver.
final class ModelInstallationDriver: ProtectionInstallationDriver {
  var activationAvailable = true
  var installed: ProtectionRuntimeRecord?
  var installs = 0
  var verify = true
  var resolution: ((ProtectionRuntimeRecord) throws -> ProtectionRuntimeRecord)?
  func resolved(_ target: ProtectionRuntimeRecord) throws -> ProtectionRuntimeRecord { try resolution?(target) ?? target }
  func preflight(_ target: ProtectionRuntimeRecord) throws { try target.validated() }
  func matches(_ target: ProtectionRuntimeRecord, ledger: ProtectionSessionLedger?) throws -> Bool { verify && installed == target }
  func install(_ target: ProtectionRuntimeRecord, replacing previous: ProtectionRuntimeRecord?, ledger: ProtectionSessionLedger?) throws {
    installs += 1; installed = target
  }
}
@main struct TransactionChecks {
  static func check(_ value: @autoclosure () throws -> Bool, _ message: String) rethrows {
    if try !value() { fatalError(message) }
  }
  static func main() throws {
    let root = FileManager.default.temporaryDirectory.appendingPathComponent("hoosh-transactions-\(UUID())")
    defer { try? FileManager.default.removeItem(at: root) }
    let store = SharedProtectionStore(directory: root)
    let owner = ProtectionOwner(namespace: "project", userID: UUID())
    let leases = ProtectionOwnerLeases(), token = leases.begin(owner)
    try store.update(expectedRevision: nil) {
      var record = ProtectionOwnerRecord(owner: owner)
      record.selection = ProtectionSelection(revision: 1, encodedTokens: Data([1]))
      $0.installedOwner = owner; $0.owners = [record]
    }
    let driver = ModelInstallationDriver(), request = UUID(), command = Data("weekly-v1".utf8)
    func build(_ previous: ProtectionRuntimeRecord?, _ selection: ProtectionSelection) -> ProtectionRuntimeRecord {
      let spec = WeeklyProtectionSpec(weekdays: [0], hours: .init(start_local: "10:00", end_local: "11:00", next_day: false), timezone_id: "UTC", session_count: 2, session_minutes: 5)
      return ProtectionRuntimeRecord(revision: (previous?.revision ?? 0) + 1, enabled: true, selectionRevision: selection.revision,
        policy: .init(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 300), weekly: spec,
        weeklySelection: selection, quests: [], activeSnapshots: [], monitors: [.init(name: "hoosh.shared.weekly", reasonID: "weekly_test")])
    }
    let engine = ProtectionTransactions(store: store, leases: leases)
    driver.activationAvailable = false
    let untouched = try store.read()!
    do {
      _ = try engine.apply(owner: owner, token: token, requestID: request, expected: 0, selectionRevision: 1,
        canonicalCommand: command, driver: driver, build: build)
      fatalError("gated activation succeeded")
    } catch ProtectionTransactionError.activationGated {}
    try check(try store.read() == untouched && driver.installs == 0, "gate changes no persistent state or SDK")
    driver.activationAvailable = true
    var writes = 0
    let interruptedStore = SharedProtectionStore(directory: root, beforeRename: {
      writes += 1
      if writes == 2 { throw ProtectionStoreError.unavailable }
    })
    let interrupted = ProtectionTransactions(store: interruptedStore, leases: leases)
    do {
      _ = try interrupted.apply(owner: owner, token: token, requestID: request, expected: 0, selectionRevision: 1,
        canonicalCommand: command, driver: driver, build: build)
      fatalError("lost acknowledgment did not fail")
    } catch ProtectionStoreError.unavailable {}
    let pending = try store.read()!.owners[0]
    check(pending.installation == nil && pending.pendingInstallation?.requestID == request && driver.installs == 1,
      "OS effect without commit leaves durable pending intent, no false receipt")
    let pendingStatus = try engine.status(owner: owner, token: token, driver: driver)
    check(pendingStatus.phase == "pending" && pendingStatus.pendingRequestID == request, "own pending request can be recovered after restart")
    let recovered = try engine.recover(owner: owner, token: token, requestID: request, driver: driver)
    check(recovered.revision == 1 && driver.installs == 1, "readback recovers without a second SDK install")
    _ = try engine.apply(owner: owner, token: token, requestID: request, expected: 0, selectionRevision: 1,
      canonicalCommand: command, driver: driver, build: build)
    try check(try store.read()!.owners[0].receipts.count == 1 && driver.installs == 1, "same request is idempotent")
    do {
      _ = try engine.apply(owner: owner, token: token, requestID: request, expected: 0, selectionRevision: 1,
        canonicalCommand: Data("different".utf8), driver: driver, build: build)
      fatalError("reused request ID changed payload")
    } catch ProtectionTransactionError.requestMismatch {}
    driver.installed = nil
    try check(try engine.status(owner: owner, token: token, driver: driver).phase == "degraded", "missing SDK state cannot be reported verified")
    do {
      _ = try engine.apply(owner: owner, token: token, requestID: request, expected: 0, selectionRevision: 1,
        canonicalCommand: command, driver: driver, build: build)
      fatalError("receipt fabricated SDK readback")
    } catch ProtectionTransactionError.unconfirmed {}
    driver.installed = recovered
    driver.verify = false
    let secondID = UUID()
    do {
      _ = try engine.apply(owner: owner, token: token, requestID: secondID, expected: 1, selectionRevision: 1,
        canonicalCommand: Data("weekly-v2".utf8), driver: driver, build: build)
      fatalError("unverified SDK state committed")
    } catch ProtectionTransactionError.unconfirmed {}
    try check(try store.read()!.owners[0].installation?.revision == 1, "partial operation retains confirmed installation")
    // Simulate a real native session update between prepare and explicit recovery.
    let before = try store.read()!
    try store.update(expectedRevision: before.revision) { state in
      _ = try state.owners[0].sessionLedger!.allow(app: Data([2]), revision: 1,
        reasons: [.init(id: "weekly_test", startsAt: 0, endsAt: 3000000)],
        clock: .init(wall: 1000000, elapsed: 100000, boot: "model"))
    }
    driver.verify = true
    driver.resolution = { target in
      var current = target
      current.monitors = [.init(name: "hoosh.shared.next-occurrence", reasonID: "weekly_next")]
      return current
    }
    _ = try engine.recover(owner: owner, token: token, requestID: secondID, driver: driver)
    let after = try store.read()!.owners[0]
    check(after.installation?.revision == 2 && after.pendingInstallation == nil && after.sessionLedger?.daily[0].count == 1,
      "recovery preserves latest counters rather than replacing a stale ledger snapshot")
    check(after.installation?.monitors.first?.reasonID == "weekly_next", "recovery resolves current occurrence rather than replaying stale dates")
    driver.resolution = nil
    let otherOwner = ProtectionOwner(namespace: "project", userID: UUID())
    let otherToken = leases.begin(otherOwner)
    do {
      _ = try engine.recover(owner: owner, token: token, requestID: secondID, driver: driver)
      fatalError("old account recovered installation")
    } catch ProtectionStoreError.staleLease {}
    let stopState = try store.read()!
    try ProtectionInstallation(store: store, leases: leases).claim(owner: otherOwner, token: otherToken,
      revision: String(stopState.revision), confirmed: true, stopAndVerify: { driver.installed = nil })
    let retired = try store.read()!.owners.first(where: { $0.owner == owner })!
    check(retired.installation?.enabled == false && retired.pendingInstallation == nil && retired.sessionLedger?.daily[0].count == 1,
      "device takeover retires installation and preserves former account counters")
    // A v1 read is side-effect free; only a successful write upgrades its header.
    let oldRoot = root.appendingPathComponent("v1")
    try FileManager.default.createDirectory(at: oldRoot, withIntermediateDirectories: true)
    let oldBytes = Data("{\"version\":1,\"revision\":1,\"owners\":[]}".utf8)
    let oldFile = oldRoot.appendingPathComponent("state-v1.json")
    try oldBytes.write(to: oldFile)
    let oldStore = SharedProtectionStore(directory: oldRoot)
    try check(try oldStore.read()?.version == 1 && Data(contentsOf: oldFile) == oldBytes, "read does not rewrite v1")
    let failedUpgrade = SharedProtectionStore(directory: oldRoot, beforeRename: { throw ProtectionStoreError.unavailable })
    do { try failedUpgrade.update(expectedRevision: 1) { _ in }; fatalError("upgrade failure swallowed") }
    catch ProtectionStoreError.unavailable {}
    try check(try Data(contentsOf: oldFile) == oldBytes, "failed migration preserves old bytes")
    let upgraded = try oldStore.update(expectedRevision: 1) { _ in }
    check(upgraded.version == 2, "atomic write upgrades schema; old binaries reject newer header")
    print("PASS: activation gate, pending-before-SDK, lost-ack recovery, stable receipts/payload fence, exact readback, partial failure, latest-ledger retention, A/B isolation and v1 migration")
  }
}
