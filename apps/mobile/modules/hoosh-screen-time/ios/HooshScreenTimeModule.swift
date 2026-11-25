import ExpoModulesCore
import FamilyControls
import UIKit
import Combine
import UserNotifications

public class HooshScreenTimeModule: Module {
  private let leases = ProtectionOwnerLeases()
  private var permissionObserver: AnyCancellable?
  private var foregroundObserver: NSObjectProtocol?
  private var notificationDelegate: ProtectionNotificationDelegate?
  private let picker = NativeSelectionPicker()
  private let usageReport = UsageBaselinePresenter()
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
  // Sanitized physical-QA receipt: never includes identity, app tokens, answers or clock signals.
  private func writeProtectionDiagnostic(_ owner: ProtectionOwner, stage: String, error: Error? = nil) {
    #if HOOSH_PHYSICAL_NUDGE_QA
    var receipt: [String: Any] = ["stage": stage, "activationAvailable": ProtectionActivationGate.enabled,
      "authorized": AuthorizationCenter.shared.authorizationStatus == .approved,
      "clockAvailable": (try? ProtectionDeviceClock.sample()) != nil,
      "monitorCount": ProtectionOSAdapter.scopedMonitorCount]
    receipt["allowanceFailure"] = UserDefaults(suiteName: SharedProtectionStore.group)?.string(forKey: "hoosh.qa.allowanceFailure")
    if let state = try? SharedProtectionStore.appGroup().read(),
       let record = state.owners.first(where: { $0.owner == owner }) {
      receipt["ownerMatches"] = state.installedOwner == owner
      receipt["pendingClaim"] = state.pendingClaim != nil
      receipt["hasSelection"] = record.selection != nil
      receipt["pendingInstallation"] = record.pendingInstallation != nil
      if let pending = record.pendingInstallation, var ledger = record.sessionLedger {
        do { try ledger.updatePolicy(pending.target.policy); receipt["pendingPolicyCompatible"] = true }
        catch { receipt["pendingPolicyCompatible"] = false }
      }
      receipt["hasInstallation"] = record.installation != nil
      receipt["enabled"] = record.installation?.enabled ?? false
      receipt["activeReasonCount"] = record.installation?.activeSnapshots.count ?? 0
      receipt["allowanceSessionCount"] = record.sessionLedger?.sessions.count ?? 0
      receipt["allowanceGrantCount"] = record.sessionLedger?.grants.count ?? 0
      let measured = record.sessionLedger?.sessions.filter { $0.usageBased } ?? []
      receipt["usageSessionCount"] = measured.count
      receipt["usedUsageSeconds"] = measured.reduce(0) { $0 + ($1.usageConsumedSeconds ?? 0) }
      receipt["remainingUsageSeconds"] = measured.reduce(0) { $0 + max(0, $1.seconds - ($1.usageConsumedSeconds ?? 0)) }
    }
    if let error {
      if let typed = error as? ProtectionTransactionError { receipt["failure"] = String(describing: typed) }
      else if let typed = error as? ProtectionStoreError { receipt["failure"] = String(describing: typed) }
      else if let typed = error as? ScheduleFailure { receipt["failure"] = String(describing: typed) }
      else { let native = error as NSError; receipt["failure"] = "\(native.domain):\(native.code)" }
    }
    if let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
      let file = directory.appendingPathComponent("hoosh-protection-diagnostic.json")
      if stage == "read", let prior = try? Data(contentsOf: file),
         let saved = (try? JSONSerialization.jsonObject(with: prior)) as? [String: Any],
         let failure = saved["failure"] as? String { receipt["failure"] = failure }
      if let data = try? JSONSerialization.data(withJSONObject: receipt, options: [.sortedKeys]) {
        try? data.write(to: file, options: [.atomic, .completeFileProtection])
      }
    }
    #endif
  }
  public func definition() -> ModuleDefinition {
    Name("HooshScreenTime")
    AsyncFunction("setNudgeTone") { (namespace: String, userID: String, raw: String, tone: String) throws -> [String: Bool] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard ["Supportive", "Direct", "Playful", "Intense"].contains(tone) else { throw ProtectionStoreError.invalidRecord }
      try self.leases.withLease(owner, token: token) {
        let store = try SharedProtectionStore.appGroup()
        let state = try store.read()
        try store.update(expectedRevision: state?.revision ?? 0) { next in
          if let index = next.owners.firstIndex(where: { $0.owner == owner }) { next.owners[index].nudgeTone = tone }
          else { var record = ProtectionOwnerRecord(owner: owner); record.nudgeTone = tone; next.owners.append(record) }
        }
      }
      return ["saved": true]
    }
    AsyncFunction("budgetCapabilities") { ["scope": "all_selected_apps", "policy": "selected_apps_shared_v1"] }
    AsyncFunction("reviewUsageBaseline") { (namespace: String, userID: String, raw: String) async throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let store = try SharedProtectionStore.appGroup()
      let saved = try self.leases.withLease(owner, token: token) {
        try store.withSnapshot { state -> ProtectionSelection in
          guard let state, state.installedOwner == owner, state.pendingClaim == nil,
            let selection = state.owners.first(where: { $0.owner == owner })?.selection,
            AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
          return selection
        }
      }
      let selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: saved.encodedTokens)
      let result = try await self.usageReport.present(selection: selection) {
        (try? self.leases.withLease(owner, token: token) {
          try store.withSnapshot { state in
            state?.installedOwner == owner && state?.pendingClaim == nil &&
            state?.owners.first(where: { $0.owner == owner })?.selection?.revision == saved.revision &&
            AuthorizationCenter.shared.authorizationStatus == .approved
          }
        }) == true
      }
      return ["state": "confirmed", "source": "user_confirmed_report", "owner": "\(namespace):\(userID.lowercased())",
        "selectionRevision": saved.revision, "selectedAppCount": selection.applicationTokens.count,
        "windowDays": result.days, "totalMinutes": result.totalMinutes, "endsBefore": result.endsBefore, "timezone": result.timezone]
    }
    Events("onDeviceStatusChanged")
    OnDestroy {
      if let observer = self.foregroundObserver { NotificationCenter.default.removeObserver(observer) }
    }
    OnCreate {
      let reconcile: () -> Void = { [weak self] in
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
          ProtectionNativeEngine.pauseForHostReturn()
          if let state = try? SharedProtectionStore.appGroup().read(), let owner = state.installedOwner {
            self?.writeProtectionDiagnostic(owner, stage: "foreground")
          }
          self?.sendEvent("onDeviceStatusChanged", ["reason": "foreground"])
        }
      }
      self.foregroundObserver = NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: nil) { _ in reconcile() }
      reconcile()
      let center = UNUserNotificationCenter.current()
      let delegate = ProtectionNotificationDelegate(previous: center.delegate) { [weak self] in
        self?.sendEvent("onDeviceStatusChanged", ["reason": "notification_accepted"])
      }
      self.notificationDelegate = delegate; center.delegate = delegate
      center.getNotificationCategories { categories in
        let category = UNNotificationCategory(identifier: "hoosh.session.nudge", actions: [
          UNNotificationAction(identifier: "hoosh.nudge.skip", title: "Skip", options: []),
          UNNotificationAction(identifier: "hoosh.nudge.accept", title: "Accept · +30 ✦", options: [.foreground])
        ], intentIdentifiers: [], options: [])
        center.setNotificationCategories(categories.union([category]))
      }
      self.permissionObserver = AuthorizationCenter.shared.$authorizationStatus.dropFirst().sink { [weak self] _ in
        guard let self else { return }
        self.sendEvent("onDeviceStatusChanged", ["reason": "authorization"])
        Task { @MainActor in self.picker.cancel(); self.usageReport.cancel() }
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
      defer { self.writeProtectionDiagnostic(owner, stage: "read") }
      return try self.leases.withLease(owner, token: token) {
        let id = quest.flatMap(UUID.init(uuidString:))
        guard quest == nil || id != nil else { throw ProtectionTransactionError.invalid }
        return try ProtectionBridge.read(store: .appGroup(), owner: owner, questID: id)
      }
    }
    AsyncFunction("runtimeApply") { (namespace: String, userID: String, raw: String, json: String) async throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let (command, canonical) = try ProtectionBridge.command(json)
      do {
        _ = try ProtectionTransactions(store: .appGroup(), leases: self.leases).apply(owner: owner, token: token,
          requestID: command.requestID, expected: command.expectedRevision, selectionRevision: command.selectionRevision,
          canonicalCommand: canonical, driver: ProtectionNativeDriver(owner: owner), build: command.build)
      } catch {
        self.writeProtectionDiagnostic(owner, stage: "apply_failed", error: error)
        throw error
      }
      self.writeProtectionDiagnostic(owner, stage: "apply_confirmed")
      if ProtectionActivationGate.enabled {
        _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])
      }
      ProtectionNativeEngine.syncNudges(owner: owner)
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
      return try self.leases.withLease(owner, token: token) {
        try ProtectionBridge.read(store: .appGroup(), owner: owner, questID: command.quest?.questID ?? command.questID)
      }
    }
    AsyncFunction("runtimeRecover") { (namespace: String, userID: String, raw: String, request: String) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: request) else { throw ProtectionTransactionError.invalid }
      do {
        _ = try ProtectionTransactions(store: .appGroup(), leases: self.leases).recover(owner: owner, token: token,
          requestID: id, driver: ProtectionNativeDriver(owner: owner))
        self.writeProtectionDiagnostic(owner, stage: "recover_confirmed")
      } catch {
        self.writeProtectionDiagnostic(owner, stage: "recover_failed", error: error)
        throw error
      }
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
      Task { @MainActor in self.picker.cancel(lease: token); self.usageReport.cancel() }
    }
    AsyncFunction("readInstallation") { (namespace: String, userID: String, rawToken: String) throws -> [String: String] in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      return try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .read(owner: owner, token: token, legacyPresent: ProtectionDeviceTransition.legacyPresent)
    }
    AsyncFunction("claimInstallation") { (namespace: String, userID: String, rawToken: String, revision: String, confirmed: Bool) throws in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      let priorState = try SharedProtectionStore.appGroup().read()
      let priorOwner = priorState?.installedOwner
      let priorSessions = priorState?.owners.first(where: { $0.owner == priorOwner })?.sessionLedger?.sessions.map { $0.id.uuidString } ?? []
      try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .claim(owner: owner, token: token, revision: revision, confirmed: confirmed,
               stopAndVerify: ProtectionDeviceTransition.stopAndVerify)
      if let priorOwner {
        let prefix = "hoosh.shared.nudge." + ProtectionRuntimePlanner.prefix(priorOwner)
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
          let ids = requests.filter { request in priorSessions.contains { request.identifier.hasPrefix(prefix + $0 + ".") } }.map(\.identifier)
          UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
          UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ids)
        }
      }
      self.invalidateSelections()
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
      Task { @MainActor in self.picker.cancel(lease: token); self.usageReport.cancel() }
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
      Task { @MainActor in self.picker.cancel(); self.usageReport.cancel() }
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
    // Already-approved access must not reopen the system authorization flow.
    if AuthorizationCenter.shared.authorizationStatus == .approved { return authorization() }
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

