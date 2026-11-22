#if os(iOS)
import Foundation
import FamilyControls

enum ProtectionBridge {
  static func read(store: SharedProtectionStore, owner: ProtectionOwner, questID: UUID? = nil) throws -> [String: Any] {
    try store.withSnapshot { state in
      guard let state, state.installedOwner == owner, state.pendingClaim == nil,
        let record = state.owners.first(where: { $0.owner == owner }) else { throw ProtectionStoreError.staleLease }
      let now = Int64(Date().timeIntervalSince1970 * 1000)
      let installed = record.installation
      let driver = ProtectionNativeDriver(owner: owner)
      let phase: String
      if record.pendingInstallation != nil { phase = "pending" }
      else if !driver.activationAvailable { phase = "gated" }
      else if let installed { phase = (try? driver.matches(installed, ledger: record.sessionLedger)) == true ? "verified" : "degraded" }
      else { phase = "unconfigured" }
      let selectionCount: Int
      if let selection = record.selection { selectionCount = try ProtectionNativeDriver.apps(selection.encodedTokens).count }
      else { selectionCount = 0 }
      let native: [String: Any] = ["schemaVersion": 4, "platform": "ios", "phase": phase, "enabled": installed?.enabled ?? false,
        "authorization": AuthorizationCenter.shared.authorizationStatus == .approved ? "authorized" : "denied",
        "activationAvailable": driver.activationAvailable,
        "installedRevision": installed.map { $0.revision as Any } ?? NSNull(),
        "selectionRevision": installed.map { $0.selectionRevision as Any } ?? NSNull(),
        "selectedAppCount": selectionCount,
        "reasonCount": installed?.activeSnapshots.count ?? 0,
        "pendingRequestID": record.pendingInstallation.map { $0.requestID.uuidString.lowercased() as Any } ?? NSNull()]
      if let questID {
        let quest = installed?.quests.first(where: { $0.questID == questID })
        let questEnabled = installed?.enabled == true && quest?.enabled == true
        let windows = try quest.map { try ProtectionSchedules.quest(questID, versions: $0.versions, now: now,
          cancelled: Set($0.cancelled)) } ?? []
        return ["owner": "\(owner.namespace):\(owner.userID.uuidString.lowercased())", "questId": questID.uuidString.lowercased(),
          "observedAt": now, "native": native, "remoteRevision": quest?.remoteRevision ?? 0,
          "requestId": quest?.requestID.map { $0.uuidString.lowercased() as Any } ?? NSNull(),
          "enabled": questEnabled, "policy": try installed.map { try json($0.policy) } ?? NSNull(),
          "versions": questEnabled ? (try quest.map { try json($0.versions) } ?? []) : [],
          "cancelled": quest?.cancelled ?? [], "windows": (questEnabled ? windows : []).map(\.preview)]
      }
      let windows = try installed.flatMap { runtime in
        try runtime.weekly.map { try ProtectionSchedules.weekly($0, now: now) }
      } ?? []
      return ["observedAt": now, "native": native, "spec": try installed?.weekly.map { try json($0) } ?? NSNull(),
        "enabled": installed?.weeklyIsEnabled ?? false, "otherInstallation": false,
        "otherReasonCount": installed?.activeSnapshots.filter { !$0.reasonID.hasPrefix("weekly_") }.count ?? 0,
        "windows": installed?.weeklyIsEnabled == true ? windows.map(\.preview) : []]
    }
  }
  static func command(_ raw: String) throws -> (ProtectionCommand, Data) {
    guard let bytes = raw.data(using: .utf8), bytes.count <= 65536 else { throw ProtectionTransactionError.invalid }
    let command = try JSONDecoder().decode(ProtectionCommand.self, from: bytes)
    let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
    return (command, try encoder.encode(command))
  }
  private static func json<T: Encodable>(_ value: T) throws -> Any {
    try JSONSerialization.jsonObject(with: JSONEncoder().encode(value))
  }
}
#endif
