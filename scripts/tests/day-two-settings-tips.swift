import Foundation

@main struct SettingsTipChecks {
    static func main() throws {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/New_York")!
        let first = calendar.date(from: DateComponents(year: 2026, month: 10, day: 31, hour: 12))!
        let second = calendar.date(from: DateComponents(year: 2026, month: 11, day: 1))!
        var state = DayTwoSettingsTips(startedAt: first)
        precondition(!state.take(session: "one", now: first))
        precondition(!state.take(session: "one", now: second.addingTimeInterval(-1)))
        precondition(state.take(session: "one", now: second))
        precondition(!state.take(session: "two", now: second.addingTimeInterval(60)))
        precondition(!state.take(session: "one", now: second.addingTimeInterval(7200)))
        var restored = try JSONDecoder().decode(DayTwoSettingsTips.self, from: JSONEncoder().encode(state))
        precondition(restored.take(session: "two", now: second.addingTimeInterval(7200)))
        precondition(!restored.take(session: "one", now: second.addingTimeInterval(14400)))
        let later = calendar.date(byAdding: .day, value: 3, to: first)!
        precondition(restored.take(session: "three", now: later))
        for firstUse in [second.addingTimeInterval(-5 * 3600), second.addingTimeInterval(-60)] {
            var lateStart = DayTwoSettingsTips(startedAt: firstUse)
            precondition(lateStart.isFirstDay(at: second.addingTimeInterval(-1)))
            precondition(!lateStart.take(session: "late-start", now: second.addingTimeInterval(-1)))
            precondition(lateStart.take(session: "late-start", now: second))
            precondition(!lateStart.isFirstDay(at: second))
        }

        var startsAtMidnight = DayTwoSettingsTips(startedAt: second)
        let followingMidnight = calendar.date(byAdding: .day, value: 1, to: second)!
        precondition(!startsAtMidnight.take(session: "midnight-start", now: second))
        precondition(!startsAtMidnight.take(session: "midnight-start", now: followingMidnight.addingTimeInterval(-1)))
        precondition(startsAtMidnight.take(session: "midnight-start", now: followingMidnight))

        let legacy = try JSONDecoder().decode(DayTwoSettingsTips.self, from: Data("""
        {"startedAt":0,"sentCount":3,"lastSentAt":100,"lastSession":"previous"}
        """.utf8))
        precondition(legacy.startedAt == Date(timeIntervalSinceReferenceDate: 0))
        precondition(legacy.lastPromptAt == nil)
        let oldLateStart = """
        {"startedAt":\(second.addingTimeInterval(-60).timeIntervalSinceReferenceDate),
         "firstUseOnObservedDay":\(second.timeIntervalSinceReferenceDate)}
        """
        var upgraded = try JSONDecoder().decode(DayTwoSettingsTips.self, from: Data(oldLateStart.utf8))
        precondition(upgraded.take(session: "after-update", now: second))
        precondition(state.isFirstDay(at: second.addingTimeInterval(-1)))
        precondition(!state.isFirstDay(at: second))
        let finalShield = ShieldPresentation(day: "test", title: "You’ve reached your daily app limit",
                                             explanation: "Extra time is available.", action: "Add 10 extra minutes",
                                             messages: ["Take a breath."], dailyLimitReached: true)
        let firstDayShield = finalShield.forFirstDay(true)
        precondition(firstDayShield.action == nil && firstDayShield.messages.isEmpty)
        precondition(firstDayShield.explanation.contains("Stats tab in Hoosh"))
        precondition(finalShield.forFirstDay(false).actionLabel(appName: "Snap") == nil,
                     "A cached cap shield from an older install cannot offer extra time")
        precondition(finalShield.forFirstDay(false).messages == ["Take a breath."])
        print("PASS: Eastern midnight regardless of start time, DST, retries, cooldown, session deduplication and saved-state compatibility")
    }
}
