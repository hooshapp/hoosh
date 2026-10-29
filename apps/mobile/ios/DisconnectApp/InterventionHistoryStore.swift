import Foundation

struct InterventionHistoryEvent: Codable, Identifiable {
    enum Decision: String, Codable {
        case stayedFocused
        case openedAnyway

        var label: String {
            switch self {
            case .stayedFocused:
                return "Stayed focused"
            case .openedAnyway:
                return "Opened anyway"
            }
        }
    }

    let id: UUID
    let appName: String
    let decision: Decision
    let date: Date
    let savedMinutes: Int

    init(id: UUID = UUID(), appName: String, decision: Decision, date: Date = Date(), savedMinutes: Int) {
        self.id = id
        self.appName = appName
        self.decision = decision
        self.date = date
        self.savedMinutes = savedMinutes
    }
}

enum InterventionHistoryStore {
    private static let eventsKey = "interventionHistoryEvents"
    static let pendingAppNameKey = "pendingShieldAppName"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: OnboardingResponseStore.appGroupID) ?? .standard
    }

    static func load(limit: Int = 50) -> [InterventionHistoryEvent] {
        guard let data = defaults.data(forKey: eventsKey),
              let events = try? PropertyListDecoder().decode([InterventionHistoryEvent].self, from: data) else {
            return []
        }

        return Array(events.sorted { $0.date > $1.date }.prefix(limit))
    }

    static func clear() {
        defaults.removeObject(forKey: eventsKey)
    }
}
