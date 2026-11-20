import Foundation

@main struct RuntimePlannerChecks {
  static func ms(_ value: String) -> Int64 { Int64(ISO8601DateFormatter().date(from: value)!.timeIntervalSince1970 * 1000) }
  static func main() throws {
    let owner = ProtectionOwner(namespace: "project", userID: UUID())
    let selection = ProtectionSelection(revision: 1, encodedTokens: Data([1]))
    let weekly = WeeklyProtectionSpec(weekdays: [0], hours: .init(start_local: "10:00", end_local: "11:00", next_day: false), timezone_id: "UTC", session_count: 2, session_minutes: 5)
    let record = ProtectionRuntimeRecord(revision: 1, enabled: true, selectionRevision: 1,
      policy: .init(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 300), weekly: weekly,
      weeklySelection: selection, quests: [], activeSnapshots: [], monitors: [])
    let first = try ProtectionRuntimePlanner.resolve(record, owner: owner, now: ms("2026-11-16T10:30:00Z"))
    guard first.runtime.activeSnapshots.count == 1, first.monitors.count == 1,
      first.monitors[0].name.hasPrefix(ProtectionRuntimePlanner.prefix(owner)),
      ProtectionRuntimePlanner.sameIntent(record, first.runtime) else { fatalError("active occurrence projection") }
    let next = try ProtectionRuntimePlanner.resolve(first.runtime, owner: owner, now: ms("2026-11-16T11:00:00Z"))
    guard next.runtime.activeSnapshots.isEmpty, next.monitors.count == 1,
      next.monitors[0].name != first.monitors[0].name,
      next.monitors[0].envelope.businessStartsAt == ms("2026-11-23T10:00:00Z"),
      ProtectionRuntimePlanner.sameIntent(first.runtime, next.runtime) else { fatalError("recurrence advances without changing policy") }
    let later = try ProtectionRuntimePlanner.resolve(next.runtime, owner: owner, now: ms("2027-01-04T10:30:00Z"))
    guard later.runtime.activeSnapshots.count == 1 else { fatalError("preview horizon expired recurrence") }
    let other = ProtectionOwner(namespace: "project", userID: UUID())
    guard ProtectionRuntimePlanner.prefix(owner) != ProtectionRuntimePlanner.prefix(other) else { fatalError("owner names overlap") }
    var changed = record; changed.revision = 2
    guard !ProtectionRuntimePlanner.sameIntent(record, changed) else { fatalError("generation mutation accepted") }
    var stopped = record; stopped.enabled = false
    let stop = try ProtectionRuntimePlanner.resolve(stopped, owner: owner, now: ms("2026-11-16T10:30:00Z"))
    guard stop.runtime.monitors.isEmpty, stop.runtime.activeSnapshots.isEmpty else { fatalError("stop retained runtime effects") }
    print("PASS: native recurrence projection, owner namespaces, boundary advance, long-term recurrence and immutable intent. Model checks only.")
  }
}
