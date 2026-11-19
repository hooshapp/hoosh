import Foundation

enum ScheduleFailure: Error { case invalid, timezone, date, capacity }
struct ScheduleHours: Codable, Equatable {
  let start_local: String
  let end_local: String
  let next_day: Bool
}
struct WeeklyProtectionSpec: Codable, Equatable {
  let weekdays: [Int]
  let hours: ScheduleHours
  let timezone_id: String
  let session_count: Int
  let session_minutes: Int
  func validate() throws {
    try ScheduleCalendar.validate(hours, timezone: timezone_id)
    guard !weekdays.isEmpty, weekdays.count <= 7, Set(weekdays).count == weekdays.count,
          weekdays.allSatisfy({ (0...6).contains($0) }), (1...1000).contains(session_count),
          (1...1440).contains(session_minutes) else { throw ScheduleFailure.invalid }
  }
}
struct QuestProtectionVersion: Codable, Equatable {
  let revision: Int
  let firstDate: String
  let `repeat`: String
  let weekdays: [Int]
  let start: String
  let end: String
  let nextDay: Bool
  let timezone: String
  let effectiveFrom: Int64
  let effectiveUntil: Int64?
  var hours: ScheduleHours { ScheduleHours(start_local: start, end_local: end, next_day: nextDay) }
  func validate() throws {
    try ScheduleCalendar.validate(hours, timezone: timezone)
    _ = try ScheduleCalendar.day(firstDate)
    guard (1...2147483647).contains(revision), ["none", "daily", "weekly"].contains(`repeat`),
          (`repeat` == "weekly") == !weekdays.isEmpty, weekdays.count <= 7,
          weekdays == weekdays.sorted(), Set(weekdays).count == weekdays.count,
          weekdays.allSatisfy({ (0...6).contains($0) }), effectiveFrom >= 0,
          effectiveFrom <= 8640000000000000,
          effectiveUntil == nil || (effectiveUntil! >= effectiveFrom && effectiveUntil! <= 8640000000000000) else {
      throw ScheduleFailure.invalid
    }
  }
}
/// Native-only token snapshot: never encoded into preview/bridge dictionaries.
struct ProtectionOccurrence: Equatable {
  let reasonID: String
  let startsAt: Int64
  let endsAt: Int64
  let selectionRevision: UInt64
  let selection: Data
  func active(at now: Int64) -> Bool { startsAt <= now && now < endsAt }
  var preview: [String: Any] { ["reasonId": reasonID, "startsAt": startsAt, "endsAt": endsAt] }
}

