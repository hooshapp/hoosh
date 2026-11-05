import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings
import UserNotifications

/// Shared by the host and both action/monitor extensions to avoid divergent shield writers.
enum PerAppProtection {
    static var settings: ManagedSettingsStore { ManagedSettingsStore(named: .init("disconnect.sessions.v1")) }
    static let group = "group.com.AnishaDasgupta.DisconnectApp"
    static let activity = DeviceActivityName("disconnectDailyApps.v1")
    static let legacyActivity = DeviceActivityName("disconnectDailyUsage")
    static let catalogKey = "disconnect.dailyAppRules.v1"
    static let enabledKey = "disconnect.perAppMonitoringEnabled"
    static let errorKey = "disconnect.dailyMonitoringError"
    static let countKey = "disconnect.dailyRegisteredAppCount"
    static let registeredDayKey = "disconnect.dailyRegisteredDay.v2"
    static let reconciledDayKey = "disconnect.dailyReconciledDay.v2"
    static let lastIntervalStartKey = "disconnect.dailyIntervalStartedAt"
    static let lastIntervalEndKey = "disconnect.dailyIntervalEndedAt"
    static let registeredKey = "disconnect.dailyRegisteredAt"
    static let callbackKey = "disconnect.dailyLastCallbackAt"
    static let reachedPrefix = "disconnect.appReachedDay."
    static let allowancePrefix = "disconnect.appAllowance."
    static let allowanceActivityPrefix = "disconnectAppAllowance."
    static var defaults: UserDefaults { UserDefaults(suiteName: group)! }
    static var enabled: Bool { defaults.bool(forKey: enabledKey) }
    static let namedStoreMigrationKey = "disconnect.namedSessionStore.v1"
    static let sessionModeKey = "disconnect.intentionalSessions.v1"
    static let extraUsedDayPrefix = "disconnect.extraUsedDay."
    static let ledgerPrefix = "disconnect.sessionLedger."
    static let nudgeCategory = "disconnect.sessionNudge"
    static let endSessionAction = "disconnect.endSession"
    static var day: String { DailyLimitPolicy.day(at: Date()) }

