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
    let displayCount = try ledger.usedSessions(app: app, clock: clock)
    check(displayCount == 1, "shield count reads actual allowance consumption")
    var edited = try ProtectionSessionLedger(policy: .init(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 60))
    for offset in [0, 60000] {
      _ = try edited.allow(app: app, revision: 1, reasons: [weekly],
        clock: .init(wall: wall + Int64(offset), elapsed: clock.elapsed + Int64(offset), boot: clock.boot))
    }
    let thirdClock = ProtectionClock(wall: wall + 120000, elapsed: clock.elapsed + 120000, boot: clock.boot)
    do {
      _ = try edited.allow(app: app, revision: 1, reasons: [weekly], clock: thirdClock)
      fatalError("two used sessions must exhaust the old limit")
    } catch SessionFailure.exhausted {}
    try edited.updatePolicy(.init(timezoneId: "UTC", sessionsPerDay: 3, sessionSeconds: 60))
    let countAfterEdit = try edited.usedSessions(app: app, wall: thirdClock.wall)
    check(countAfterEdit == 2, "raising the limit preserves the two used sessions")
    let third = try edited.allow(app: app, revision: 2, reasons: [weekly], clock: thirdClock)
    check(third.sessionIndex == 3, "raising the limit gives exactly one more session")
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
    let capped = extra
    for time: Int64 in [wall + 122000, wall - 1000] {
      do {
        _ = try extra.allow(app: app, revision: 1, reasons: [weekly], clock: .init(wall: time, elapsed: 1123000, boot: "boot-a"))
        fatalError("daily cap allowed an extra session")
      } catch SessionFailure.exhausted {}
    }
    check(extra == capped, "failed starts leave the existing budget intact")
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
    var shared = try ProtectionSessionLedger(policy: .init(timezoneId: "UTC", sessionsPerDay: 1, sessionSeconds: 10, budgetScope: "all_selected_apps"))
    let sharedClock = ProtectionClock(wall: wall, elapsed: 1000000, boot: "boot-a")
    let sharedFirst = try shared.allow(app: app, revision: 1, reasons: [weekly], clock: sharedClock)
    let sharedOther = try shared.allow(app: other, revision: 1, reasons: [weekly], clock: .init(wall: wall + 3000, elapsed: 1003000, boot: "boot-a"))
    check(!sharedOther.startedNewSession && sharedOther.session.elapsedEnd == sharedFirst.session.elapsedEnd, "switching target apps reuses shared deadline without charge")
    let encodedShared = try JSONEncoder().encode(shared)
    var restoredShared = try JSONDecoder().decode(ProtectionSessionLedger.self, from: encodedShared)
    do { _ = try restoredShared.allow(app: other, revision: 1, reasons: [weekly], clock: .init(wall: wall + 10000, elapsed: 1010000, boot: "boot-a")); fatalError("shared budget should be exhausted") }
    catch SessionFailure.exhausted { }
    // Reboot/clock rollback cannot replenish an exhausted shared day; next day can.
    do { _ = try restoredShared.allow(app: app, revision: 1, reasons: [weekly], clock: .init(wall: wall + 20000, elapsed: 100, boot: "boot-b")); fatalError("reboot reset shared budget") }
    catch SessionFailure.exhausted { }
    let rollbackReason = ProtectionSessionReason(id: "rollback", startsAt: wall - 2 * 86400000, endsAt: wall + 86400000)
    do { _ = try restoredShared.allow(app: app, revision: 1, reasons: [rollbackReason], clock: .init(wall: wall - 86400000, elapsed: 200, boot: "boot-b")); fatalError("rollback reset shared budget") }
    catch SessionFailure.exhausted { }
    let tomorrowReason = ProtectionSessionReason(id: "weekly", startsAt: wall, endsAt: wall + 2 * 86400000)
    let tomorrowShared = try restoredShared.allow(app: app, revision: 1, reasons: [tomorrowReason], clock: .init(wall: wall + 86400000, elapsed: 300, boot: "boot-b"))
    check(tomorrowShared.startedNewSession && tomorrowShared.sessionIndex == 1, "next local day has one new shared allowance")
    var active = try ProtectionSessionLedger(policy: .init(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 900, budgetScope: "all_selected_apps"))
    let activeReason = ProtectionSessionReason(id: "active", startsAt: wall - 1000, endsAt: wall + 7200000)
    let started = try active.allow(app: app, revision: 1, reasons: [activeReason], clock: clock, usageBased: true)
    let away = ProtectionClock(wall: wall + 1800000, elapsed: clock.elapsed + 1800000, boot: clock.boot)
    check(started.session.live(away) && started.session.remaining(away) == 900, "background wall time must not consume active-use allowance")
    check(started.session.nudgeSeconds == [240, 480, 720], "15-minute quarters round up to whole minutes")
    var fiveMinutes = try ProtectionSessionLedger(policy: .init(timezoneId: "UTC", sessionsPerDay: 3, sessionSeconds: 300))
    let five = try fiveMinutes.allow(app: app, revision: 1, reasons: [activeReason], clock: clock, usageBased: true)
    check(five.session.nudgeSeconds == [120, 180, 240], "five-minute session nudges with 3, 2, and 1 minutes left")
    check(ProtectionSessionLedger.nudgeSeconds(duration: 600) == [180, 300, 480], "10-minute quarters round up to whole minutes")
    let halfway = ProtectionClock(wall: wall + 150000, elapsed: clock.elapsed + 150000, boot: clock.boot)
    let halfRecorded = try fiveMinutes.recordUsage(group: five.session.usageGroup, seconds: 150, clock: halfway)
    let earlyEnd = try fiveMinutes.recordUsage(group: five.session.usageGroup, seconds: 300, clock: halfway)
    check(halfRecorded && !earlyEnd && fiveMinutes.sessions[0].remaining(halfway) == 150, "premature expiry leaves the session open")
    fiveMinutes.pause(app: app)
    let fiveResumed = try fiveMinutes.allow(app: app, revision: 1, reasons: [activeReason], clock: halfway, usageBased: true)
    let fiveUsed = try fiveMinutes.usedSessions(app: app, clock: halfway)
    check(!fiveResumed.startedNewSession && fiveUsed == 1 && fiveResumed.session.remaining(halfway) == 150, "resume preserves partial usage and the original budget debit")
    let firstUsage = try active.recordUsage(group: started.session.usageGroup, seconds: 225, clock: away)
    check(firstUsage && active.sessions[0].remaining(away) == 675, "OS usage checkpoint consumes only measured activity")
    var rebased = active
    rebased.rebaseUsageMonitoring(selectionRevision: 2)
    check(rebased.sessions[0].usageOffsetSeconds == 225 && rebased.sessions[0].usageMonitorRevision == 2
      && rebased.sessions[0].remaining(away) == 675 && rebased.daily == active.daily,
      "changing targets rebases the platform counter without resetting usage or starts")
    let duplicate = try active.recordUsage(group: started.session.usageGroup, seconds: 225, clock: away)
    let stale = try active.recordUsage(group: started.session.usageGroup, seconds: 60, clock: away)
    check(!duplicate && !stale && active.sessions[0].remaining(away) == 675, "duplicate/reordered usage must not double charge or replenish")
    let sameBudget = try active.allow(app: other, revision: 1, reasons: [activeReason], clock: away, usageBased: true)
    check(!sameBudget.startedNewSession && sameBudget.session.usageGroup == started.session.usageGroup && sameBudget.session.remaining(away) == 675, "shared app switch resumes the same allowance")
    let activeCount = try active.usedSessions(app: other, clock: away)
    check(activeCount == 1, "shared resume cannot consume another daily session")
    let completed = try active.recordUsage(group: started.session.usageGroup, seconds: 900, clock: away)
    check(active.grants.isEmpty, "the final usage checkpoint clears finished grants before re-shield")
    check(completed && active.sessions.allSatisfy { !$0.live(away) }, "usage completion ends all members of the shared session")
    check(ProtectionSessionLedger.nudgeSeconds(duration: 900) == [240,480,720], "quarter reminders follow configured session length")
    let activeData = try JSONEncoder().encode(active)
    let restoredActive = try JSONDecoder().decode(ProtectionSessionLedger.self, from: activeData)
    check(restoredActive == active, "usage progress survives process restart")
    var entryLedger = try ProtectionSessionLedger(policy: .init(timezoneId: "UTC", sessionsPerDay: 2, sessionSeconds: 900))
    let entry = ProtectionSessionReason(id: "entry_test", startsAt: wall - 1000, endsAt: wall + 7200000)
    let focus = ProtectionSessionReason(id: "weekly_test", startsAt: wall - 1000, endsAt: wall + 60000)
    let entrySession = try entryLedger.allow(app: app, revision: 1, reasons: [entry, focus], clock: clock, usageBased: true)
    let outside = ProtectionClock(wall: wall + 120000, elapsed: clock.elapsed + 120000, boot: clock.boot)
    check(entrySession.session.live(outside) && entrySession.session.remaining(outside) == 900, "focus hours must not erase remaining entry-session time")
    let neededOutside = try entryLedger.needed(app: app, revision: 1, reasons: [entry], clock: outside)
    check(neededOutside.isEmpty, "entry grant survives end of planned focus hours")
    entryLedger.pause(app: app)
    let entryResume = try entryLedger.allow(app: app, revision: 1, reasons: [entry], clock: outside, usageBased: true)
    check(!entryResume.startedNewSession && entryResume.session.id == entrySession.session.id, "entry reentry resumes one session outside focus hours")
    print("PASS: per-app clocks, reentry/new reasons, midnight, reason caps/Stop, preserved policy history, rollback/reboot/expiry, extra sessions and serialization")
  }
}
