import ExpoModulesCore
import FamilyControls
import UIKit
import Combine

public class HooshScreenTimeModule: Module {
  private let leases = ProtectionOwnerLeases()
  private var permissionObserver: AnyCancellable?
  private let picker = NativeSelectionPicker()
  private var transactions: SelectionTransactions<FamilyActivitySelection>?
  private let transactionLock = NSLock()
  private func selections() throws -> SelectionTransactions<FamilyActivitySelection> {
    transactionLock.lock(); defer { transactionLock.unlock() }
    if let transactions { return transactions }
    let storage = try SharedProtectionStore.appGroup()
    let value = SelectionTransactions<FamilyActivitySelection>(store: storage, leases: leases,
      empty: FamilyActivitySelection(), same: Self.sameSelection) { selection in
      guard selection.categoryTokens.isEmpty, selection.webDomainTokens.isEmpty,
            selection.applicationTokens.count <= 512 else { throw SelectionFailure.unavailable }
      return selection.applicationTokens.count
    }
    transactions = value
    return value
  }
  private static func sameSelection(_ lhs: FamilyActivitySelection, _ rhs: FamilyActivitySelection) -> Bool {
    let appsMatch = lhs.applicationTokens == rhs.applicationTokens
    let categoriesMatch = lhs.categoryTokens == rhs.categoryTokens
    let domainsMatch = lhs.webDomainTokens == rhs.webDomainTokens
    return appsMatch && categoriesMatch && domainsMatch
  }
  private func selectionResult<T>(_ action: () throws -> T) throws -> T {
    do { return try action() }
    catch let failure as SelectionFailure {
      throw Exception(name: "SelectionError", description: "App selection could not be confirmed.", code: failure.rawValue)
    }
  }
  public func definition() -> ModuleDefinition {
    Name("HooshScreenTime")
    Events("onDeviceStatusChanged")
    OnCreate {
      self.permissionObserver = AuthorizationCenter.shared.$authorizationStatus.dropFirst().sink { [weak self] _ in
        guard let self else { return }
        self.sendEvent("onDeviceStatusChanged", ["reason": "authorization"])
        Task { @MainActor in self.picker.cancel() }
      }
    }
    // Read-only compiler. Preview is not monitor installation or elapsed expiry proof.
    AsyncFunction("schedulePreview") { (input: [String: Any]) throws -> [String: Any] in
      guard JSONSerialization.isValidJSONObject(input) else { throw ScheduleFailure.invalid }
      let data = try JSONSerialization.data(withJSONObject: input)
      guard data.count <= 8192 else { throw ScheduleFailure.capacity }
      let spec = try JSONDecoder().decode(WeeklyProtectionSpec.self, from: data)
      let now = Int64(Date().timeIntervalSince1970 * 1000)
      let windows = try ProtectionSchedules.weekly(spec, now: now)
      let envelopes = try ProtectionSchedules.monitoringEnvelopes(windows)
      return ["windows": windows.map(\.preview), "availability": "preview_only",
              "requiresTimingVerification": true,
              "usesPaddedMonitoringIntervals": envelopes.contains(where: { $0.startsAt < $0.businessStartsAt }),
              "activationAvailable": false, "blocker": "elapsed_session_expiry_unverified"]
    }
    AsyncFunction("rewardsRead") { (namespace: String, userID: String, raw: String) throws -> [String: Any]? in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().rewardsRead(owner: owner)
      }
    }
    AsyncFunction("rewardsAck") { (namespace: String, userID: String, raw: String, installation: String, sequence: Double) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: installation), sequence.isFinite, sequence.rounded() == sequence,
        sequence > 0, sequence <= Double(ProtectionRewardJournal.maximum) else { throw ProtectionStoreError.invalidRecord }
      try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().rewardsAck(owner: owner, installation: id, sequence: UInt64(sequence))
      }
    }
    AsyncFunction("runtimeRead") { (namespace: String, userID: String, raw: String, quest: String?) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.leases.withLease(owner, token: token) {
        let id = quest.flatMap(UUID.init(uuidString:))
        guard quest == nil || id != nil else { throw ProtectionTransactionError.invalid }
        return try ProtectionBridge.read(store: .appGroup(), owner: owner, questID: id)
      }
    }
    AsyncFunction("runtimeApply") { (namespace: String, userID: String, raw: String, json: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let (command, canonical) = try ProtectionBridge.command(json)
      _ = try ProtectionTransactions(store: .appGroup(), leases: self.leases).apply(owner: owner, token: token,
        requestID: command.requestID, expected: command.expectedRevision, selectionRevision: command.selectionRevision,
        canonicalCommand: canonical, driver: ProtectionNativeDriver(owner: owner), build: command.build)
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
      return try self.leases.withLease(owner, token: token) {
        try ProtectionBridge.read(store: .appGroup(), owner: owner, questID: command.quest?.questID ?? command.questID)
      }
    }
    AsyncFunction("runtimeRecover") { (namespace: String, userID: String, raw: String, request: String) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: request) else { throw ProtectionTransactionError.invalid }
      _ = try ProtectionTransactions(store: .appGroup(), leases: self.leases).recover(owner: owner, token: token,
        requestID: id, driver: ProtectionNativeDriver(owner: owner))
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
    }
    AsyncFunction("deviceDiagnostics") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.leases.withLease(owner, token: token) {
        let state = try SharedProtectionStore.appGroup().read()
        guard state?.installedOwner == owner, state?.pendingClaim == nil else { throw ProtectionStoreError.staleLease }
        // Never export ticks or boot identity. Availability is a read-only diagnostic.
        return ["schemaVersion": 1, "platform": "ios", "activationAvailable": ProtectionActivationGate.enabled,
          "clockAvailable": (try? ProtectionDeviceClock.sample()) != nil,
          "scopedMonitorCount": ProtectionOSAdapter.scopedMonitorCount, "enforcementVerified": false]
      }
    }
    AsyncFunction("deviceStatus") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.leases.withLease(owner, token: token) {
        let state = try SharedProtectionStore.appGroup().read()
        guard state?.installedOwner == owner, state?.pendingClaim == nil,
              let record = state?.owners.first(where: { $0.owner == owner }) else { throw SelectionFailure.unavailable }
        let authorization: String
        switch AuthorizationCenter.shared.authorizationStatus {
        case .approved: authorization = "authorized"
        case .denied: authorization = "denied"
        case .notDetermined: authorization = "not_requested"
        @unknown default: authorization = "unavailable"
        }
        // C04 has not registered the schedule engine. No active claim can be made.
        let uncertain = record.pendingInstallation != nil || record.installation?.enabled == true
          || ProtectionDeviceTransition.protectionPresent
        let deviceState = authorization != "authorized" ? "needs_permission"
          : (record.reasons.isEmpty && !uncertain ? "inactive" : "degraded")
        return ["schemaVersion": 1, "owner": "\(namespace):\(userID.lowercased())",
          "platform": "ios", "mode": "system_shield", "selectionUI": "native_picker",
          "authorization": authorization,
          "state": deviceState,
          "installedRevision": NSNull(), "installedReasonIds": [] as [String],
          "supportsScheduledRestriction": false, "supportsTemporaryAllowance": false,
          "supportsUsageThreshold": false, "supportsAdvanceWarning": false, "supportsUsageSummary": false]
      }
    }
    // Credential-free verified product identity. This never reads or claims disk state.
    AsyncFunction("beginOwnerSession") { (namespace: String, userID: String) throws -> String in
      guard !namespace.isEmpty, namespace.utf8.count <= 256,
            let id = UUID(uuidString: userID) else { throw ProtectionStoreError.invalidRecord }
      return self.leases.begin(ProtectionOwner(namespace: namespace, userID: id)).uuidString
    }
    AsyncFunction("endOwnerSession") { (raw: String) throws in
      guard let token = UUID(uuidString: raw) else { throw ProtectionStoreError.invalidRecord }
      self.leases.end(token)
      Task { @MainActor in self.picker.cancel(lease: token) }
    }
    AsyncFunction("readInstallation") { (namespace: String, userID: String, rawToken: String) throws -> [String: String] in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      return try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .read(owner: owner, token: token, legacyPresent: ProtectionDeviceTransition.legacyPresent)
    }
    AsyncFunction("claimInstallation") { (namespace: String, userID: String, rawToken: String, revision: String, confirmed: Bool) throws in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .claim(owner: owner, token: token, revision: revision, confirmed: confirmed,
               stopAndVerify: ProtectionDeviceTransition.stopAndVerify)
      self.invalidateSelections()
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
      Task { @MainActor in self.picker.cancel(lease: token) }
    }
    AsyncFunction("requestDeviceAuthorization") { (namespace: String, userID: String, raw: String) async throws -> String in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try await self.requestForOwner(owner, token: token)
    }
    AsyncFunction("selectionRead") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.selectionResult { try self.selections().read(owner: owner, token: token,
        authorized: AuthorizationCenter.shared.authorizationStatus == .approved) }
    }
    AsyncFunction("selectionBegin") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.selectionResult {
        guard AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
        return try self.selections().begin(owner: owner, token: token)
      }
    }
    AsyncFunction("selectionPick") { (namespace: String, userID: String, raw: String, draftID: String, version: Int) async throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: draftID) else { throw SelectionFailure.expired }
      let initial = try self.selectionResult { try self.selections().snapshot(owner: owner, token: token, id: id, version: version) }
      let chosen: FamilyActivitySelection
      do {
        chosen = try await self.pick(initial, owner: owner, token: token)
      } catch let failure as SelectionFailure {
        throw Exception(name: "SelectionError", description: "Picker closed without saving.", code: failure.rawValue)
      }
      return try self.selectionResult {
        guard AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
        return try self.selections().replace(owner: owner, token: token, id: id, version: version, value: chosen)
      }
    }
    AsyncFunction("selectionCommit") { (namespace: String, userID: String, raw: String, draftID: String, version: Int) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.selectionResult {
        guard let id = UUID(uuidString: draftID) else { throw SelectionFailure.expired }
        guard AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
        let result = try self.selections().commit(owner: owner, token: token, id: id, version: version)
        self.sendEvent("onDeviceStatusChanged", ["reason": "selection"])
        return result
      }
    }
    AsyncFunction("selectionRelease") { (namespace: String, userID: String, raw: String, draftID: String) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: draftID) else { return }
      try self.selections().release(owner: owner, token: token, id: id)
    }
    OnDestroy {
      self.permissionObserver?.cancel()
      self.leases.destroy()
      self.invalidateSelections()
      Task { @MainActor in self.picker.cancel() }
    }
    AsyncFunction("getAuthorization") { () -> String in
      await MainActor.run { self.authorization() }
    }
    AsyncFunction("requestAuthorization") { () async throws -> String in
      try await self.request()
    }
  }

  private func owner(_ namespace: String, _ userID: String, _ rawToken: String) throws -> (ProtectionOwner, UUID) {
    guard !namespace.isEmpty, namespace.utf8.count <= 256,
          let user = UUID(uuidString: userID), let token = UUID(uuidString: rawToken) else {
      throw ProtectionStoreError.invalidRecord
    }
    return (ProtectionOwner(namespace: namespace, userID: user), token)
  }

  private func invalidateSelections() {
    transactionLock.lock(); defer { transactionLock.unlock() }
    transactions?.invalidate()
  }
  @MainActor private func requestForOwner(_ owner: ProtectionOwner, token: UUID) async throws -> String {
    try leases.require(owner, token: token)
    let state = try SharedProtectionStore.appGroup().read()
    guard state?.installedOwner == owner, state?.pendingClaim == nil else { throw SelectionFailure.unavailable }
    let result = try await request()
    try leases.require(owner, token: token)
    return result
  }
  @MainActor private func pick(_ initial: FamilyActivitySelection, owner: ProtectionOwner, token: UUID) async throws -> FamilyActivitySelection {
    guard AuthorizationCenter.shared.authorizationStatus == .approved,
          let presenter = appContext?.utilities?.currentViewController() else { throw SelectionFailure.unavailable }
    try leases.require(owner, token: token)
    return try await picker.pick(initial, lease: token, presenter: presenter)
  }

  @MainActor private func request() async throws -> String {
    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
    return authorization()
  }

  @MainActor private func authorization() -> String {
    switch AuthorizationCenter.shared.authorizationStatus {
    case .approved: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "not_requested"
    @unknown default: return "unavailable"
    }
  }
}
