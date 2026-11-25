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
    guard first.runtime.activeSnapshots.count == 2, first.monitors.count == 2,
      first.monitors[0].name.hasPrefix(ProtectionRuntimePlanner.prefix(owner)),
      ProtectionRuntimePlanner.sameIntent(record, first.runtime) else { fatalError("active occurrence projection") }
    let next = try ProtectionRuntimePlanner.resolve(first.runtime, owner: owner, now: ms("2026-11-16T11:00:00Z"))
    guard next.runtime.activeSnapshots.count == 1,
      next.runtime.activeSnapshots[0].reasonID.hasPrefix("entry_"), next.monitors.count == 2,
      next.monitors.contains(where: { $0.envelope.reasonID.hasPrefix("weekly_") &&
        $0.envelope.businessStartsAt == ms("2026-11-23T10:00:00Z") }),
      ProtectionRuntimePlanner.sameIntent(first.runtime, next.runtime) else { fatalError("recurrence advances without changing policy") }
    let later = try ProtectionRuntimePlanner.resolve(next.runtime, owner: owner, now: ms("2027-01-04T10:30:00Z"))
    guard later.runtime.activeSnapshots.count == 2 else { fatalError("preview horizon expired recurrence") }
    let overnight = try ProtectionRuntimePlanner.resolve(next.runtime, owner: owner, now: ms("2026-11-17T01:00:00Z"))
    guard overnight.runtime.activeSnapshots.count == 1,
      overnight.runtime.activeSnapshots[0].reasonID == "entry_2026-11-17" else { fatalError("selected apps lost overnight entry shield") }
    var selected = first.runtime; selected.weeklySelection = ProtectionSelection(revision: 2, encodedTokens: Data([2])); selected.selectionRevision = 2
    let edited = try ProtectionRuntimePlanner.resolve(selected, owner: owner, now: ms("2026-11-16T10:30:00Z"))
    guard edited.runtime.activeSnapshots.first(where: { $0.reasonID.hasPrefix("entry_") })?.selection == Data([2]) else { fatalError("entry shield kept removed app choices") }
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
