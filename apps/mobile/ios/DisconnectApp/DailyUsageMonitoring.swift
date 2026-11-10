import DeviceActivity
import FamilyControls
import Foundation

/// Registers the day boundary. Individual session monitors account for active usage.
enum DailyUsageMonitoring {
    static let activity = PerAppProtection.activity
    static let errorKey = PerAppProtection.errorKey
    static var defaults: UserDefaults { PerAppProtection.defaults }

    static func prepareRules(selection: FamilyActivitySelection) throws -> [DailyAppRule] {
        var catalog = try PerAppProtection.catalog()
        let tokens = try selection.applicationTokens.map { try PerAppProtection.encode($0) }
        let ruleCount = catalog.rules.count
        catalog.reconcile(tokens: tokens)
        if catalog.rules.count != ruleCount { try PerAppProtection.save(catalog) }
        return catalog.selected(tokens: tokens)
    }
    static func setMinutes(_ minutes: Int, for id: String) throws {
        var catalog = try PerAppProtection.catalog()
        guard let previous = catalog.rules.first(where: { $0.id == id }) else { return }
        catalog.setMinutes(minutes, for: id)
        guard let updated = catalog.rules.first(where: { $0.id == id }), updated.minutes != previous.minutes else { return }
        try PerAppProtection.save(catalog)
        try PerAppProtection.reconcileShields(refreshingRuleID: id)
        StudyConfigurationHistory.capture(reason: "daily_limit_changed")
        NativeResearchQueue.enqueue("daily_limit_changed", properties: [
            "local_rule_id": id, "previous_minutes": String(previous.minutes), "new_minutes": String(updated.minutes)
        ])
    }
    static func setSessionMinutes(_ minutes: Int, for id: String) throws {
        var catalog = try PerAppProtection.catalog()
        guard let previous = catalog.rules.first(where: { $0.id == id }) else { return }
        catalog.setSessionMinutes(minutes, for: id)
        guard let updated = catalog.rules.first(where: { $0.id == id }), updated != previous else { return }
        try PerAppProtection.save(catalog)
        try PerAppProtection.reconcileShields(refreshingRuleID: id)
        StudyConfigurationHistory.capture(reason: "session_length_changed")
        NativeResearchQueue.enqueue("session_length_changed", properties: [
            "local_rule_id": id, "previous_minutes": String(previous.sessionMinutes), "new_minutes": String(updated.sessionMinutes)
        ])
    }
    static func setResearchLabel(_ text: String,for id: String) throws {
        var catalog=try PerAppProtection.catalog()
        catalog.setResearchLabel(text,for:id)
        try PerAppProtection.save(catalog)
        StudyConfigurationHistory.capture(reason:"app_label_changed")
    }
    static func install(selection: FamilyActivitySelection) throws {
        let rules = try prepareRules(selection: selection)
        guard !rules.isEmpty else { throw CocoaError(.validationMissingMandatoryProperty) }
        let center = DeviceActivityCenter()
        let wasEnabled = PerAppProtection.enabled
        defaults.set(true, forKey: PerAppProtection.enabledKey)
        do {
            // Replace any old all-day thresholds, which included usage before setup.
            if !center.activities.contains(activity) || !center.events(for: activity).isEmpty {
                try center.startMonitoring(activity, during: DeviceActivitySchedule(
                    intervalStart: DateComponents(hour: 0, minute: 0),
                    intervalEnd: DateComponents(hour: 23, minute: 59, second: 59), repeats: true))
                defaults.set(Date(), forKey: PerAppProtection.registeredKey)
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
        defaults.set(rules.count, forKey: PerAppProtection.countKey)
        try PerAppProtection.reconcileShields()
        StudyConfigurationHistory.capture(reason:"app_plan_reconciled")
    }
}
