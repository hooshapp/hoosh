import Foundation
import DeviceActivity
import FamilyControls
import ManagedSettings
import UserNotifications

/// These are the settings stores used by the audited Swift pilot and shared host.
/// No participant preferences, selection bytes or research outbox are deleted.
enum ProtectionDeviceTransition {
  private static var settings: [ManagedSettingsStore] {
    [ManagedSettingsStore(),
     ManagedSettingsStore(named: .init("disconnect.sessions.v1")),
     ManagedSettingsStore(named: .init("disconnect.dailyCap.v1")),
     ManagedSettingsStore(named: .init("hoosh.shared.protection.v1"))]
  }
  static var protectionPresent: Bool {
    !DeviceActivityCenter().activities.isEmpty || settings.contains(where: { !empty($0) })
  }
  static func legacyPresent() throws -> Bool {
    guard let defaults = UserDefaults(suiteName: SharedProtectionStore.group),
          FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: SharedProtectionStore.group) != nil else {
      throw ProtectionStoreError.unavailable
    }
    // Presence is enough; corrupt pilot bytes must not look like an empty setup.
    return defaults.object(forKey: "familyActivitySelection") != nil
      || UserDefaults.standard.object(forKey: "familyActivitySelection") != nil
      || protectionPresent
  }
  static func stopAndVerify() throws {
    // The user's confirmation explicitly stops all Hoosh monitoring on this device.
    // DeviceActivityCenter is scoped to this app, not other vendors' activities.
    let center = DeviceActivityCenter()
    let activities = center.activities
    if !activities.isEmpty { center.stopMonitoring(activities) }
    for store in settings { store.clearAllSettings() }
    let identifiers = (1...60).map { "disconnect.breakReminder.\($0)" }
    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
    guard center.activities.isEmpty, settings.allSatisfy({ empty($0) }) else {
      throw InstallationError.stopUnverified
    }
  }
  private static func empty(_ store: ManagedSettingsStore) -> Bool {
    (store.shield.applications?.isEmpty ?? true) && store.shield.applicationCategories == nil
      && (store.shield.webDomains?.isEmpty ?? true) && store.shield.webDomainCategories == nil
  }
}
