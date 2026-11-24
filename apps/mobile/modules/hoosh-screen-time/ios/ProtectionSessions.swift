import Foundation

enum SessionFailure: Error { case invalid, capacity, timezoneMigrationRequired, exhausted }
struct ProtectionSessionPolicy: Codable, Equatable {
  var timezoneId: String
  var sessionsPerDay: Int
  var sessionSeconds: Int
  var budgetScope: String? = nil
  var sharedBudget: Bool { budgetScope == "all_selected_apps" }
  func validate() throws {
    guard budgetScope == nil || budgetScope == "all_selected_apps" else { throw SessionFailure.invalid }
    guard timezoneId.utf8.count <= 128, (TimeZone.knownTimeZoneIdentifiers.contains(timezoneId) || timezoneId == "UTC"),
          (1...1000).contains(sessionsPerDay),
          (1...86400).contains(sessionSeconds) else { throw SessionFailure.invalid }
  }
}
/// The production clock adapter must supply a device boot identity and continuous
/// monotonic clock. Test clocks do not establish device timing or callback support.
struct ProtectionClock {
  let wall: Int64
  let elapsed: Int64
  let boot: String
  func validate() throws {
    guard (0...4102444800000).contains(wall), elapsed >= 0, elapsed <= Int64.max - 86400000,
          !boot.isEmpty, boot.utf8.count <= 128 else { throw SessionFailure.invalid }
  }
}
struct ElapsedProtectionSession: Codable, Equatable {
  let id: UUID
  let app: Data
  let wallEnd: Int64
  let elapsedEnd: Int64
  let boot: String
  let seconds: Int
  func live(_ clock: ProtectionClock) -> Bool {
    guard (1...86400).contains(seconds), clock.wall >= 0, clock.elapsed >= 0 else { return false }
    let duration = Int64(seconds) * 1000
    return boot == clock.boot && clock.wall < wallEnd && clock.elapsed < elapsedEnd
      && wallEnd - clock.wall <= duration && elapsedEnd - clock.elapsed <= duration
  }
}
struct ProtectionSessionGrant: Codable, Equatable {
  let app: Data
  let reasonID: String
  var revision: Int
  let wallEnd: Int64
  let elapsedEnd: Int64
  let boot: String
}
struct ProtectionDayCount: Codable, Equatable {
  let app: Data
  let day: String
  let count: Int
}
struct ProtectionSessionReason {
  let id: String
  let startsAt: Int64
  let endsAt: Int64
}
struct ProtectionGrantResult {
  let session: ElapsedProtectionSession
  let startedNewSession: Bool
  let sessionIndex: Int?
  let exhausted: Bool?
}

/// Native model only. This value has no competing disk path and is not an OS timer.
/// Its owner-scoped atomic persistence/clock adapter is a remaining C04 integration.
struct ProtectionSessionLedger: Codable, Equatable {
  private(set) var policy: ProtectionSessionPolicy
  private(set) var sessions: [ElapsedProtectionSession] = []
  private(set) var grants: [ProtectionSessionGrant] = []
  private(set) var daily: [ProtectionDayCount] = []
  init(policy: ProtectionSessionPolicy) throws { try policy.validate(); self.policy = policy }
  private enum CodingKeys: String, CodingKey { case policy, sessions, grants, daily }
  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    policy = try c.decode(ProtectionSessionPolicy.self, forKey: .policy)
    sessions = try c.decode([ElapsedProtectionSession].self, forKey: .sessions)
    grants = try c.decode([ProtectionSessionGrant].self, forKey: .grants)
    daily = try c.decode([ProtectionDayCount].self, forKey: .daily)
    try policy.validate()
    guard sessions.count <= 512, grants.count <= 2048, daily.count <= 513,
          Set(sessions.map(\.app)).count == sessions.count, Set(sessions.map(\.id)).count == sessions.count,
          Set(daily.map(\.app)).count == daily.count else { throw SessionFailure.capacity }
    for session in sessions {
      guard (1...86400).contains(session.seconds), !session.app.isEmpty, session.app.count <= 4096,
            session.wallEnd >= 0, session.elapsedEnd >= 0, !session.boot.isEmpty, session.boot.utf8.count <= 128 else { throw SessionFailure.invalid }
    }
    for grant in grants {
      guard !grant.app.isEmpty, grant.app.count <= 4096, grant.reasonID.range(of: "^[a-z0-9_-]{1,64}$", options: .regularExpression) != nil,
            (1...2147483647).contains(grant.revision), grant.wallEnd >= 0, grant.elapsedEnd >= 0,
            !grant.boot.isEmpty, grant.boot.utf8.count <= 128 else { throw SessionFailure.invalid }
    }
    let dateFormat = DateFormatter()
    dateFormat.locale = Locale(identifier: "en_US_POSIX")
    dateFormat.calendar = Calendar(identifier: .gregorian)
    dateFormat.timeZone = TimeZone(secondsFromGMT: 0)
    dateFormat.dateFormat = "yyyy-MM-dd"
    dateFormat.isLenient = false
    for bucket in daily {
      guard !bucket.app.isEmpty, bucket.app.count <= 4096, (1...2147483647).contains(bucket.count),
            bucket.day.range(of: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$", options: .regularExpression) != nil,
            let parsed = dateFormat.date(from: bucket.day), dateFormat.string(from: parsed) == bucket.day else { throw SessionFailure.invalid }
    }
  }

