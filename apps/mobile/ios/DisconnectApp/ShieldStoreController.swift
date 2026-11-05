import Foundation
import DeviceActivity
import FamilyControls
import ManagedSettings
import os

class ShieldStoreController {
    // Corrected: Use ManagedSettingsStore instead of just Store
    let store = ManagedSettingsStore()
    private let logger = Logger(subsystem: "com.AnishaDasgupta.DisconnectApp", category: "ShieldStore")

    func shieldSelectedApps() {
        refreshShieldStateAfterInstallOrRun()
    }

    func refreshShieldStateAfterInstallOrRun() {
        guard OnboardingResponseStore.hasCompletedOnboarding else { return }
        guard AuthorizationCenter.shared.authorizationStatus == .approved else {
            DailyUsageMonitoring.defaults.set("Screen Time permission is required.", forKey: DailyUsageMonitoring.errorKey)
            return
        }
        let selection = AppSelectionStore.load()
        guard !selection.applicationTokens.isEmpty else {
            try? PerAppProtection.stop()
            removeAllShields()
            if !selection.categoryTokens.isEmpty || !selection.webDomainTokens.isEmpty {
                DailyUsageMonitoring.defaults.set("Choose individual apps inside Apple's picker to enable daily limits. Whole categories and websites do not have per-app limits.", forKey: DailyUsageMonitoring.errorKey)
            } else { DailyUsageMonitoring.defaults.removeObject(forKey: DailyUsageMonitoring.errorKey) }
            return
        }
        do {
            try DailyUsageMonitoring.install(selection: selection)
            DailyUsageMonitoring.defaults.removeObject(forKey: DailyUsageMonitoring.errorKey)
            // DailyUsageMonitoring reconciles only reached individual-app rules.
        } catch {
            DailyUsageMonitoring.defaults.set("Could not start Screen Time monitoring. Please retry.", forKey: DailyUsageMonitoring.errorKey)
            logger.error("Daily usage monitoring failed: \(String(describing: error), privacy: .public)")
        }
    }

    private func applySelection(_ selection: FamilyActivitySelection) {
        logger.notice("Applying shield selection. apps: \(selection.applicationTokens.count, privacy: .public), categories: \(selection.categoryTokens.count, privacy: .public), webDomains: \(selection.webDomainTokens.count, privacy: .public)")
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
        store.shield.webDomainCategories = selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
    }

    func removeAllShields() {
        logger.notice("Removing all shields")
        PerAppProtection.settings.clearAllSettings()
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        store.shield.webDomainCategories = nil
    }

    func startBypass(minutes: Int) {
        guard !PerAppProtection.enabled else { return }
        OnboardingResponseStore.setBypass(minutes: minutes)
        BreakReminderScheduler.scheduleBreakReminders(minutes: minutes, responses: OnboardingResponseStore.load())
        DeviceActivityBypassMonitorScheduler.scheduleBypassMonitor(minutes: minutes)
        removeAllShields()
        scheduleShieldReapply(at: Date().addingTimeInterval(TimeInterval(minutes * 60)))
    }

    func endBypassBecauseUserReturnedToDisconnect() {
        if PerAppProtection.enabled {
            refreshShieldStateAfterInstallOrRun()
            return
        }
        guard OnboardingResponseStore.bypassUntil() != nil else {
            shieldSelectedApps()
            return
        }

        OnboardingResponseStore.clearBypass()
        BreakReminderScheduler.cancelBreakReminders()
        DeviceActivityBypassMonitorScheduler.stopBypassMonitors()
        shieldSelectedApps()
    }

    private func scheduleShieldReapply(at date: Date) {
        let delay = max(0, date.timeIntervalSinceNow)

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            OnboardingResponseStore.clearBypass()
            self?.shieldSelectedApps()
        }
    }
}

enum DeviceActivityBypassMonitorScheduler {
    static func stopBypassMonitors() {
        DeviceActivityCenter().stopMonitoring([.disconnectShieldBypass])
    }

    static func scheduleBypassMonitor(minutes: Int) {
        let clampedMinutes = min(max(minutes, 1), 60)
        let center = DeviceActivityCenter()
        let calendar = Calendar.current
        let now = Date()
        let selection = AppSelectionStore.load()

        // Relock just before the final reminder fires so the shield is ready on first presentation.
        let relockStart = now.addingTimeInterval(max(1, TimeInterval(clampedMinutes * 60) - 2))
        let relockEnd = relockStart.addingTimeInterval(15 * 60)
        let schedule = DeviceActivitySchedule(
            intervalStart: calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: relockStart),
            intervalEnd: calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: relockEnd),
            repeats: false
        )
        let event = DeviceActivityEvent(
            applications: selection.applicationTokens,
            categories: selection.categoryTokens,
            webDomains: selection.webDomainTokens,
            threshold: DateComponents(minute: 1)
        )
        let events: [DeviceActivityEvent.Name: DeviceActivityEvent] =
            event.includesAllActivity ? [:] : [.disconnectShieldBypassLimit: event]

        center.stopMonitoring([.disconnectShieldBypass])

        do {
            try center.startMonitoring(.disconnectShieldBypass, during: schedule, events: events)
        } catch {
            print("Failed to schedule bypass monitor:", error)
        }
    }
}

extension DeviceActivityName {
    static let disconnectShieldBypass = Self("disconnectShieldBypass")
}

extension DeviceActivityEvent.Name {
    static let disconnectShieldBypassLimit = Self("disconnectShieldBypassLimit")
}
