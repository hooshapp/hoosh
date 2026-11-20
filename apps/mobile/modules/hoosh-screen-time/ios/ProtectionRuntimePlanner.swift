import Foundation
import CryptoKit

struct ProtectionRuntimePlan {
  let runtime: ProtectionRuntimeRecord
  let monitors: [(name: String, envelope: ProtectionMonitorEnvelope)]
}
/// Resolve from persisted definitions at native callback time. Preview dates are
/// never persisted as the end of recurrence or renewed by a JavaScript timer.
enum ProtectionRuntimePlanner {
  static func prefix(_ owner: ProtectionOwner) -> String {
    let data = Data("\(owner.namespace):\(owner.userID.uuidString.lowercased())".utf8)
    let digest = SHA256.hash(data: data).prefix(12).map { String(format: "%02x", $0) }.joined()
    return "hoosh.shared.o\(digest)."
  }
  static func resolve(_ record: ProtectionRuntimeRecord, owner: ProtectionOwner, now: Int64) throws -> ProtectionRuntimePlan {
    try record.validated()
    var result = record
    guard record.enabled else {
      result.activeSnapshots = []; result.monitors = []
      return ProtectionRuntimePlan(runtime: result, monitors: [])
    }
    guard (record.weekly == nil ? 0 : 1) + record.quests.filter({ $0.enabled }).reduce(0, { $0 + $1.versions.count }) <= 512 else { throw ScheduleFailure.capacity }
    var windows: [ProtectionOccurrence] = []
    var upcoming: [ProtectionOccurrence] = []
    if let weekly = record.weekly, let selection = record.weeklySelection {
      let values = try ProtectionSchedules.weekly(weekly, now: now, selectionRevision: selection.revision, selection: selection.encodedTokens)
      windows += values
      if let next = values.first { upcoming.append(next) }
    }
    for quest in record.quests where quest.enabled {
      for version in quest.versions {
        let values = try ProtectionSchedules.quest(quest.questID, versions: [version], now: now,
          cancelled: Set(quest.cancelled), selectionRevision: quest.selection.revision, selection: quest.selection.encodedTokens)
        windows += values
        if let next = values.first { upcoming.append(next) }
      }
    }
    guard upcoming.count <= 512, Set(windows.map(\.reasonID)).count == windows.count else { throw ScheduleFailure.capacity }
    result.activeSnapshots = ProtectionSchedules.preserveActive(windows.filter { $0.active(at: now) }, previous: record.activeSnapshots, now: now)
    let prefix = prefix(owner) + "r\(record.revision)."
    let monitors = try upcoming.map { window -> (name: String, envelope: ProtectionMonitorEnvelope) in
      let key = Data("\(window.reasonID):\(window.startsAt):\(window.endsAt)".utf8)
      let suffix = SHA256.hash(data: key).prefix(16).map { String(format: "%02x", $0) }.joined()
      return (prefix + suffix, try ProtectionSchedules.monitoringEnvelopes([window])[0])
    }.sorted { $0.name < $1.name }
    result.monitors = monitors.map { .init(name: $0.name, reasonID: $0.envelope.reasonID) }
    try result.validated()
    return ProtectionRuntimePlan(runtime: result, monitors: monitors)
  }
  /// A driver may materialize current snapshots/bindings but cannot change the
  /// reviewed policy, definitions, selected revisions or installation generation.
  static func sameIntent(_ lhs: ProtectionRuntimeRecord, _ rhs: ProtectionRuntimeRecord) -> Bool {
    lhs.revision == rhs.revision && lhs.enabled == rhs.enabled && lhs.selectionRevision == rhs.selectionRevision
      && lhs.policy == rhs.policy && lhs.weekly == rhs.weekly && lhs.weeklySelection == rhs.weeklySelection && lhs.quests == rhs.quests
  }
}
