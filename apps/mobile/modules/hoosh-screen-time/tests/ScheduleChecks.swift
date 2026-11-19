import Foundation

@main struct ScheduleChecks {
  static func ms(_ value: String) -> Int64 { Int64(ISO8601DateFormatter().date(from: value)!.timeIntervalSince1970 * 1000) }
  static func check(_ value: @autoclosure () throws -> Bool, _ message: String) rethrows {
    if try !value() { fatalError(message) }
  }
  static func spec(_ days: [Int], _ start: String, _ end: String, next: Bool = false, zone: String = "America/New_York") -> WeeklyProtectionSpec {
    WeeklyProtectionSpec(weekdays: days, hours: ScheduleHours(start_local: start, end_local: end, next_day: next), timezone_id: zone, session_count: 3, session_minutes: 5)
  }
  static func main() throws {
    let now = ms("2026-11-17T05:30:00Z")
    let overnight = try ProtectionSchedules.weekly(spec([0], "23:00", "01:00", next: true), now: now,
      selectionRevision: 1, selection: Data([1]))
    check(overnight.first?.reasonID == "weekly_2026-11-16", "start weekday owns overnight")
    check(overnight.first?.endsAt == ms("2026-11-17T06:00:00Z"), "saved zone overnight finish")
    let ended = try ProtectionSchedules.weekly(spec([0], "23:00", "01:00", next: true), now: ms("2026-11-17T06:00:00Z"))
    check(!ended.contains(where: { $0.reasonID == "weekly_2026-11-16" }), "half-open end excluded")
    let spring = try ProtectionSchedules.weekly(spec([6], "02:30", "03:30"), now: ms("2026-03-08T05:00:00Z"))
    check(spring.first?.startsAt == ms("2026-03-08T07:00:00Z") && spring.first?.endsAt == ms("2026-03-08T07:30:00Z"), "DST gap clamps to first valid minute")
    let fold = try ProtectionSchedules.weekly(spec([6], "01:30", "01:45"), now: ms("2026-11-01T04:00:00Z"))
    check(fold.first?.startsAt == ms("2026-11-01T05:30:00Z") && fold.first?.endsAt == ms("2026-11-01T06:45:00Z"), "DST fold earliest start latest end")
    let collapse = try ProtectionSchedules.weekly(spec([6], "02:10", "02:20"), now: ms("2026-03-08T05:00:00Z"))
    check(!collapse.contains(where: { $0.reasonID == "weekly_2026-03-08" }), "collapsed gap window skipped")
    let lordHowe = try ProtectionSchedules.weekly(spec([6], "01:45", "01:55", zone: "Australia/Lord_Howe"), now: ms("2026-04-04T12:00:00Z"))
    check(lordHowe.first!.endsAt - lordHowe.first!.startsAt == 40 * 60000, "half-hour fold supported")
    let id = UUID(uuidString: "00000000-0000-4000-8000-000000000001")!
    let version = QuestProtectionVersion(revision: 1, firstDate: "2026-11-16", repeat: "daily", weekdays: [],
      start: "23:00", end: "01:00", nextDay: true, timezone: "America/New_York",
      effectiveFrom: ms("2026-11-17T04:00:00Z"), effectiveUntil: ms("2026-11-19T04:00:00Z"))
    let quests = try ProtectionSchedules.quest(id, versions: [version], now: now, selectionRevision: 2, selection: Data([2]))
    check(quests.count == 2, "effective interval includes start but excludes until")
    check(quests.first!.reasonID.hasSuffix("_v1_d20261116"), "quest reason matches backend date/version format")
    let cancelled = try ProtectionSchedules.quest(id, versions: [version], now: now, cancelled: [quests.first!.reasonID])
    check(cancelled.count == 1, "cancel applies only to one occurrence")
    let combined = overnight + quests
    let remaining = ProtectionSchedules.cancelling(quests.first!.reasonID, windows: combined)
    check(remaining.contains(where: { $0.reasonID.hasPrefix("weekly_") && $0.active(at: now) }), "quest Stop retains overlapping weekly reason")
    let preserved = ProtectionSchedules.preserveActive(overnight.map { value in
      ProtectionOccurrence(reasonID: value.reasonID, startsAt: value.startsAt, endsAt: value.endsAt, selectionRevision: 9, selection: Data([9]))
    }, previous: overnight, now: now)
    let edited = ProtectionOccurrence(reasonID: overnight[0].reasonID, startsAt: overnight[0].startsAt,
      endsAt: overnight[0].endsAt + 600000, selectionRevision: 9, selection: Data([9]))
    let editedResult = ProtectionSchedules.preserveActive([edited], previous: overnight, now: now)[0]
    check(editedResult.selectionRevision == 1 && editedResult.endsAt == edited.endsAt,
          "explicit hours edit keeps active app snapshot but uses reviewed new window bounds")
    check(preserved.first?.selectionRevision == 1 && preserved.last?.selectionRevision == 9,
          "active occurrence keeps old app snapshot; future takes new selection")
    do {
      _ = try ProtectionSchedules.weekly(spec([0, 0], "10:00", "11:00"), now: now)
      fatalError("duplicate weekdays accepted")
    } catch ScheduleFailure.invalid {}
    do {
      _ = try ProtectionSchedules.weekly(spec([0], "10:00", "11:00", zone: "Invalid/Zone"), now: now)
      fatalError("unknown zone accepted")
    } catch ScheduleFailure.timezone {}
    let short = ProtectionOccurrence(reasonID: "short", startsAt: now, endsAt: now + 300000, selectionRevision: 1, selection: Data())
    let envelope = try ProtectionSchedules.monitoringEnvelopes([short])[0]
    check(envelope.endsAt - envelope.startsAt == 900000 && envelope.businessStartsAt == now && envelope.warningSeconds == 300,
          "candidate padded envelope keeps business start and five-minute deadline unchanged")
    check(Set(overnight[0].preview.keys) == ["reasonId", "startsAt", "endsAt"], "preview never exports selection tokens")
    print("PASS: saved-zone weekly/overnight, half-open ends, DST gap/fold/collapse/half-hour shift, quest version bounds, cancellation/overlap, active snapshot preservation, validation and candidate minimum-length monitoring envelopes")
  }
}
