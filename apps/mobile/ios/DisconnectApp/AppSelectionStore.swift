import Foundation
import FamilyControls

enum AppSelectionStore {
    private static let key = "familyActivitySelection"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: OnboardingResponseStore.appGroupID) ?? .standard
    }

    static func save(_ selection: FamilyActivitySelection) {
        do {
            let data = try PropertyListEncoder().encode(selection)
            defaults.set(data, forKey: key)
            _ = try? DailyUsageMonitoring.prepareRules(selection:selection)
            StudyConfigurationHistory.capture(reason:"protected_apps_changed")
            NotificationCenter.default.post(name: .disconnectSelectionChanged, object: nil)
        } catch {
            print("Failed to save FamilyActivitySelection:", error)
        }
    }

    static func appAndWebOnly(_ selection: FamilyActivitySelection) -> FamilyActivitySelection {
        selection
    }

    static func load() -> FamilyActivitySelection {
        let legacy = defaults.string(forKey:AccountWorkspace.ownerKey) == nil ? UserDefaults.standard.data(forKey:key) : nil
        guard let data = defaults.data(forKey: key) ?? legacy else {
            return FamilyActivitySelection()
        }

        do {
            return try PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
        } catch {
            print("Failed to load FamilyActivitySelection:", error)
            return FamilyActivitySelection()
        }
    }

    static func clear() {
        defaults.removeObject(forKey: key)
        UserDefaults.standard.removeObject(forKey: key)
        StudyConfigurationHistory.capture(reason:"protection_cleared")
    }
}

extension Notification.Name {
    static let disconnectSelectionChanged = Notification.Name("disconnectSelectionChanged")
}
