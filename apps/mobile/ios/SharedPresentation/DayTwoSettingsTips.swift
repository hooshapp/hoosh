import Foundation

struct DayTwoSettingsTips: Codable {
    var startedAt: Date
    var lastPromptAt: Date?
    var promptedSessions: [String: Date]?

    private static let easternCalendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/New_York")!
        return calendar
    }()

    func isFirstDay(at now: Date) -> Bool {
        now >= startedAt && Self.easternCalendar.isDate(startedAt, inSameDayAs: now)
    }

    mutating func take(session: String, now: Date) -> Bool {
        let recentSessions = (promptedSessions ?? [:]).filter { now.timeIntervalSince($0.value) < 24 * 3600 }
        guard let midnight = Self.easternCalendar.dateInterval(of: .day, for: startedAt)?.end,
              now >= midnight,
              recentSessions[session] == nil,
              lastPromptAt.map({ now.timeIntervalSince($0) >= 2 * 3600 }) ?? true else { return false }
        lastPromptAt = now
        promptedSessions = recentSessions
        promptedSessions?[session] = now
        return true
    }
}

enum DayTwoSettingsTipStore {
    // Keep the original start date when existing testers upgrade.
    static let key = "disconnect.dayTwoSettingsTips.v1"
    static let openedKey = "disconnect.personalizationInvitationOpened"
    static let category = "disconnect.personalizationInvitation"
    static let openAction = "disconnect.openPersonalization"
    static let pendingRoute = "disconnect.auth.openPersonalizationOwner"
    static let routeNotification = Notification.Name("disconnectOpenPersonalization")
    static let notificationID = "disconnect.personalizationInvitation"
    static let message = "Tap on this notification to better customize your experience."

    private static func load() -> DayTwoSettingsTips? {
        guard let data = ShieldPresentationStore.defaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(DayTwoSettingsTips.self, from: data)
    }

    static func isFirstDay(now: Date = Date()) -> Bool {
        load()?.isFirstDay(at: now) == true
    }

    static func recordUse(now: Date = Date()) {
        guard load() == nil else { return }
        save(DayTwoSettingsTips(startedAt: now))
    }

    static func take(session: String, now: Date = Date()) -> Bool {
        let defaults = ShieldPresentationStore.defaults
        recordUse(now: now)
        guard !defaults.bool(forKey: openedKey), var state = load(),
              state.take(session: session, now: now) else { return false }
        save(state)
        return true
    }

    private static func save(_ state: DayTwoSettingsTips) {
        ShieldPresentationStore.defaults.set(try? JSONEncoder().encode(state), forKey: key)
    }
}
