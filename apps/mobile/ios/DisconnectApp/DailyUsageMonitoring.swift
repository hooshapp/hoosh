import DeviceActivity
import FamilyControls
import Foundation

/// One OS event per selected application. Counts are never derived from a JS/host timer.
enum DailyUsageMonitoring {
    static let activity = PerAppProtection.activity
    static let limitKey = "disconnect.dailyUsageLimitMinutes" // previous shared value is a default for new rules only
    static let errorKey = PerAppProtection.errorKey
    static var defaults: UserDefaults { PerAppProtection.defaults }

    static func prepareRules(selection: FamilyActivitySelection) throws -> [DailyAppRule] {
        var catalog = try PerAppProtection.catalog()
        let saved = defaults.integer(forKey: limitKey)
        catalog.reconcile(tokens: try selection.applicationTokens.map { try PerAppProtection.encode($0) }, defaultMinutes: saved == 0 ? 30 : saved)
        try PerAppProtection.save(catalog)
        return try PerAppProtection.rules(for: selection)
    }
    static func setMinutes(_ minutes: Int, for id: String) throws {
        var catalog = try PerAppProtection.catalog()
        let oldMinutes = catalog.rules.first { $0.id == id }?.minutes ?? 0
        catalog.setMinutes(minutes, for: id)
        try PerAppProtection.save(catalog)
        StudyConfigurationHistory.capture(reason:"daily_limit_changed")
        if oldMinutes != minutes { NativeResearchQueue.enqueue("daily_limit_changed",properties:["local_rule_id":id,"previous_minutes":String(oldMinutes),"new_minutes":String(minutes)]) }
        if let updated = catalog.rules.first(where: { $0.id == id }), updated.minutes > oldMinutes,
           PerAppProtection.ledger(for: id).usedMinutes < updated.minutes {
            // Preserve consumed usage; the new native daily event includes earlier activity.
            defaults.removeObject(forKey: PerAppProtection.reachedPrefix + id)
        }
    }
    static func setSessionMinutes(_ minutes: Int, for id: String) throws {
        var catalog = try PerAppProtection.catalog()
        let old=catalog.rules.first { $0.id==id }?.sessionMinutes
        catalog.setSessionMinutes(minutes, for: id)
        try PerAppProtection.save(catalog)
        StudyConfigurationHistory.capture(reason:"session_length_changed")
        if old != minutes { NativeResearchQueue.enqueue("session_length_changed",properties:["local_rule_id":id,"previous_minutes":String(old ?? 0),"new_minutes":String(minutes)]) }
    }
    static func setResearchLabel(_ text: String,for id: String) throws {
        var catalog=try PerAppProtection.catalog()
        catalog.setResearchLabel(text,for:id)
        try PerAppProtection.save(catalog)
        StudyConfigurationHistory.capture(reason:"app_label_changed")
    }
    static func install(selection: FamilyActivitySelection) throws {
        var rules = try prepareRules(selection: selection)
        let today = PerAppProtection.day
        // A new event identity makes a stale registration recoverable on foreground.
        // includesPastActivity retains today's usage rather than granting a fresh budget.
        let newDay = defaults.string(forKey: PerAppProtection.registeredDayKey) != today || !defaults.bool(forKey: PerAppProtection.sessionModeKey) || !defaults.bool(forKey: PerAppProtection.namedStoreMigrationKey)
        if newDay {
            var catalog = try PerAppProtection.catalog()
            let ids = Set(rules.map(\.id))
            for i in catalog.rules.indices where ids.contains(catalog.rules[i].id) {
                catalog.rules[i].revision += 1
            }
            try PerAppProtection.save(catalog)
            rules = try PerAppProtection.rules(for: selection)
        }
        guard !rules.isEmpty else { throw CocoaError(.validationMissingMandatoryProperty) }
        let center = DeviceActivityCenter()
        let existing = center.events(for: activity)
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
        for rule in rules {
            let token = try PerAppProtection.token(for: rule)
            let event: DeviceActivityEvent
            if #available(iOS 17.4, *) {
                event = DeviceActivityEvent(applications: [token], threshold: DateComponents(minute: rule.minutes), includesPastActivity: true)
            } else {
                event = DeviceActivityEvent(applications: [token], threshold: DateComponents(minute: rule.minutes))
            }
            events[DeviceActivityEvent.Name(rule.eventName)] = event
        }
        let unchanged = center.activities.contains(activity) && existing.count == events.count && events.allSatisfy { name, event in
            existing[name]?.applications == event.applications && existing[name]?.threshold.minute == event.threshold.minute
        }
        let wasEnabled = PerAppProtection.enabled
        defaults.set(true, forKey: PerAppProtection.enabledKey)
        do {
            if !unchanged {
                try center.startMonitoring(activity, during: DeviceActivitySchedule(
                    intervalStart: DateComponents(hour: 0, minute: 0),
                    intervalEnd: DateComponents(hour: 23, minute: 59, second: 59), repeats: true), events: events)
            }
        } catch {
            defaults.set(wasEnabled, forKey: PerAppProtection.enabledKey)
            throw error
        }
        // Retire aggregate/wall-clock legacy monitors; their callbacks must not clear per-app shields.
        center.stopMonitoring([PerAppProtection.legacyActivity, .disconnectShieldBypass, DeviceActivityName("disconnectBypassUsage")])
        let activeIDs = Set(rules.map(\.id))
        for stale in try PerAppProtection.catalog().rules where !activeIDs.contains(stale.id) {
            if PerAppProtection.allowance(for: stale.id) != nil { try PerAppProtection.endAllowance(for: stale.id) }
        }
        OnboardingResponseStore.clearBypass()
        BreakReminderScheduler.cancelBreakReminders()
        defaults.set(true, forKey: PerAppProtection.namedStoreMigrationKey)
        defaults.set(true, forKey: PerAppProtection.sessionModeKey)
        defaults.set(today, forKey: PerAppProtection.registeredDayKey)
        defaults.set(rules.count, forKey: PerAppProtection.countKey)
        defaults.set(Date(), forKey: PerAppProtection.registeredKey)
        try PerAppProtection.reconcileShields()
        StudyConfigurationHistory.capture(reason:"app_plan_reconciled")
    }
}
