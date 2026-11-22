import Foundation
@main struct CommandChecks {
  static func main() throws {
    let selection = ProtectionSelection(revision: 1, encodedTokens: Data([1]))
    let policy = ProtectionSessionPolicy(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 300)
    let weekly = WeeklyProtectionSpec(weekdays: [0], hours: .init(start_local: "10:00", end_local: "11:00", next_day: false), timezone_id: "UTC", session_count: 2, session_minutes: 5)
    func command(_ kind: String, _ expected: Int, weekly spec: WeeklyProtectionSpec? = nil,
                 quest: ProtectionQuestCommand? = nil, questID: UUID? = nil, reason: String? = nil,
                 policy: ProtectionSessionPolicy? = nil, selected: UInt64 = 1) -> ProtectionCommand {
      .init(requestID: UUID(), expectedRevision: expected, selectionRevision: selected, kind: kind,
        weekly: spec, quest: quest, questID: questID, reasonID: reason, policy: policy)
    }
    let applied = try command("weekly_apply", 0, weekly: weekly).build(previous: nil, selection: selection)
    let questID = UUID()
    let version = QuestProtectionVersion(revision: 1, firstDate: "2026-11-23", repeat: "weekly", weekdays: [0],
      start: "10:00", end: "11:00", nextDay: false, timezone: "UTC", effectiveFrom: 0, effectiveUntil: nil)
    let quest = ProtectionQuestCommand(questID: questID, remoteRevision: 1, enabled: true, versions: [version], cancelled: [])
    let both = try command("quest_apply", 1, quest: quest, policy: policy).build(previous: applied, selection: selection)
    var retired = both; retired.enabled = false
    let reclaimed = try command("weekly_apply", 2, weekly: weekly).build(previous: retired, selection: selection)
    guard reclaimed.weeklyIsEnabled, !reclaimed.quests[0].enabled else { fatalError("reclaim silently resumed an old quest") }
    let stopped = try command("weekly_stop", 2).build(previous: both, selection: selection)
    guard !stopped.weeklyIsEnabled, stopped.enabled, stopped.quests[0].enabled else { fatalError("weekly Stop removed quest") }
    let owner = ProtectionOwner(namespace: "model", userID: UUID())
    let now: Int64 = 1795429800000 // 2026-11-23, within the scheduled window
    let plan = try ProtectionRuntimePlanner.resolve(stopped, owner: owner, now: now)
    guard plan.runtime.monitors.allSatisfy({ !$0.reasonID.hasPrefix("weekly_") }) else { fatalError("stopped weekly definition reactivated") }
    let reason = "q_\(questID.uuidString.lowercased().replacingOccurrences(of: "-", with: ""))_v1_d20261123"
    let cancelled = try command("quest_cancel", 3, questID: questID, reason: reason).build(previous: stopped, selection: selection)
    guard cancelled.quests[0].cancelled == [reason], cancelled.weeklyEnabled == false else { fatalError("reason-scoped cancellation failed") }
    let resumed = try command("weekly_apply", 4, weekly: weekly).build(previous: cancelled, selection: selection)
    guard resumed.weeklyIsEnabled, resumed.quests[0].cancelled == [reason] else { fatalError("weekly resume erased quest cancellation") }
    do { _ = try command("weekly_stop", 0).build(previous: resumed, selection: selection); fatalError("stale revision accepted") }
    catch ProtectionTransactionError.conflict {}
    do { _ = try command("weekly_apply", 5, weekly: weekly, selected: 2).build(previous: resumed, selection: selection); fatalError("stale selection accepted") }
    catch ProtectionTransactionError.conflict {}
    do { _ = try command("quest_apply", 5, quest: quest, policy: .init(timezoneId: "UTC", sessionsPerDay: 4, sessionSeconds: 300)).build(previous: resumed, selection: selection); fatalError("quest silently changed allowance policy") }
    catch ProtectionTransactionError.conflict {}
    print("PASS: weekly apply/stop/resume with surviving quest, scoped cancellation, reviewed policy/selection/revision fences. Command model only.")
  }
}