    static func encode(_ token: ApplicationToken) throws -> Data {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        return try encoder.encode(token)
    }
    static func token(for rule: DailyAppRule) throws -> ApplicationToken {
        try JSONDecoder().decode(ApplicationToken.self, from: rule.tokenData)
    }
    static func selection() throws -> FamilyActivitySelection {
        guard let data = defaults.data(forKey: "familyActivitySelection") else { return FamilyActivitySelection() }
        return try PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
    }
    static func catalog() throws -> DailyRuleCatalog {
        guard let data = defaults.data(forKey: catalogKey) else { return DailyRuleCatalog() }
        return try DailyRuleCatalog.decode(data)
    }
    static func save(_ catalog: DailyRuleCatalog) throws {
        defaults.set(try JSONEncoder().encode(catalog), forKey: catalogKey)
    }
    static func rules(for selection: FamilyActivitySelection) throws -> [DailyAppRule] {
        try catalog().selected(tokens: selection.applicationTokens.map { try encode($0) })
    }
    static func record(for token: ApplicationToken) throws -> DailyAppRule? {
        let data = try encode(token)
        return try rules(for: selection()).first { $0.tokenData == data }
    }
    static func allowance(for id: String) -> DailyAppAllowance? {
        guard let data = defaults.data(forKey: allowancePrefix + id) else { return nil }
        return try? JSONDecoder().decode(DailyAppAllowance.self, from: data)
    }
    static func ledger(for id: String) -> AppSessionLedger {
        guard let data = defaults.data(forKey: ledgerPrefix + id),
              let value = try? JSONDecoder().decode(AppSessionLedger.self, from: data), value.day == day else {
            return AppSessionLedger(day: day)
        }
        return value
    }
    static func saveLedger(_ value: AppSessionLedger, for id: String) throws {
        defaults.set(try JSONEncoder().encode(value), forKey: ledgerPrefix + id)
    }
    static func reached(_ rule: DailyAppRule) -> Bool {
        defaults.string(forKey: reachedPrefix + rule.id) == day || ledger(for: rule.id).usedMinutes >= rule.minutes
    }
    static func nextSessionMinutes(_ rule: DailyAppRule) -> Int {
        AppSessionPolicy.nextMinutes(rule: rule, used: ledger(for: rule.id).usedMinutes, reached: reached(rule))
    }
    static func canExtend(_ rule: DailyAppRule) -> Bool {
        nextSessionMinutes(rule) == 0 && defaults.string(forKey: extraUsedDayPrefix + rule.id) != day
    }
    static func reconcileShields() throws {
        let selected = try rules(for: selection())
        let today = day, now = Date()
        for rule in try catalog().rules {
            if let reached = defaults.string(forKey: reachedPrefix + rule.id), reached != today {
                defaults.removeObject(forKey: reachedPrefix + rule.id)
            }
            if let current = allowance(for: rule.id), current.day != today || current.expiresAt <= now || current.minutes == nil {
                if let data = defaults.data(forKey:ledgerPrefix + rule.id),
                   let previous = try? JSONDecoder().decode(AppSessionLedger.self,from:data), previous.activity == current.activity {
                    recordUsage(ruleID:rule.id,allowance:current,state:previous,event:"session_expired")
                }
                // Old bypasses are not intentional sessions. Never migrate them as access grants.
                defaults.removeObject(forKey: allowancePrefix + rule.id)
                DeviceActivityCenter().stopMonitoring([DeviceActivityName(current.activity)])
            }
        }
        defaults.set(today, forKey: reconciledDayKey)
        let blocked = enabled ? selected.filter { rule in
            AppSessionPolicy.blocks(allowance: allowance(for: rule.id), reached: reached(rule), day: today, now: now)
        } : []
        let tokens = try Set(blocked.map { try token(for: $0) })
        // The same named store is shared by host and extensions. Save presentation
        // before the shield is visible, so rendering never has to query a monitor.
        let messages = PersonalizedNudgeLibrary.messages(answers: ShieldPresentationStore.answers())
        for rule in selected {
            let next = nextSessionMinutes(rule)
            let exhausted = next == 0
            let extra = exhausted && canExtend(rule)
            let ended = ledger(for: rule.id).completedSessions > 0
            try ShieldPresentationStore.save(ShieldPresentation(day: today,
                title: exhausted ? "Today's allowance is used" : (ended ? "Your session has ended" : "Pause and choose"),
                explanation: exhausted ? (extra ? "One optional 10-minute extension is available today." : "Your daily allowance renews tomorrow.") : "Choose a \(next)-minute session, or step away for now.",
                action: exhausted ? (extra ? "Add 10 extra minutes" : nil) : "Start a \(next)-minute session",
                messages: messages), tokenData: rule.tokenData)
        }
        let store = settings
        store.shield.applications = tokens.isEmpty ? nil : tokens
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        store.shield.webDomainCategories = nil
        // Retire this process's unnamed legacy shield after the shared store is set.
        let legacy = ManagedSettingsStore()
        legacy.shield.applications = nil
        legacy.shield.applicationCategories = nil
        legacy.shield.webDomains = nil
        legacy.shield.webDomainCategories = nil
        defaults.set(Date(), forKey: "disconnect.lastReconciledAt")
        defaults.set(blocked.count, forKey: "disconnect.desiredShieldCount")
        defaults.set(store.shield.applications?.count ?? 0, forKey: "disconnect.configuredShieldCount")
    }
    static func handleDailyEvent(_ event: DeviceActivityEvent.Name) throws {
        defaults.set(Date(), forKey: "disconnect.lastDailyEventReceivedAt")
        guard enabled,
              let rule = try rules(for: selection()).first(where: { $0.eventName == event.rawValue }),
              let installed = DeviceActivityCenter().events(for: activity)[event],
              installed.applications == [try token(for: rule)], installed.threshold.minute == rule.minutes else { return }
        NativeResearchQueue.enqueue("daily_allowance_reached", properties:["local_rule_id":rule.id,"daily_minutes":String(rule.minutes)])
        defaults.set(day, forKey: reachedPrefix + rule.id)
        defaults.set(Date(), forKey: callbackKey)
        var state = ledger(for: rule.id)
        state.usedMinutes = max(state.usedMinutes, rule.minutes)
        try saveLedger(state, for: rule.id)
        if allowance(for: rule.id)?.isExtra == false { try endAllowance(for: rule.id) }
        else { try reconcileShields() }
    }
    static func cancelNudges(for id: String) {
        let identifiers = (1...240).map { "disconnect.session.\(id).\($0)" }
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
    }
    static func endAllowance(for id: String) throws {
        let current = allowance(for: id)
        defaults.removeObject(forKey: allowancePrefix + id)
        if let current {
            var state = ledger(for: id)
            state.finish(activity: current.activity)
            recordUsage(ruleID:id,allowance:current,state:state,event:"session_ended")
            try saveLedger(state, for: id)
            DeviceActivityCenter().stopMonitoring([DeviceActivityName(current.activity)])
        }
        cancelNudges(for: id)
        try reconcileShields()
    }
    static func endAllAllowances() throws {
        for rule in try catalog().rules { try endAllowance(for: rule.id) }
    }
    static func startSession(for rule: DailyAppRule) throws {
        guard enabled, allowance(for: rule.id) == nil else {
            // Repeated taps must not restart or duplicate the same session.
            try reconcileShields()
            return
        }
        let normalMinutes = nextSessionMinutes(rule)
        let extra = normalMinutes == 0
        guard !extra || canExtend(rule) else { throw CocoaError(.featureUnsupported) }
        try startAllowance(for: rule, minutes: extra ? AppSessionPolicy.extraMinutes : normalMinutes, extra: extra)
    }
    private static func startAllowance(for rule: DailyAppRule, minutes: Int, extra: Bool) throws {
        guard minutes > 0, minutes <= 240 else { throw CocoaError(.validationMissingMandatoryProperty) }
        let center = DeviceActivityCenter(), now = Date(), calendar = Calendar.current
        let end = now.addingTimeInterval(24 * 60 * 60)
        let name = DeviceActivityName(allowanceActivityPrefix + rule.id + "." + UUID().uuidString)
        let app = try token(for: rule)
        guard #available(iOS 17.4, *) else { throw CocoaError(.featureUnsupported) }
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
        // Minute checkpoints persist actual foreground usage and allow early exit without
        // charging the unused rest of a session. Only quarter milestones notify.
        for minute in 1...minutes {
            events[DeviceActivityEvent.Name("sessionMinute.\(minute)")] = DeviceActivityEvent(
                applications: [app], threshold: DateComponents(minute: minute), includesPastActivity: false)
        }
        let current = DailyAppAllowance(activity: name.rawValue, day: day, expiresAt: end, minutes: minutes, isExtra: extra)
        let previousState = ledger(for: rule.id)
        var state = previousState
        state.begin(activity: name.rawValue, extra: extra)
        defaults.set(try JSONEncoder().encode(current), forKey: allowancePrefix + rule.id)
        try saveLedger(state, for: rule.id)
        // Keep the one-time extension grant independent of progress updates from
        // the daily monitor so a late callback cannot restore an extension.
        if extra { defaults.set(day, forKey: extraUsedDayPrefix + rule.id) }
        do {
            try center.startMonitoring(name, during: DeviceActivitySchedule(
                intervalStart: calendar.dateComponents([.year,.month,.day,.hour,.minute,.second], from: now.addingTimeInterval(-60)),
                intervalEnd: calendar.dateComponents([.year,.month,.day,.hour,.minute,.second], from: end), repeats: false), events: events)
        } catch {
            defaults.removeObject(forKey: allowancePrefix + rule.id)
            try saveLedger(previousState, for: rule.id)
            if extra { defaults.removeObject(forKey: extraUsedDayPrefix + rule.id) }
            throw error
        }
        NativeResearchQueue.enqueue("session_started",properties:["local_rule_id":rule.id,"session_id":name.rawValue,"session_day":day,"duration_minutes":String(minutes),"extra":String(extra)])
        try reconcileShields()
    }
    static func handleSessionEvent(_ event: DeviceActivityEvent.Name, activity name: DeviceActivityName) throws {
        guard enabled, event.rawValue.hasPrefix("sessionMinute."),
              let minute = Int(event.rawValue.dropFirst("sessionMinute.".count)),
              let rule = try rules(for: selection()).first(where: { allowance(for: $0.id)?.activity == name.rawValue }),
              let current = allowance(for: rule.id), current.day == day,
              let duration = current.minutes, let extra = current.isExtra else { return }
        var state = ledger(for: rule.id)
        guard state.record(activity: name.rawValue, minute: minute, duration: duration, extra: extra) else { return }
        let notify = AppSessionPolicy.nudgeMinutes(duration: duration).contains(minute) && minute > state.lastNotifiedMinute
        if notify { state.lastNotifiedMinute = minute }
        try saveLedger(state, for: rule.id)
        defaults.set(Date(), forKey: "disconnect.lastSessionUsageAt")
        if minute >= duration { try endAllowance(for: rule.id) }
        else if notify {
            recordUsage(ruleID:rule.id,allowance:current,state:state,event:"session_checkpoint")
            postNudge(rule: rule, activity: name.rawValue, minute: minute, duration: duration)
        }
    }
    static func finishAllowance(activity name: DeviceActivityName) throws {
        guard enabled,
              let rule = try catalog().rules.first(where: { allowance(for: $0.id)?.activity == name.rawValue }) else { return }
        // The 24h safety boundary is not evidence of a completed usage duration.
        try endAllowance(for: rule.id)
    }
    static func recordUsage(ruleID: String, allowance: DailyAppAllowance, state: AppSessionLedger, event: String) {
        NativeResearchQueue.enqueue(event,properties:["local_rule_id":ruleID,"session_id":allowance.activity,
            "session_day":allowance.day,"used_minutes":String(state.progress),"extra":String(allowance.isExtra ?? false)])
    }
    static func recordActiveSessionSamples() {
        guard let rules = try? rules(for:selection()) else { return }
        for rule in rules {
            if let current = allowance(for:rule.id), current.day == day {
                recordUsage(ruleID:rule.id,allowance:current,state:ledger(for:rule.id),event:"session_snapshot")
            }
        }
    }
    static func postNudge(rule: DailyAppRule, activity: String, minute: Int, duration: Int) {
        let content = UNMutableNotificationContent()
        content.title = "A moment to check in"
        guard minute > 0, minute < duration else { return }
        let key = "disconnect.recentSessionNudges.v1"
        let recent = defaults.stringArray(forKey:key) ?? []
        let tip=DayTwoSettingsTipStore.take(session:activity)
        var source="settings_tip"
        content.categoryIdentifier = nudgeCategory
        if let tip {
            content.title="Make Disconnect yours"
            content.body=tip
            content.categoryIdentifier=DayTwoSettingsTipStore.category
            NativeResearchQueue.enqueue("settings_tip_requested",properties:["local_rule_id":rule.id,"session_id":activity])
        } else {
            let choice=BalancedNudgeSelection.savedChoice(
                questionnaire:PersonalizedNudgeLibrary.messages(answers:ShieldPresentationStore.answers()),
                context:LocalProductivityNudgeStore.messages(),recent:recent,channel:"notification")
            source=choice.source
            defaults.set(Array((recent+[choice.message]).suffix(32)),forKey:key)
            content.body="\(PersonalizedNudgeLibrary.remainingTime(duration-minute)) \(choice.message)"
        }
        NativeResearchQueue.enqueue("nudge_requested",properties:["local_rule_id":rule.id,"session_id":activity,"minute":String(minute),"nudge_source":source])
        content.userInfo = ["ruleID": rule.id, "sessionActivity": activity]
        content.sound = .default
        UNUserNotificationCenter.current().add(UNNotificationRequest(
            identifier: "disconnect.session.\(rule.id).\(minute)", content: content, trigger: nil)) { error in
                NativeResearchQueue.enqueue(error == nil ? "nudge_request_accepted" : "nudge_request_failed",
                    properties:["local_rule_id":rule.id,"session_id":activity,"minute":String(minute)])
            }
    }
    static func stop() throws {
        defaults.set(false, forKey: enabledKey)
        try endAllAllowances()
        DeviceActivityCenter().stopMonitoring([activity, legacyActivity, DeviceActivityName("disconnectShieldBypass"), DeviceActivityName("disconnectBypassUsage")])
        defaults.set(0, forKey: countKey)
    }
}
