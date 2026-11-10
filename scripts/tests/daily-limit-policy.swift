import Foundation

@main struct DailyPolicyChecks {
    static func main() throws {
        var catalog = DailyRuleCatalog()
        let a = Data("opaque-test-app-A".utf8), b = Data("opaque-test-app-B".utf8)
        catalog.reconcile(tokens: [a,b], defaultMinutes: 30)
        let aID = catalog.rules.first { $0.tokenData == a }!.id
        let bID = catalog.rules.first { $0.tokenData == b }!.id
        let previousRevision = catalog.rules.first { $0.id == aID }!.revision
        catalog.setMinutes(5, for: aID); catalog.setMinutes(15, for: bID)
        precondition(catalog.rules.first { $0.id == aID }!.minutes == 5)
        precondition(catalog.rules.first { $0.id == bID }!.minutes == 15)
        precondition(catalog.rules.first { $0.id == aID }!.revision == previousRevision + 1)
        let configured = catalog
        catalog.reconcile(tokens: [b,a], defaultMinutes: 60)
        precondition(catalog.rules == configured.rules, "Reordering/relaunch must retain identity and limits")
        precondition(catalog.selected(tokens: [a]).count == 1)
        let decoded = try DailyRuleCatalog.decode(JSONEncoder().encode(catalog))
        precondition(decoded.rules == catalog.rules)
        let now = Date(timeIntervalSince1970: 1_800_000_000), day = "test-day"
        func shielded(_ reached: [String:String], _ allowances: [String:DailyAppAllowance] = [:], selected: Set<String>? = nil) -> Set<String> {
            DailyLimitPolicy.shieldedIDs(selected: selected ?? [aID,bID], reached: reached, allowances: allowances, day: day, now: now)
        }
        precondition(shielded([:]).isEmpty, "No immediate block before reaching a threshold")
        precondition(shielded([aID:day]) == [aID], "A reaching its limit must not block B")
        precondition(shielded([aID:day,bID:day]) == [aID,bID])
        let allowance = DailyAppAllowance(activity: "opaque-activity", day: day, expiresAt: now.addingTimeInterval(3600))
        precondition(shielded([aID:day,bID:day], [aID:allowance]) == [bID], "A bypass must keep B blocked")
        let expired = DailyAppAllowance(activity: "opaque-activity", day: day, expiresAt: now.addingTimeInterval(-1))
        precondition(shielded([aID:day], [aID:expired]) == [aID])
        precondition(shielded([aID:"yesterday"]).isEmpty)
        precondition(shielded([aID:day], selected: [bID]).isEmpty, "Removing A must release only A")
        let priorDay = DailyAppAllowance(activity: "old", day: "yesterday", expiresAt: now.addingTimeInterval(3600))
        precondition(shielded([aID:day],[aID:priorDay]) == [aID])
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/New_York")!
        let midnight = calendar.date(from: DateComponents(year: 2026, month: 11, day: 4))!
        let yesterday = DailyLimitPolicy.day(at: midnight.addingTimeInterval(-1), calendar: calendar)
        let today = DailyLimitPolicy.day(at: midnight, calendar: calendar)
        precondition(yesterday == "2026-11-3" && today == "2026-11-4")
        let overnight = DailyAppAllowance(activity: "old", day: yesterday, expiresAt: midnight.addingTimeInterval(3600))
        precondition(DailyLimitPolicy.shieldedIDs(selected: [aID,bID], reached: [aID:yesterday,bID:yesterday], allowances: [aID:overnight], day: today, now: midnight).isEmpty, "Midnight releases yesterday's blocks")
        precondition(DailyLimitPolicy.shieldedIDs(selected: [aID,bID], reached: [aID:today,bID:yesterday], allowances: [aID:overnight], day: today, now: midnight) == [aID], "Yesterday's bypass must not unlock today's reached limit")
        let exactlyExpired = DailyAppAllowance(activity: "end", day: today, expiresAt: midnight)
        precondition(DailyLimitPolicy.shieldedIDs(selected: [aID,bID], reached: [aID:today,bID:today], allowances: [aID:exactlyExpired], day: today, now: midnight) == [aID,bID], "Expiry restores A without releasing B")
        let fallBackDay = calendar.date(from: DateComponents(year: 2026, month: 11, day: 1, hour: 23, minute: 59))!
        precondition(DailyLimitPolicy.day(at: fallBackDay, calendar: calendar) == "2026-11-1", "Use calendar day across DST, not 24-hour arithmetic")
        catalog.setMinutes(0, for: aID); precondition(catalog.rules.first { $0.id == aID }!.minutes == 5)
        catalog.setMinutes(999, for: bID); precondition(catalog.rules.first { $0.id == bID }!.minutes == 240)
        var invalid = catalog; invalid.version = 2
        do { _ = try DailyRuleCatalog.decode(JSONEncoder().encode(invalid)); fatalError("Unknown schema accepted") }
        catch is CocoaError { }
        invalid = catalog; invalid.rules.append(invalid.rules[0])
        do { _ = try DailyRuleCatalog.decode(JSONEncoder().encode(invalid)); fatalError("Duplicate app accepted") }
        catch is CocoaError { }
        print("PASS: per-app limits, stable identity, revisions, persistence, isolated blocking/bypass, reset, removal and invalid-schema rejection")
    }
}
