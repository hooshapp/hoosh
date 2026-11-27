import Foundation

/// Deliberate product gate. No preference, environment variable or JS argument
/// can bypass the outstanding physical-device timing acceptance.
enum ProtectionActivationGate {
  // Explicitly compiled physical QA build; production remains gated until device acceptance.
  #if HOOSH_PHYSICAL_NUDGE_QA
  static let enabled = true
  #else
  static let enabled = false
  #endif
}

#if os(iOS)
import DeviceActivity
import FamilyControls
import ManagedSettings

struct ProtectionOSMonitor {
  let name: String
  let envelope: ProtectionMonitorEnvelope
  var usageApplications: Set<ApplicationToken> = []
  var usageThresholds: [Int] = []
  var usageOffsetSeconds = 0
  func events() throws -> [DeviceActivityEvent.Name: DeviceActivityEvent] {
    guard !usageThresholds.isEmpty else { return [:] }
    guard #available(iOS 17.4, *), !usageApplications.isEmpty, usageThresholds.count <= 244,
      usageThresholds.allSatisfy({ $0 > usageOffsetSeconds && $0 <= 86400 }) else { throw ProtectionTransactionError.invalid }
    return Dictionary(uniqueKeysWithValues: usageThresholds.map { seconds in
      (DeviceActivityEvent.Name("usage.\(seconds)"), DeviceActivityEvent(applications: usageApplications,
        threshold: DateComponents(second: seconds - usageOffsetSeconds), includesPastActivity: false))
    })
  }
  func schedule() throws -> DeviceActivitySchedule {
    guard name.hasPrefix("hoosh.shared."), name.utf8.count <= 256,
          envelope.startsAt >= 0, envelope.endsAt > envelope.startsAt,
          envelope.startsAt % 1000 == 0, envelope.endsAt % 1000 == 0, envelope.businessStartsAt % 1000 == 0,
          envelope.endsAt - envelope.startsAt >= 900000,
          envelope.endsAt - envelope.startsAt <= 172800000,
          envelope.businessStartsAt >= envelope.startsAt,
          envelope.businessStartsAt < envelope.endsAt else { throw ProtectionTransactionError.invalid }
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(secondsFromGMT: 0)!
    let keys: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]
    var start = calendar.dateComponents(keys, from: Date(timeIntervalSince1970: Double(envelope.startsAt) / 1000))
    var end = calendar.dateComponents(keys, from: Date(timeIntervalSince1970: Double(envelope.endsAt) / 1000))
    start.calendar = calendar; start.timeZone = calendar.timeZone
    end.calendar = calendar; end.timeZone = calendar.timeZone
    let warning: DateComponents?
    if let seconds = envelope.warningSeconds {
      guard seconds > 0, seconds <= 172800,
            Int64(seconds) * 1000 == envelope.endsAt - envelope.businessStartsAt else { throw ProtectionTransactionError.invalid }
      warning = DateComponents(second: seconds)
    } else {
      guard envelope.businessStartsAt == envelope.startsAt else { throw ProtectionTransactionError.invalid }
      warning = nil
    }
    return DeviceActivitySchedule(intervalStart: start, intervalEnd: end, repeats: false, warningTime: warning)
  }
}

