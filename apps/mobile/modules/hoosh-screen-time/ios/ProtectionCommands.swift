import Foundation

struct ProtectionQuestCommand: Codable {
  let questID: UUID
  let remoteRevision: Int
  let enabled: Bool
  let versions: [QuestProtectionVersion]
  let cancelled: [String]
}
struct ProtectionCommand: Codable {
  let requestID: UUID
  let expectedRevision: Int
  let selectionRevision: UInt64
  let kind: String
  let weekly: WeeklyProtectionSpec?
  let quest: ProtectionQuestCommand?
  let questID: UUID?
  let reasonID: String?
  let policy: ProtectionSessionPolicy?

  func build(previous: ProtectionRuntimeRecord?, selection: ProtectionSelection) throws -> ProtectionRuntimeRecord {
    guard expectedRevision >= 0, expectedRevision < 2147483647,
      selection.revision == selectionRevision else { throw ProtectionTransactionError.conflict }
    if let weekly { try weekly.validate() }
    var result: ProtectionRuntimeRecord
    if let previous { result = previous }
    else {
      guard let chosen = weekly.map({ ProtectionSessionPolicy(timezoneId: $0.timezone_id,
        sessionsPerDay: $0.session_count, sessionSeconds: $0.session_minutes * 60, budgetScope: $0.budget_scope) }) ?? policy else { throw ProtectionTransactionError.invalid }
      result = ProtectionRuntimeRecord(revision: 1, enabled: false, selectionRevision: selectionRevision,
        policy: chosen, weekly: nil, weeklySelection: nil, quests: [], activeSnapshots: [], monitors: [])
    }
    guard (previous?.revision ?? 0) == expectedRevision else { throw ProtectionTransactionError.conflict }
    if previous?.enabled == false {
      result.weeklyEnabled = false
      result.quests = result.quests.map { quest in
        ProtectionQuestRecord(questID: quest.questID, remoteRevision: quest.remoteRevision,
          enabled: false, versions: [], cancelled: quest.cancelled, selection: quest.selection, requestID: quest.requestID)
      }
    }
    let wasWeeklyEnabled = result.weeklyIsEnabled
    result.revision = expectedRevision + 1
    result.selectionRevision = selectionRevision
    result.weeklyEnabled = wasWeeklyEnabled
    switch kind {
    case "weekly_apply":
      guard let weekly, quest == nil, questID == nil, reasonID == nil, policy == nil else { throw ProtectionTransactionError.invalid }
      try weekly.validate()
      result.weekly = weekly; result.weeklySelection = selection; result.weeklyEnabled = true
      result.policy = .init(timezoneId: weekly.timezone_id, sessionsPerDay: weekly.session_count, sessionSeconds: weekly.session_minutes * 60, budgetScope: weekly.budget_scope)
    case "weekly_stop":
      guard previous?.weekly != nil, weekly == nil, quest == nil, questID == nil, reasonID == nil, policy == nil else { throw ProtectionTransactionError.invalid }
      result.weeklyEnabled = false
    case "quest_apply":
      guard let quest, let policy, weekly == nil, questID == nil, reasonID == nil else { throw ProtectionTransactionError.invalid }
      try policy.validate()
      guard previous == nil || policy == result.policy else { throw ProtectionTransactionError.conflict }
      var value = ProtectionQuestRecord(questID: quest.questID, remoteRevision: quest.remoteRevision,
        enabled: quest.enabled, versions: quest.versions, cancelled: quest.cancelled, selection: selection, requestID: requestID)
      if let index = result.quests.firstIndex(where: { $0.questID == quest.questID }) {
        let old = result.quests[index]
        let now = Int64(Date().timeIntervalSince1970 * 1000)
        let sameRetainedVersions = quest.versions.allSatisfy { old.versions.contains($0) }
          && old.versions.filter { !quest.versions.contains($0) }.allSatisfy { ($0.effectiveUntil ?? Int64.max) <= now }
        guard quest.remoteRevision >= old.remoteRevision,
          quest.remoteRevision != old.remoteRevision || !old.enabled || (sameRetainedVersions && quest.enabled == old.enabled) else { throw ProtectionTransactionError.conflict }
        value = ProtectionQuestRecord(questID: value.questID, remoteRevision: value.remoteRevision, enabled: value.enabled,
          versions: value.versions, cancelled: Array(Set(old.cancelled + value.cancelled)).sorted(), selection: value.selection, requestID: value.requestID)
        result.quests[index] = value
      } else { result.quests.append(value) }
    case "quest_cancel":
      guard let questID, let reasonID, weekly == nil, quest == nil, policy == nil,
        let index = result.quests.firstIndex(where: { $0.questID == questID && $0.enabled }) else { throw ProtectionTransactionError.invalid }
      let old = result.quests[index]
      guard !old.cancelled.contains(reasonID) else { throw ProtectionTransactionError.conflict }
      // Only a real occurrence of an installed version can be cancelled.
      let values = try ProtectionSchedules.quest(questID, versions: old.versions,
        now: try Self.reasonDay(reasonID, questID: questID), selectionRevision: old.selection.revision)
      guard values.contains(where: { $0.reasonID == reasonID }) else { throw ProtectionTransactionError.invalid }
      result.quests[index] = ProtectionQuestRecord(questID: old.questID, remoteRevision: old.remoteRevision,
        enabled: old.enabled, versions: old.versions, cancelled: old.cancelled + [reasonID], selection: old.selection, requestID: old.requestID)
    default: throw ProtectionTransactionError.invalid
    }
    if kind == "weekly_apply" || kind == "quest_apply" {
      // Refresh the app targets of active schedules without dropping their session ledger.
      if previous?.selectionRevision != selection.revision {
        result.activeSnapshots = result.activeSnapshots.map { window in
          ProtectionOccurrence(reasonID: window.reasonID, startsAt: window.startsAt, endsAt: window.endsAt,
            selectionRevision: selection.revision, selection: selection.encodedTokens)
        }
      }
      if result.weekly != nil { result.weeklySelection = selection }
      result.quests = result.quests.map { value in
        ProtectionQuestRecord(questID: value.questID, remoteRevision: value.remoteRevision,
          enabled: value.enabled, versions: value.versions, cancelled: value.cancelled,
          selection: value.enabled ? selection : value.selection, requestID: value.requestID)
      }
    }
    result.enabled = (result.weekly != nil && result.weeklyEnabled == true) || result.quests.contains(where: { $0.enabled })
    if !result.enabled { result.activeSnapshots = []; result.monitors = [] }
    try result.validated()
    return result
  }
  private static func reasonDay(_ reason: String, questID: UUID) throws -> Int64 {
    let prefix = "q_\(questID.uuidString.lowercased().replacingOccurrences(of: "-", with: ""))_"
    guard reason.hasPrefix(prefix), reason.range(of: "^q_[0-9a-f]{32}_v[1-9][0-9]{0,9}_d[0-9]{8}$", options: .regularExpression) != nil,
      let day = reason.components(separatedBy: "_d").last, day.count == 8 else { throw ProtectionTransactionError.invalid }
    let label = "\(day.prefix(4))-\(day.dropFirst(4).prefix(2))-\(day.suffix(2))"
    // Anchor before the earliest local start (UTC+14), so even short
    // morning occurrences remain in the compiler horizon for validation.
    return max(0, Int64(try ScheduleCalendar.day(label).timeIntervalSince1970 * 1000) - 50400000)
  }
}