  mutating func updatePolicy(_ next: ProtectionSessionPolicy) throws {
    try next.validate()
    guard next.timezoneId == policy.timezoneId || (daily.isEmpty && sessions.isEmpty && grants.isEmpty) else {
      throw SessionFailure.timezoneMigrationRequired
    }
    // Existing deadlines and counts survive duration/count edits.
    policy = next
  }
  func needed(app: Data, revision: Int, reasons: [ProtectionSessionReason], clock: ProtectionClock) throws -> [ProtectionSessionReason] {
    try clock.validate()
    return reasons.filter { reason in
      reason.startsAt <= clock.wall && clock.wall < reason.endsAt && !grants.contains { grant in
        grant.app == app && grant.reasonID == reason.id && grant.revision == revision
          && grant.boot == clock.boot && clock.wall < grant.wallEnd && clock.elapsed < grant.elapsedEnd
          && sessions.contains(where: { $0.app == app && $0.live(clock) })
      }
    }
  }
  mutating func allow(app: Data, revision: Int, reasons: [ProtectionSessionReason], clock: ProtectionClock) throws -> ProtectionGrantResult {
    try clock.validate(); try policy.validate()
    guard !app.isEmpty, app.count <= 4096, (1...2147483647).contains(revision),
          !reasons.isEmpty, reasons.count <= 512, Set(reasons.map(\.id)).count == reasons.count,
          reasons.allSatisfy({ $0.id.range(of: "^[a-z0-9_-]{1,64}$", options: .regularExpression) != nil && $0.startsAt >= 0 && $0.endsAt > $0.startsAt }) else {
      throw SessionFailure.invalid
    }
    let pending = try needed(app: app, revision: revision, reasons: reasons, clock: clock)
    guard !pending.isEmpty else { throw SessionFailure.invalid }
    let running = sessions.filter { (policy.sharedBudget || $0.app == app) && $0.live(clock) }.min { $0.elapsedEnd < $1.elapsedEnd }
    let today = try day(clock.wall)
    let sharedKey = Data("__hoosh_shared_budget_v1__".utf8)
    let bucket = max(today, daily.map(\.day).max() ?? today)
    let prior = daily.first(where: { $0.app == app && $0.day == bucket })
    let shared = daily.first(where: { $0.app == sharedKey && $0.day == bucket })?.count
      ?? daily.filter { $0.day == bucket && $0.app != sharedKey }.reduce(0) { $0 + $1.count }
    let previous = policy.sharedBudget ? shared : (prior?.count ?? 0)
    guard previous < 2147483647, shared < 2147483647 else { throw SessionFailure.capacity }
    guard !policy.sharedBudget || running != nil || previous < policy.sessionsPerDay else { throw SessionFailure.exhausted }
    let index = previous + 1
    let duration = Int64(policy.sessionSeconds) * 1000
    let session = running.map { existing in
      existing.app == app ? existing : ElapsedProtectionSession(id: UUID(), app: app, wallEnd: existing.wallEnd,
        elapsedEnd: existing.elapsedEnd, boot: existing.boot, seconds: existing.seconds)
    } ?? ElapsedProtectionSession(id: UUID(), app: app, wallEnd: clock.wall + duration,
      elapsedEnd: clock.elapsed + duration, boot: clock.boot, seconds: policy.sessionSeconds)
    let kept = grants.filter { $0.wallEnd > clock.wall && $0.elapsedEnd > clock.elapsed && $0.boot == clock.boot }
    let newGrants = pending.map { reason in
      ProtectionSessionGrant(app: app, reasonID: reason.id, revision: revision,
        wallEnd: min(reason.endsAt, session.wallEnd), elapsedEnd: session.elapsedEnd, boot: clock.boot)
    }
    let nextSessions = sessions.filter { $0.app != app && $0.live(clock) } + [session]
    let sharedBucket = policy.sharedBudget || daily.contains(where: { $0.app == sharedKey })
      ? [ProtectionDayCount(app: sharedKey, day: bucket, count: shared + 1)] : []
    let nextDaily = running != nil ? daily : daily.filter { $0.app != app && $0.app != sharedKey }
      + [ProtectionDayCount(app: app, day: bucket, count: (prior?.count ?? 0) + 1)] + sharedBucket
    guard kept.count + newGrants.count <= 2048, nextSessions.count <= 512, nextDaily.count <= 513 else { throw SessionFailure.capacity }
    grants = kept + newGrants
    sessions = nextSessions
    daily = nextDaily
    return ProtectionGrantResult(session: session, startedNewSession: running == nil,
      sessionIndex: running == nil ? index : nil, exhausted: running == nil ? index > policy.sessionsPerDay : nil)
  }
  mutating func reconcile(revision: Int, remainingReasons: Set<String>) throws {
    guard (1...2147483647).contains(revision), remainingReasons.count <= 512 else { throw SessionFailure.invalid }
    grants = grants.filter { remainingReasons.contains($0.reasonID) }.map { grant in
      var updated = grant; updated.revision = revision; return updated
    }
    // Removing a reason or stopping the plan never erases session/day history.
  }
  private func day(_ wall: Int64) throws -> String {
    guard let zone = TimeZone(identifier: policy.timezoneId) else { throw SessionFailure.invalid }
    var calendar = Calendar(identifier: .gregorian); calendar.timeZone = zone
    let c = calendar.dateComponents([.year, .month, .day], from: Date(timeIntervalSince1970: Double(wall) / 1000))
    return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
  }
}