/// Scoped SDK primitives, not the complete policy driver or a recurrence engine.
/// A finite monitor plan must never be presented as an indefinitely installed plan.
/// Mutation callers must hold the shared owner transaction lock; no JS entry point
/// is exposed. Second alignment is required instead of silently rounding deadlines.
enum ProtectionOSAdapter {
  private static var center: DeviceActivityCenter { DeviceActivityCenter() }
  // A named store is shared by the host, monitor and shield action.
  private static let settings = ManagedSettingsStore(named: .init("hoosh.shared.protection.v1"))
  private static let previousSettings = ManagedSettingsStore()
  static var scopedMonitorCount: Int { center.activities.filter { $0.rawValue.hasPrefix("hoosh.shared.") }.count }
  static func monitorNames(prefix: String) -> Set<String> {
    guard prefix.hasPrefix("hoosh.shared.") else { return [] }
    return Set(center.activities.map(\.rawValue).filter { $0.hasPrefix(prefix) })
  }
  static func isBlocked(_ application: ApplicationToken) -> Bool {
    settings.shield.applications?.contains(application) == true ||
      previousSettings.shield.applications?.contains(application) == true
  }
  static func matchesBlockedApps(_ applications: Set<ApplicationToken>) -> Bool {
    matches(settings, applications: applications) && matches(previousSettings, applications: [])
  }
  private static func matches(_ store: ManagedSettingsStore, applications: Set<ApplicationToken>) -> Bool {
    (store.shield.applications ?? []) == applications && store.shield.applicationCategories == nil
      && (store.shield.webDomains?.isEmpty ?? true) && store.shield.webDomainCategories == nil
  }
  static func matches(_ monitor: ProtectionOSMonitor) throws -> Bool {
    let expected = try monitor.schedule()
    guard let schedule = center.schedule(for: DeviceActivityName(monitor.name)) else { return false }
    let expectedEvents = try monitor.events()
    return schedule == expected && center.events(for: DeviceActivityName(monitor.name)) == expectedEvents
  }
  /// Stage new unique names before retiring a confirmed generation. Same-name
  /// conflicting schedules are rejected rather than overwritten in place.
  static func stage(_ monitors: [ProtectionOSMonitor], preserving previous: Set<String>) throws {
    try requireActivation()
    guard monitors.count <= 512, Set(monitors.map(\.name)).count == monitors.count,
          previous.allSatisfy({ $0.hasPrefix("hoosh.shared.") && $0.utf8.count <= 256 }) else { throw ProtectionTransactionError.invalid }
    let plans = try monitors.map { ($0, try $0.schedule(), try $0.events()) }
    let registered = Set(center.activities.map(\.rawValue))
    var started: [DeviceActivityName] = []
    do {
      for (monitor, schedule, events) in plans {
        if registered.contains(monitor.name) {
          if try !matches(monitor) {
            guard !previous.contains(monitor.name) else { throw ProtectionTransactionError.conflict }
            let name = DeviceActivityName(monitor.name)
            center.stopMonitoring([name])
            guard !center.activities.contains(name) else { throw ProtectionTransactionError.unconfirmed }
            started.append(name)
            try center.startMonitoring(name, during: schedule, events: events)
          }
        } else {
          // iOS can discard a previously confirmed registration. Recreate this
          // exact desired monitor; missing OS state is not a conflicting schedule.
          let name = DeviceActivityName(monitor.name)
          started.append(name) // An SDK error can have an uncertain side effect.
          try center.startMonitoring(name, during: schedule, events: events)
        }
      }
      for monitor in monitors { guard try matches(monitor) else { throw ProtectionTransactionError.unconfirmed } }
    } catch {
      // Retain every pre-existing registration, including pending requests. Cleanup
      // touches only names this attempt started; failure remains unconfirmed.
      if !started.isEmpty { center.stopMonitoring(started) }
      if !Set(center.activities.map(\.rawValue)).isDisjoint(with: Set(started.map(\.rawValue))) {
        throw ProtectionTransactionError.unconfirmed
      }
      throw error
    }
  }
  static func retire(_ names: Set<String>) throws {
    try requireActivation()
    guard names.allSatisfy({ $0.hasPrefix("hoosh.shared.") && $0.utf8.count <= 256 }) else { throw ProtectionTransactionError.invalid }
    let removing = names.map { DeviceActivityName($0) }
    if !removing.isEmpty { center.stopMonitoring(removing) }
    guard Set(center.activities.map(\.rawValue)).isDisjoint(with: names) else { throw ProtectionTransactionError.unconfirmed }
  }
  /// The expiry callback runs while iOS is presenting a shield to the foreground app.
  /// Apply the set to the shared named store after preparing the view. The full
  /// store verification and migration run when applying or reconciling the plan.
  static func reapplyExpiredSessionShield(_ applications: Set<ApplicationToken>) throws {
    try requireActivation()
    guard !applications.isEmpty, applications.count <= 512 else {
      throw ProtectionTransactionError.invalid
    }
    settings.shield.applications = applications
  }

  static func writeBlockedApps(_ applications: Set<ApplicationToken>) throws {
    try requireActivation()
    guard applications.count <= 512 else { throw ProtectionTransactionError.invalid }
    (try? SharedProtectionStore.appGroup())?.clearExpiryPresentation()
    let store = settings
    store.shield.applications = applications.isEmpty ? nil : applications
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
    store.shield.webDomainCategories = nil
    guard matches(store, applications: applications) else { throw ProtectionTransactionError.unconfirmed }
    // Establish protection in the shared store before retiring the unnamed one.
    let previous = previousSettings
    if !matches(previous, applications: []) {
      previous.shield.applications = nil
      previous.shield.applicationCategories = nil
      previous.shield.webDomains = nil
      previous.shield.webDomainCategories = nil
    }
    guard matchesBlockedApps(applications) else { throw ProtectionTransactionError.unconfirmed }
  }
  private static func requireActivation() throws {
    guard ProtectionActivationGate.enabled else { throw ProtectionTransactionError.activationGated }
    guard Bundle.main.bundleURL.pathExtension == "appex" || AuthorizationCenter.shared.authorizationStatus == .approved else { throw ProtectionStoreError.unavailable }
  }
}
#endif