private final class ProtectionNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
  private weak var previous: UNUserNotificationCenterDelegate?
  private let accepted: () -> Void
  init(previous: UNUserNotificationCenterDelegate?, accepted: @escaping () -> Void) {
    self.previous = previous; self.accepted = accepted
  }
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    if notification.request.content.categoryIdentifier == "hoosh.session.nudge" { completionHandler([.banner, .sound]); return }
    if let previous, previous.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:willPresent:withCompletionHandler:))) {
      previous.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
    } else { completionHandler([]) }
  }
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void) {
    if response.notification.request.content.categoryIdentifier == "hoosh.session.nudge" {
      if response.actionIdentifier == "hoosh.nudge.accept" {
        ProtectionNativeEngine.acceptNotification(response.notification.request.content.userInfo)
        accepted()
      }
      completionHandler(); return
    }
    if let previous, previous.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:))) {
      previous.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
    } else { completionHandler() }
  }
}

/// Install before React starts so notification Accept also works from a cold launch.
public enum HooshNudgeNotifications {
  private static var retainedDelegate: ProtectionNotificationDelegate?
  public static func install() {
    let center = UNUserNotificationCenter.current()
    if center.delegate is ProtectionNotificationDelegate { return }
    let delegate = ProtectionNotificationDelegate(previous: center.delegate, accepted: {})
    retainedDelegate = delegate; center.delegate = delegate
  }
}
