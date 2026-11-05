import Foundation

struct DayTwoSettingsTips: Codable {
    var startedAt:Date
    var sentCount=0
    var lastSentAt:Date?
    var lastSession:String?
    static let messages = [
        "Make Disconnect work for you. Open Settings to adjust each app’s daily allowance and session length.",
        "Want a different kind of nudge? Explore your tone, style, and personal answers in Settings.",
        "Settings can connect Calendar and Reminders to your nudges. Choose what helps you most."
    ]
    mutating func take(session:String,now:Date,calendar:Calendar = .current) -> String? {
        let days=calendar.dateComponents([.day],from:calendar.startOfDay(for:startedAt),to:calendar.startOfDay(for:now)).day
        guard days == 1, sentCount < Self.messages.count, session != lastSession,
              lastSentAt.map({now.timeIntervalSince($0)>=2*3600}) ?? true else { return nil }
        let text=Self.messages[sentCount]
        sentCount += 1;lastSentAt=now;lastSession=session
        return text
    }
}
enum DayTwoSettingsTipStore {
    static let key="disconnect.dayTwoSettingsTips.v1"
    static let category="disconnect.settingsTip"
    static let openAction="disconnect.openSettings"
    static let pendingRoute="disconnect.openSettingsPending"
    static let routeNotification=Notification.Name("disconnectOpenSettings")
    static func startIfNeeded(now:Date=Date()) {
        guard ShieldPresentationStore.defaults.data(forKey:key)==nil else { return }
        save(DayTwoSettingsTips(startedAt:now))
    }
    static func take(session:String,now:Date=Date()) -> String? {
        guard let data=ShieldPresentationStore.defaults.data(forKey:key),
              var state=try? JSONDecoder().decode(DayTwoSettingsTips.self,from:data),
              let text=state.take(session:session,now:now) else { return nil }
        save(state); return text
    }
    private static func save(_ state:DayTwoSettingsTips) {
        ShieldPresentationStore.defaults.set(try? JSONEncoder().encode(state),forKey:key)
    }
}