enum ScheduleCalendar {
  static var utc: Calendar {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(secondsFromGMT: 0)!
    return calendar
  }
  static func validate(_ hours: ScheduleHours, timezone: String) throws {
    guard timezone.utf8.count <= 128, TimeZone.knownTimeZoneIdentifiers.contains(timezone) || timezone == "UTC" else { throw ScheduleFailure.timezone }
    let start = try minute(hours.start_local), end = try minute(hours.end_local)
    guard hours.next_day ? end < start : end > start else { throw ScheduleFailure.invalid }
  }
  static func minute(_ text: String) throws -> Int {
    guard text.count == 5, text.range(of: "^[0-9]{2}:[0-9]{2}$", options: .regularExpression) != nil else { throw ScheduleFailure.invalid }
    let parts = text.split(separator: ":").compactMap { Int($0) }
    guard parts.count == 2, parts[0] < 24, parts[1] < 60 else { throw ScheduleFailure.invalid }
    return parts[0] * 60 + parts[1]
  }
  /// UTC dates here are *wall-date labels*, so adding a day cannot skip a DST date.
  static func day(_ text: String) throws -> Date {
    guard text.range(of: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$", options: .regularExpression) != nil else { throw ScheduleFailure.date }
    let parts = text.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 3, (2020...2100).contains(parts[0]),
          let result = utc.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])), label(result) == text else { throw ScheduleFailure.date }
    return result
  }
  static func label(_ day: Date) -> String {
    let c = utc.dateComponents([.year, .month, .day], from: day)
    return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
  }
  static func localDay(_ now: Int64, timezone: String) throws -> Date {
    guard (0...4102444800000).contains(now), let zone = TimeZone(identifier: timezone) else { throw ScheduleFailure.date }
    var calendar = utc; calendar.timeZone = zone
    let parts = calendar.dateComponents([.year, .month, .day], from: Date(timeIntervalSince1970: Double(now) / 1000))
    guard let date = utc.date(from: parts) else { throw ScheduleFailure.date }
    return date
  }
  /// Match the backend: gap => first valid minute; fold => earliest start/latest end.
  /// DeviceActivity's default gap policy preserves smaller components, so compile
  /// absolute boundaries ourselves rather than silently adopting that policy.
  static func boundary(_ day: Date, time: String, timezone: String, end: Bool) throws -> Int64 {
    let minutes = try minute(time)
    guard let zone = TimeZone(identifier: timezone) else { throw ScheduleFailure.timezone }
    var calendar = utc; calendar.timeZone = zone
    let nominal = day.addingTimeInterval(Double(minutes * 60))
    // Read the zone's actual offsets around the boundary. Candidate instants
    // are round-tripped, including non-hour offsets; Calendar's repeatedTimePolicy
    // alone does not resolve Lord Howe's half-hour fold consistently.
    let offsets = Set((-72...72).map { zone.secondsFromGMT(for: nominal.addingTimeInterval(Double($0 * 3600))) })
    for minuteOffset in 0...1440 {
      let wall = nominal.addingTimeInterval(Double(minuteOffset * 60))
      let components = utc.dateComponents([.year, .month, .day, .hour, .minute, .second], from: wall)
      let candidates = offsets.compactMap { offset -> Date? in
        let candidate = wall.addingTimeInterval(Double(-offset))
        return calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: candidate) == components ? candidate : nil
      }
      if let instant = end ? candidates.max() : candidates.min() {
        return Int64((instant.timeIntervalSince1970 * 1000).rounded())
      }
    }
    throw ScheduleFailure.date
  }
  static func occurrence(day: Date, hours: ScheduleHours, timezone: String, reason: String,
                         selectionRevision: UInt64, selection: Data) throws -> ProtectionOccurrence? {
    let start = try boundary(day, time: hours.start_local, timezone: timezone, end: false)
    let finish = try boundary(day.addingTimeInterval(hours.next_day ? 86400 : 0), time: hours.end_local, timezone: timezone, end: true)
    guard finish > start else { return nil }
    return ProtectionOccurrence(reasonID: reason, startsAt: start, endsAt: finish,
                                selectionRevision: selectionRevision, selection: selection)
  }
  static func weekday(_ day: Date) -> Int { (utc.component(.weekday, from: day) + 5) % 7 }
}

/// Candidate OS envelope, not proof of callback delivery. Padding must never
/// widen the business restriction window. Its warning marks the real start.
struct ProtectionMonitorEnvelope: Equatable {
  let reasonID: String
  let startsAt: Int64
  let endsAt: Int64
  let businessStartsAt: Int64
  let warningSeconds: Int?
}

