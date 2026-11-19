import Foundation
@main struct SessionChecks {
  static func ms(_ text: String) -> Int64 { Int64(ISO8601DateFormatter().date(from: text)!.timeIntervalSince1970 * 1000) }
  static func check(_ value: @autoclosure () -> Bool, _ message: String) { if !value() { fatalError(message) } }
  static func main() throws {
    var ledger = try ProtectionSessionLedger(policy: .init(timezoneId: "America/New_York", sessionsPerDay: 1, sessionSeconds: 300))
    let app = Data([1]), other = Data([2]), wall = ms("2026-11-17T04:59:00Z")
    let clock = ProtectionClock(wall: wall, elapsed: 1000000, boot: "boot-a")
    let weekly = ProtectionSessionReason(id: "weekly_2026-11-16", startsAt: wall - 60000, endsAt: wall + 3600000)
    let quest = ProtectionSessionReason(id: "quest", startsAt: wall + 120000, endsAt: wall + 180000)
    let first = try ledger.allow(app: app, revision: 1, reasons: [weekly], clock: clock)
    check(first.startedNewSession && first.sessionIndex == 1 && first.exhausted == false, "last allowed session is not exhaustion")
    let afterMidnight = ProtectionClock(wall: wall + 120000, elapsed: 1120000, boot: "boot-a")
    let pending = try ledger.needed(app: app, revision: 1, reasons: [weekly, quest], clock: afterMidnight)
    check(pending.map(\.id) == ["quest"], "new reason prompts independently")
    let reuse = try ledger.allow(app: app, revision: 1, reasons: [weekly, quest], clock: afterMidnight)
    check(!reuse.startedNewSession && reuse.session.wallEnd == first.session.wallEnd && reuse.sessionIndex == nil, "new reason reuses remaining time without charge/extension")
    check(ledger.daily[0].day == "2026-11-16" && ledger.daily[0].count == 1, "cross-midnight session charged to starting day")
    check(ledger.grants.first(where: { $0.reasonID == "quest" })?.wallEnd == quest.endsAt, "grant capped to reason end")
    let independent = try ledger.allow(app: other, revision: 1, reasons: [weekly], clock: afterMidnight)
    check(independent.session.wallEnd > first.session.wallEnd && ledger.daily.count == 2, "concurrent apps keep independent clocks/counts")
    try ledger.updatePolicy(.init(timezoneId: "America/New_York", sessionsPerDay: 2, sessionSeconds: 600))
    check(ledger.sessions.first(where: { $0.app == app })!.wallEnd == first.session.wallEnd, "duration edit cannot extend running session")
    try ledger.reconcile(revision: 2, remainingReasons: [weekly.id])
    check(!ledger.grants.contains(where: { $0.reasonID == "quest" }) && ledger.grants.contains(where: { $0.reasonID == weekly.id }), "reason-scoped Stop preserves unrelated grant")
    check(ledger.daily.first(where: { $0.app == app })?.count == 1, "Stop preserves counts")
    let rollback = ProtectionClock(wall: wall - 1000, elapsed: 1001000, boot: "boot-a")
    check(!first.session.live(rollback), "wall rollback invalidates exemption")
    check(!first.session.live(.init(wall: wall + 1000, elapsed: 1, boot: "boot-b")), "reboot invalidates exemption")
    check(!first.session.live(.init(wall: first.session.wallEnd, elapsed: first.session.elapsedEnd, boot: "boot-a")), "exact deadline expired")
    do {
      try ledger.updatePolicy(.init(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 600))
      fatalError("timezone edit reset history")
    } catch SessionFailure.timezoneMigrationRequired {}
    var extra = try ProtectionSessionLedger(policy: .init(timezoneId: "America/New_York", sessionsPerDay: 1, sessionSeconds: 60))
    _ = try extra.allow(app: app, revision: 1, reasons: [weekly], clock: clock)
    let again = try extra.allow(app: app, revision: 1, reasons: [weekly], clock: .init(wall: wall + 61000, elapsed: 1061000, boot: "boot-a"))
    check(again.exhausted == false && extra.daily[0].day == "2026-11-17", "new day gets its own budget after previous session expires")
    let beyond = try extra.allow(app: app, revision: 1, reasons: [weekly], clock: .init(wall: wall + 122000, elapsed: 1122000, boot: "boot-a"))
    check(beyond.sessionIndex == 2 && beyond.exhausted == true, "extra session stays available and is marked exhausted only at start")
    let beforeRollback = extra.daily[0].count
    _ = try extra.allow(app: app, revision: 1, reasons: [weekly], clock: .init(wall: wall - 1000, elapsed: 1123000, boot: "boot-a"))
    check(extra.daily[0].day == "2026-11-17" && extra.daily[0].count == beforeRollback + 1, "rollback does not create a fresh day budget")
    let persisted = try JSONDecoder().decode(ProtectionSessionLedger.self, from: JSONEncoder().encode(extra))
    check(persisted == extra, "native record retains counters/deadlines across serialization")
    var corrupt = try JSONSerialization.jsonObject(with: JSONEncoder().encode(extra)) as! [String: Any]
    var corruptSessions = corrupt["sessions"] as! [[String: Any]]
    corruptSessions[0]["seconds"] = Int.max
    corrupt["sessions"] = corruptSessions
    do {
      _ = try JSONDecoder().decode(ProtectionSessionLedger.self, from: JSONSerialization.data(withJSONObject: corrupt))
      fatalError("corrupt duration decoded into arithmetic")
    } catch SessionFailure.invalid {}
    print("PASS: per-app clocks, reentry/new reasons, midnight, reason caps/Stop, preserved policy history, rollback/reboot/expiry, extra sessions and serialization")
  }
}
