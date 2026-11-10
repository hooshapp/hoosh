import Foundation

@main struct SessionPolicyChecks {
    static func main() throws {
        let day = "2026-11-4"
        let selected = [Data([1]), Data([2]), Data([3])]
        var newCatalog = DailyRuleCatalog()
        newCatalog.reconcile(tokens: selected)
        precondition(newCatalog.rules.count == 3)
        precondition(newCatalog.rules.allSatisfy { $0.minutes == 30 && $0.sessionMinutes == 10 })
        let customRuleID = newCatalog.rules[0].id
        newCatalog.setMinutes(45, for: customRuleID)
        newCatalog.setSessionMinutes(20, for: customRuleID)
        newCatalog.reconcile(tokens: selected)
        precondition(newCatalog.rules[0].minutes == 45 && newCatalog.rules[0].sessionMinutes == 20)
        precondition(newCatalog.rules.dropFirst().allSatisfy { $0.minutes == 30 && $0.sessionMinutes == 10 })
        var rule = DailyAppRule(id: "a", tokenData: Data([1]), minutes: 30, revision: 1)
        precondition(rule.sessionMinutes == 15, "Existing rules migrate to a separate 15-minute default")
        rule.configuredSessionMinutes = 30
        precondition(AppSessionPolicy.nudgeMinutes(duration: 30) == [8,15,23])
        precondition(AppSessionPolicy.nudgeMinutes(duration: 15) == [4,8,12])
        precondition(AppSessionPolicy.nudgeMinutes(duration: 5) == [2,3,4])
        precondition(AppSessionPolicy.nextMinutes(rule: rule, used: 20) == 10)
        precondition(AppSessionPolicy.nextMinutes(rule: rule, used: 50) == 0)
        var state = AppSessionLedger(day: day)
        state.begin(activity: "first", extra: false)
        precondition(state.record(activity: "first", minute: 8, duration: 30, extra: false))
        precondition(state.usedMinutes == 8)
        precondition(!state.record(activity: "first", minute: 8, duration: 30, extra: false), "Duplicate must not charge twice")
        precondition(!state.record(activity: "first", minute: 4, duration: 30, extra: false), "Out-of-order callbacks must not reverse usage")
        precondition(!state.record(activity: "stale", minute: 20, duration: 30, extra: false))
        state.finish(activity: "first")
        state.finish(activity: "first")
        precondition(state.completedSessions == 1 && state.usedMinutes == 8, "Early exit charges usage only")
        state.begin(activity: "second", extra: false)
        precondition(!state.record(activity: "first", minute: 30, duration: 30, extra: false))
        precondition(state.record(activity: "second", minute: 22, duration: 22, extra: false))
        precondition(state.usedMinutes == 30)
        state.finish(activity: "second")
        state.begin(activity: "extra", extra: true)
        precondition(state.extraUsed)
        precondition(state.record(activity: "extra", minute: 10, duration: 10, extra: true))
        precondition(state.usedMinutes == 30, "Explicit extra time is separate from normal daily allowance")
        let decoded = try JSONDecoder().decode(AppSessionLedger.self, from: JSONEncoder().encode(state))
        precondition(decoded.usedMinutes == 30 && decoded.extraUsed && decoded.activity == "extra")
        var twoSessionRule = rule
        twoSessionRule.configuredSessionMinutes = 15
        var appA = AppSessionLedger(day: day)
        let appB = AppSessionLedger(day: day)
        appA.begin(activity: "a-1", extra: false)
        _ = appA.record(activity: "a-1", minute: 15, duration: 15, extra: false)
        appA.finish(activity: "a-1")
        precondition(AppSessionPolicy.nextMinutes(rule: twoSessionRule, used: appA.usedMinutes) == 15)
        precondition(appB.usedMinutes == 0, "A cannot consume B's allowance")
        appA.begin(activity: "a-2", extra: false)
        _ = appA.record(activity: "a-2", minute: 15, duration: 15, extra: false)
        appA.finish(activity: "a-2")
        precondition(appA.usedMinutes == 30 && appA.completedSessions == 2)
        precondition(AppSessionPolicy.nextMinutes(rule: twoSessionRule, used: appA.usedMinutes) == 0)
        let caps = [10, 20, 30]
        for (rule, cap) in zip(newCatalog.rules, caps) {
            newCatalog.setMinutes(cap, for: rule.id)
            newCatalog.setSessionMinutes(5, for: rule.id)
        }
        let protectedApps = newCatalog.selected(tokens: selected)
        var ledgers = Dictionary(uniqueKeysWithValues: protectedApps.map { ($0.id, AppSessionLedger(day: day)) })
        for session in 1...6 {
            for app in protectedApps {
                var ledger = ledgers[app.id]!
                let activity = "\(app.id)-\(session)"
                let minutes = AppSessionPolicy.nextMinutes(rule: app, used: ledger.usedMinutes)
                let reachedCap = (session - 1) * 5 >= app.minutes
                precondition(minutes == (reachedCap ? 0 : 5))
                if reachedCap { continue }
                ledger.begin(activity: activity, extra: false)
                ledger.finish(activity: "\(app.id)-\(session - 1)")
                precondition(ledger.activity == activity, "A stale session end cannot finish the new session")
                precondition(ledger.record(activity: activity, minute: 5, duration: 5, extra: false))
                ledger.finish(activity: activity)
                let nextMinutes = AppSessionPolicy.nextMinutes(rule: app, used: ledger.usedMinutes)
                let shield = ShieldPresentation.session(day: day, nextMinutes: nextMinutes, completedSessions: ledger.completedSessions,
                                                        messages: []).forFirstDay(true)
                precondition(ledger.usedMinutes == session * 5 && ledger.completedSessions == session)
                precondition((shield.action != nil) == (session * 5 < app.minutes))
                ledgers[app.id] = ledger
            }
        }
        precondition(ledgers.values.map(\.usedMinutes).sorted() == caps)
        precondition(!AppSessionLedger(day: "2026-11-5").extraUsed)
        let now = Date()
        precondition(AppSessionPolicy.blocks(allowance: nil, reached: false, day: day, now: now), "Initial launch must show reflection shield")
        let normal = DailyAppAllowance(activity: "normal", day: day, expiresAt: now.addingTimeInterval(3600), minutes: 15, isExtra: false)
        precondition(!AppSessionPolicy.blocks(allowance: normal, reached: false, day: day, now: now))
        precondition(AppSessionPolicy.blocks(allowance: normal, reached: true, day: day, now: now), "Daily cap must end normal access")
        let extra = DailyAppAllowance(activity: "extra", day: day, expiresAt: now.addingTimeInterval(3600), minutes: 10, isExtra: true)
        precondition(AppSessionPolicy.blocks(allowance: extra, reached: true, day: day, now: now))
        precondition(AppSessionPolicy.blocks(allowance: extra, reached: false, day: day, now: now), "Upgrades revoke old extra sessions")
        precondition(AppSessionPolicy.blocks(allowance: extra, reached: true, day: "2026-11-5", now: now), "Yesterday's session cannot grant access")
        precondition(AppSessionPolicy.blocks(allowance: normal, reached: false, day: day, now: normal.expiresAt))
        let legacy = DailyAppAllowance(activity: "legacy", day: day, expiresAt: now.addingTimeInterval(3600))
        precondition(AppSessionPolicy.blocks(allowance: legacy, reached: false, day: day, now: now))
        var catalog = DailyRuleCatalog(rules: [rule])
        catalog.setSessionMinutes(15, for: rule.id)
        precondition(catalog.rules[0].minutes == 30 && catalog.rules[0].sessionMinutes == 15)
        catalog.setMinutes(5, for: rule.id)
        precondition(catalog.rules[0].sessionMinutes == 5)
        var editedCatalog = DailyRuleCatalog(rules: [twoSessionRule])
        editedCatalog.setSessionMinutes(10, for: rule.id)
        var editedRule = editedCatalog.rules[0]
        func shield(used: Int, firstDay: Bool) -> ShieldPresentation {
            let remaining = AppSessionPolicy.nextMinutes(rule: editedRule, used: used)
            return ShieldPresentation.session(day: day, nextMinutes: remaining, completedSessions: 1,
                                              messages: []).forFirstDay(firstDay)
        }
        precondition(shield(used: 0, firstDay: true).actionLabel(appName: "LinkedIn") == "Continue to LinkedIn",
                     "A newly protected app has a first session available before Hoosh observes usage")
        precondition(shield(used: 20, firstDay: true).actionLabel(appName: "LinkedIn") == "Continue to LinkedIn")
        precondition(shield(used: 20, firstDay: true).actionLabel(appName: nil) == "Continue to app")
        let capped = shield(used: 30, firstDay: true)
        precondition(capped.dailyLimitReached == true && capped.action == nil)
        precondition(capped.explanation.contains("Stats tab in Hoosh"))
        let laterDayCap = shield(used: 30, firstDay: false)
        precondition(laterDayCap.title == "You’ve reached your daily app limit")
        precondition(laterDayCap.actionLabel(appName: "LinkedIn") == nil)
        precondition(ShieldPresentation.actionLabel(for: nil, appName: "LinkedIn", canCheckAvailability: true) == "Check session availability")
        precondition(ShieldPresentation.actionLabel(for: nil, appName: nil, canCheckAvailability: false) == nil)
        precondition(ShieldPresentation.actionLabel(for: laterDayCap, appName: "LinkedIn", canCheckAvailability: true) == nil)
        precondition(!AppSessionPolicy.finishesSession(progress: 3, duration: 5, used: 9, dailyLimit: 10))
        precondition(AppSessionPolicy.finishesSession(progress: 4, duration: 5, used: 10, dailyLimit: 10),
                     "Lowering the cap ends an active session when cumulative use reaches the new cap")
        precondition(AppSessionPolicy.finishesSession(progress: 5, duration: 5, used: 9, dailyLimit: 10))
        editedCatalog.setMinutes(45, for: rule.id)
        editedCatalog.setSessionMinutes(5, for: rule.id)
        editedRule = editedCatalog.rules[0]
        precondition(AppSessionPolicy.nextMinutes(rule: editedRule, used: 30) == 5)
        precondition(AppSessionPolicy.nextMinutes(rule: editedRule, used: 42) == 3,
                     "Raising the limit keeps prior usage")
        precondition(shield(used: 30, firstDay: true).actionLabel(appName: "LinkedIn") == "Continue to LinkedIn")
        precondition(shield(used: 45, firstDay: true).action == nil)
        var eastern = Calendar(identifier: .gregorian)
        eastern.timeZone = TimeZone(identifier: "America/New_York")!
        // November 1 is a 25-hour day. Even a session started one minute before midnight ends there.
        let lastMinute = eastern.date(from: DateComponents(year: 2026, month: 11, day: 1, hour: 23, minute: 59))!
        let midnight = eastern.date(from: DateComponents(year: 2026, month: 11, day: 2))!
        let window = DailyLimitPolicy.sessionWindow(at: lastMinute, calendar: eastern)
        precondition(window.end == midnight && window.duration >= 15 * 60 && window.contains(lastMinute))
        let yesterday = DailyLimitPolicy.day(at: lastMinute, calendar: eastern)
        let today = DailyLimitPolicy.day(at: midnight, calendar: eastern)
        let overnight = DailyAppAllowance(activity: "late", day: yesterday, expiresAt: window.end, minutes: 10, isExtra: false)
        precondition(AppSessionPolicy.blocks(allowance: overnight, reached: false, day: today, now: midnight))
        precondition(AppSessionPolicy.nextMinutes(rule: editedRule, used: AppSessionLedger(day: today).usedMinutes) == 5)
        print("PASS: session accounting, first-day cap guidance, settings edits, and daily allowance preservation")
    }
}