enum ProtectionSchedules {
  static func weekly(_ spec: WeeklyProtectionSpec, now: Int64, selectionRevision: UInt64 = 0,
                     selection: Data = Data()) throws -> [ProtectionOccurrence] {
    try spec.validate()
    let today = try ScheduleCalendar.localDay(now, timezone: spec.timezone_id)
    return try (-1...7).compactMap { offset in
      let day = today.addingTimeInterval(Double(offset * 86400))
      guard spec.weekdays.contains(ScheduleCalendar.weekday(day)) else { return nil }
      let window = try ScheduleCalendar.occurrence(day: day, hours: spec.hours, timezone: spec.timezone_id,
        reason: "weekly_\(ScheduleCalendar.label(day))", selectionRevision: selectionRevision, selection: selection)
      return window.flatMap { $0.endsAt > now ? $0 : nil }
    }
  }
  static func quest(_ id: UUID, versions: [QuestProtectionVersion], now: Int64, cancelled: Set<String> = [],
                    selectionRevision: UInt64 = 0, selection: Data = Data()) throws -> [ProtectionOccurrence] {
    guard versions.count <= 32, Set(versions.map(\.revision)).count == versions.count, cancelled.count <= 256 else { throw ScheduleFailure.capacity }
    let prefix = "q_\(id.uuidString.lowercased().replacingOccurrences(of: "-", with: ""))_"
    guard cancelled.allSatisfy({ $0.hasPrefix(prefix) && $0.range(of: "^q_[0-9a-f]{32}_v[1-9][0-9]{0,9}_d[0-9]{8}$", options: .regularExpression) != nil }) else { throw ScheduleFailure.invalid }
    let windows = try versions.flatMap { version -> [ProtectionOccurrence] in
      try version.validate()
      let first = try ScheduleCalendar.day(version.firstDate)
      let today = try ScheduleCalendar.localDay(now, timezone: version.timezone)
      let anchor = max(first, today)
      return try (-1...7).compactMap { offset in
        let day = anchor.addingTimeInterval(Double(offset * 86400))
        guard day >= first, version.repeat != "none" || day == first,
              version.repeat != "weekly" || version.weekdays.contains(ScheduleCalendar.weekday(day)) else { return nil }
        let reason = "\(prefix)v\(version.revision)_d\(ScheduleCalendar.label(day).replacingOccurrences(of: "-", with: ""))"
        guard !cancelled.contains(reason), let window = try ScheduleCalendar.occurrence(day: day, hours: version.hours,
          timezone: version.timezone, reason: reason, selectionRevision: selectionRevision, selection: selection),
          window.endsAt > now, window.startsAt >= version.effectiveFrom,
          version.effectiveUntil == nil || window.startsAt < version.effectiveUntil! else { return nil }
        return window
      }
    }
    guard windows.count <= 512, Set(windows.map(\.reasonID)).count == windows.count else { throw ScheduleFailure.capacity }
    return windows.sorted { $0.startsAt < $1.startsAt }
  }
  static func preserveActive(_ future: [ProtectionOccurrence], previous: [ProtectionOccurrence], now: Int64) -> [ProtectionOccurrence] {
    future.map { window in
      guard let old = previous.first(where: { $0.reasonID == window.reasonID && $0.startsAt == window.startsAt && $0.active(at: now) }) else { return window }
      return ProtectionOccurrence(reasonID: window.reasonID, startsAt: window.startsAt, endsAt: window.endsAt,
                                  selectionRevision: old.selectionRevision, selection: old.selection)
    }
  }
  /// Cancel only that reason. A simultaneously active weekly/quest reason survives.
  static func cancelling(_ reason: String, windows: [ProtectionOccurrence]) -> [ProtectionOccurrence] {
    windows.filter { $0.reasonID != reason }
  }
  /// A preview horizon is never an installation expiry or a JS refresh timer.
  static func monitoringEnvelopes(_ windows: [ProtectionOccurrence]) throws -> [ProtectionMonitorEnvelope] {
    guard windows.count <= 512 else { throw ScheduleFailure.capacity }
    return try windows.map { window in
      guard window.startsAt >= 0, window.endsAt > window.startsAt else { throw ScheduleFailure.invalid }
      let duration = window.endsAt - window.startsAt
      let padded = duration < 900000
      let start = padded ? window.endsAt - 900000 : window.startsAt
      guard start >= 0 else { throw ScheduleFailure.invalid }
      return ProtectionMonitorEnvelope(reasonID: window.reasonID, startsAt: start, endsAt: window.endsAt,
        businessStartsAt: window.startsAt, warningSeconds: padded ? Int((duration + 999) / 1000) : nil)
    }
  }
}
