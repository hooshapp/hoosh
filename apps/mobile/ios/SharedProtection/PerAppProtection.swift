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
    private static let dailyUsageFloorPrefix = "disconnect.dailyUsageFloor."
    static let allowancePrefix = "disconnect.appAllowance."
    static let allowanceActivityPrefix = "disconnectAppAllowance."
    static var defaults: UserDefaults { UserDefaults(suiteName: group)! }
    static var enabled: Bool { defaults.bool(forKey: enabledKey) }
    static let namedStoreMigrationKey = "disconnect.namedSessionStore.v1"
    static let sessionModeKey = "disconnect.intentionalSessions.v1"
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
    private static func dailyUsageFloor(for rule: DailyAppRule) -> Int {
        let observed = defaults.dictionary(forKey: dailyUsageFloorPrefix + rule.id)?[day] as? Int ?? 0
        let legacy = defaults.string(forKey: reachedPrefix + rule.id) == day ? rule.minutes : 0
        return max(observed, legacy)
    }
    private static func usedMinutes(for rule: DailyAppRule) -> Int {
        max(dailyUsageFloor(for: rule), ledger(for: rule.id).usedMinutes)
    }
    static func preserveLegacyDailyUsage(for rule: DailyAppRule) {
        guard defaults.string(forKey: reachedPrefix + rule.id) == day else { return }
        defaults.set([day: dailyUsageFloor(for: rule)], forKey: dailyUsageFloorPrefix + rule.id)
        defaults.removeObject(forKey: reachedPrefix + rule.id)
    }
    private static func reached(_ rule: DailyAppRule) -> Bool {
        usedMinutes(for: rule) >= rule.minutes
    }
    private static func nextSessionMinutes(_ rule: DailyAppRule) -> Int {
        let used = usedMinutes(for: rule)
        return AppSessionPolicy.nextMinutes(rule: rule, used: used, reached: used >= rule.minutes)
    }
    private static func presentation(for rule: DailyAppRule, messages: [String] = []) -> ShieldPresentation {
        ShieldPresentation.session(
            day: day, nextMinutes: nextSessionMinutes(rule),
            completedSessions: ledger(for: rule.id).completedSessions,
            messages: messages
        )
    }
    static func reconcileShields(refreshingRuleID: String? = nil) throws {
        let selected = try rules(for: selection())
        let today = day, now = Date()
        let previousDay = defaults.string(forKey: reconciledDayKey)
        let dayChanged = previousDay.map { $0 != today } ?? false
        var expiredActivities: [DeviceActivityName] = []
        defer {
            if !expiredActivities.isEmpty { DeviceActivityCenter().stopMonitoring(expiredActivities) }
        }
        for rule in try catalog().rules {
            if let reached = defaults.string(forKey: reachedPrefix + rule.id), reached != today {
                defaults.removeObject(forKey: reachedPrefix + rule.id)
            }
            if let current = allowance(for: rule.id),
               AppSessionPolicy.blocks(allowance: current, reached: reached(rule), day: today, now: now) {
                if let data = defaults.data(forKey:ledgerPrefix + rule.id),
                   var previous = try? JSONDecoder().decode(AppSessionLedger.self,from:data), previous.activity == current.activity {
                    recordUsage(ruleID:rule.id,allowance:current,state:previous,event:"session_expired")
                    previous.finish(activity: current.activity)
                    try saveLedger(previous, for: rule.id)
                }
                defaults.removeObject(forKey: allowancePrefix + rule.id)
                cancelNudges(for: rule.id)
                expiredActivities.append(DeviceActivityName(current.activity))
            }
        }
        let blocked = enabled ? selected.filter { rule in
            AppSessionPolicy.blocks(allowance: allowance(for: rule.id), reached: reached(rule), day: today, now: now)
        } : []
        let tokens = try Set(blocked.map { try token(for: $0) })
        // The same named store is shared by host and extensions. Save presentation
        // before the shield is visible, so rendering never has to query a monitor.
        let messages = PersonalizedNudgeLibrary.messages(answers: ShieldPresentationStore.answers(), selectedPrompts: ShieldPresentationStore.selectedPrompts())
        for rule in selected {
            try ShieldPresentationStore.save(presentation(for: rule, messages: messages), tokenData: rule.tokenData)
        }
        let store = settings
        let current = store.shield.applications ?? []
        let refresh = try Set(blocked.filter { dayChanged || $0.id == refreshingRuleID }.map { try token(for: $0) })
        if !tokens.isSubset(of: current) || !refresh.isEmpty { ShieldPresentationStore.synchronize() }
        // A Settings edit or a new day can change the copy while the app stays shielded.
        let remaining = current.subtracting(refresh)
        if remaining != current { store.shield.applications = remaining.isEmpty ? nil : remaining }
        if tokens != remaining { store.shield.applications = tokens.isEmpty ? nil : tokens }
        if store.shield.applicationCategories != nil { store.shield.applicationCategories = nil }
        if store.shield.webDomains != nil { store.shield.webDomains = nil }
        if store.shield.webDomainCategories != nil { store.shield.webDomainCategories = nil }
        // Retire this process's unnamed legacy shield after the shared store is set.
        let legacy = ManagedSettingsStore()
        if legacy.shield.applications != nil { legacy.shield.applications = nil }
        if legacy.shield.applicationCategories != nil { legacy.shield.applicationCategories = nil }
        if legacy.shield.webDomains != nil { legacy.shield.webDomains = nil }
        if legacy.shield.webDomainCategories != nil { legacy.shield.webDomainCategories = nil }
        defaults.set(today, forKey: reconciledDayKey)
        defaults.set(Date(), forKey: "disconnect.lastReconciledAt")
        defaults.set(blocked.count, forKey: "disconnect.desiredShieldCount")
        defaults.set(store.shield.applications?.count ?? 0, forKey: "disconnect.configuredShieldCount")
    }
    static func handleDailyEvent(_ event: DeviceActivityEvent.Name) throws {
        defaults.set(Date(), forKey: "disconnect.lastDailyEventReceivedAt")
        guard enabled,
              let rule = try rules(for: selection()).first(where: { $0.eventName == event.rawValue }) else { return }
        // The event name already identifies the selected app and rule revision.
        // Keep daily evidence separate from the session ledger written by minute callbacks.
        if dailyUsageFloor(for: rule) < rule.minutes {
            defaults.set([day: rule.minutes], forKey: dailyUsageFloorPrefix + rule.id)
            NativeResearchQueue.enqueue("daily_allowance_reached", properties:["local_rule_id":rule.id,"daily_minutes":String(rule.minutes)])
        }
        defaults.set(Date(), forKey: callbackKey)
        if let current = allowance(for: rule.id) { try endAllowance(for: rule.id, expectedActivity: current.activity) }
        else { try reconcileShields() }
    }
    static func cancelNudges(for id: String) {
        let identifiers = (1...240).map { "disconnect.session.\(id).\($0)" }
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
    }
    static func endAllowance(for id: String, expectedActivity: String? = nil) throws {
        let current = allowance(for: id)
        if let expectedActivity, current?.activity != expectedActivity { return }
        defaults.removeObject(forKey: allowancePrefix + id)
        defer {
            cancelNudges(for: id)
            if let current { DeviceActivityCenter().stopMonitoring([DeviceActivityName(current.activity)]) }
        }
        if let current {
            var state = ledger(for: id)
            state.finish(activity: current.activity)
            recordUsage(ruleID:id,allowance:current,state:state,event:"session_ended")
            try saveLedger(state, for: id)
        }
        try reconcileShields()
    }
    static func endAllAllowances() throws {
        for rule in try catalog().rules { try endAllowance(for: rule.id) }
    }
    enum SessionStart {
        case started, alreadyRunning, blocked
    }

    static func startSession(for rule: DailyAppRule) throws -> SessionStart {
        guard enabled else { return .blocked }
        if let current = allowance(for: rule.id) {
            let finished = current.minutes.map { ledger(for: rule.id).progress >= $0 } ?? true
            if finished || AppSessionPolicy.blocks(allowance: current, reached: reached(rule), day: day, now: Date()) {
                try endAllowance(for: rule.id, expectedActivity: current.activity)
            } else {
                // A repeated tap should restore access for the session already running.
                try reconcileShields()
                return .alreadyRunning
            }
        }
        // Screen Time can retain the old shield after an edit. Only the current
        // saved rule and daily allowance decide whether this tap grants access.
        let minutes = nextSessionMinutes(rule)
        guard minutes > 0 else {
            try reconcileShields()
            return .blocked
        }
        try startAllowance(for: rule, minutes: minutes)
        return .started
    }
    private static func startAllowance(for rule: DailyAppRule, minutes: Int) throws {
        guard minutes > 0, minutes <= 240 else { throw CocoaError(.validationMissingMandatoryProperty) }
        let center = DeviceActivityCenter(), now = Date(), calendar = Calendar.current
        let window = DailyLimitPolicy.sessionWindow(at: now, calendar: calendar)
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
        let current = DailyAppAllowance(activity: name.rawValue, day: DailyLimitPolicy.day(at: now, calendar: calendar), expiresAt: window.end, minutes: minutes, isExtra: false)
        let previousState = ledger(for: rule.id)
        var state = previousState
        state.usedMinutes = max(state.usedMinutes, dailyUsageFloor(for: rule))
        state.begin(activity: name.rawValue, extra: false)
        defaults.set(try JSONEncoder().encode(current), forKey: allowancePrefix + rule.id)
        try saveLedger(state, for: rule.id)
        do {
            try center.startMonitoring(name, during: DeviceActivitySchedule(
                intervalStart: calendar.dateComponents([.year,.month,.day,.hour,.minute,.second], from: window.start),
                intervalEnd: calendar.dateComponents([.year,.month,.day,.hour,.minute,.second], from: window.end), repeats: false), events: events)
        } catch {
            defaults.removeObject(forKey: allowancePrefix + rule.id)
            try saveLedger(previousState, for: rule.id)
            throw error
        }
        if defaults.string(forKey: NativeResearchQueue.userKey) != nil {
            DayTwoSettingsTipStore.recordUse(now: now)
        }
        NativeResearchQueue.enqueue("session_started",properties:["local_rule_id":rule.id,"session_id":name.rawValue,"session_day":day,"duration_minutes":String(minutes),"extra":"false"])
        try reconcileShields()
    }
    static func handleSessionEvent(_ event: DeviceActivityEvent.Name, activity name: DeviceActivityName) throws {
        guard enabled, event.rawValue.hasPrefix("sessionMinute."),
              let minute = Int(event.rawValue.dropFirst("sessionMinute.".count)),
              let rule = try rules(for: selection()).first(where: { allowance(for: $0.id)?.activity == name.rawValue }),
              let current = allowance(for: rule.id),
              let duration = current.minutes else { return }
        guard current.day == day, current.expiresAt > Date(), current.isExtra == false else {
            try reconcileShields()
            return
        }
        var state = ledger(for: rule.id)
        guard state.record(activity: name.rawValue, minute: minute, duration: duration, extra: false) else { return }
        let notify = AppSessionPolicy.nudgeMinutes(duration: duration).contains(minute) && minute > state.lastNotifiedMinute
        if notify { state.lastNotifiedMinute = minute }
        try saveLedger(state, for: rule.id)
        defaults.set(Date(), forKey: "disconnect.lastSessionUsageAt")
        if AppSessionPolicy.finishesSession(progress: minute, duration: duration,
                                            used: usedMinutes(for: rule), dailyLimit: rule.minutes) {
            try endAllowance(for: rule.id, expectedActivity: name.rawValue)
        }
        else if notify {
            recordUsage(ruleID:rule.id,allowance:current,state:state,event:"session_checkpoint")
            postNudge(rule: rule, activity: name.rawValue, minute: minute, duration: duration)
        }
    }
    static func finishAllowance(activity name: DeviceActivityName) throws {
        guard enabled,
              let rule = try catalog().rules.first(where: { allowance(for: $0.id)?.activity == name.rawValue }) else { return }
        // At midnight, preserve yesterday’s recorded usage before removing the old grant.
        if allowance(for: rule.id)?.day != day { try reconcileShields() }
        else { try endAllowance(for: rule.id, expectedActivity: name.rawValue) }
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
        let owner = defaults.string(forKey: NativeResearchQueue.userKey)
        let invite = owner != nil && DayTwoSettingsTipStore.take(session: activity)
        var source = "personalization_invitation"
        content.categoryIdentifier = nudgeCategory
        if invite {
            content.title = "Make Hoosh yours"
            content.body = DayTwoSettingsTipStore.message
            content.categoryIdentifier=DayTwoSettingsTipStore.category
            NativeResearchQueue.enqueue("personalization_invitation_requested",properties:["local_rule_id":rule.id,"session_id":activity])
        } else {
            let choice=BalancedNudgeSelection.savedChoice(
                questionnaire:PersonalizedNudgeLibrary.messages(answers: ShieldPresentationStore.answers(), selectedPrompts: ShieldPresentationStore.selectedPrompts()),
                context:LocalProductivityNudgeStore.messages(),recent:recent,channel:"notification")
            source=choice.source
            defaults.set(Array((recent+[choice.message]).suffix(32)),forKey:key)
            content.body="\(PersonalizedNudgeLibrary.remainingTime(duration-minute)) \(choice.message)"
        }
        NativeResearchQueue.enqueue("nudge_requested",properties:["local_rule_id":rule.id,"session_id":activity,"minute":String(minute),"nudge_source":source])
        content.userInfo = ["ruleID": rule.id, "sessionActivity": activity]
        if invite, let owner { content.userInfo["participantID"] = owner }
        content.sound = .default
        UNUserNotificationCenter.current().add(UNNotificationRequest(
            identifier: invite ? DayTwoSettingsTipStore.notificationID : "disconnect.session.\(rule.id).\(minute)", content: content, trigger: nil)) { error in
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
