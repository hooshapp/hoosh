import Foundation

struct ProductivityContextSnapshot: Codable {
    enum AccessState: String, Codable {
        case notDetermined
        case authorized
        case denied
        case restricted
        case partial
        case unknown
    }

    var calendarAccess: AccessState
    var remindersAccess: AccessState
    var nextCalendarTitle: String
    var nextCalendarDate: Date?
    var nextReminderTitle: String
    var nextReminderDate: Date?
    var actionLine: String
    var contextKind: String
    var contextTitle: String
    var lastUpdated: Date?

    enum CodingKeys: String, CodingKey {
        case calendarAccess
        case remindersAccess
        case nextCalendarTitle
        case nextCalendarDate
        case nextReminderTitle
        case nextReminderDate
        case actionLine
        case contextKind
        case contextTitle
        case lastUpdated
    }

    var hasUsefulContext: Bool {
        !contextTitle.isEmpty || !nextCalendarTitle.isEmpty || !nextReminderTitle.isEmpty || !actionLine.isEmpty
    }

    var summaryLine: String {
        if !contextKind.isEmpty, !contextTitle.isEmpty {
            return "\(contextKind.capitalized): \(contextTitle)"
        }
        if !nextReminderTitle.isEmpty {
            return "Reminder: \(nextReminderTitle)"
        }
        if !nextCalendarTitle.isEmpty {
            return "Calendar: \(nextCalendarTitle)"
        }
        return "No upcoming tasks found yet"
    }

    static let empty = ProductivityContextSnapshot(
        calendarAccess: .notDetermined,
        remindersAccess: .notDetermined,
        nextCalendarTitle: "",
            nextCalendarDate: nil,
            nextReminderTitle: "",
            nextReminderDate: nil,
            actionLine: "",
            contextKind: "",
            contextTitle: "",
            lastUpdated: nil
    )

    init(
        calendarAccess: AccessState,
        remindersAccess: AccessState,
        nextCalendarTitle: String,
        nextCalendarDate: Date?,
        nextReminderTitle: String,
        nextReminderDate: Date?,
        actionLine: String,
        contextKind: String,
        contextTitle: String,
        lastUpdated: Date?
    ) {
        self.calendarAccess = calendarAccess
        self.remindersAccess = remindersAccess
        self.nextCalendarTitle = nextCalendarTitle
        self.nextCalendarDate = nextCalendarDate
        self.nextReminderTitle = nextReminderTitle
        self.nextReminderDate = nextReminderDate
        self.actionLine = actionLine
        self.contextKind = contextKind
        self.contextTitle = contextTitle
        self.lastUpdated = lastUpdated
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        calendarAccess = try container.decodeIfPresent(AccessState.self, forKey: .calendarAccess) ?? .notDetermined
        remindersAccess = try container.decodeIfPresent(AccessState.self, forKey: .remindersAccess) ?? .notDetermined
        nextCalendarTitle = try container.decodeIfPresent(String.self, forKey: .nextCalendarTitle) ?? ""
        nextCalendarDate = try container.decodeIfPresent(Date.self, forKey: .nextCalendarDate)
        nextReminderTitle = try container.decodeIfPresent(String.self, forKey: .nextReminderTitle) ?? ""
        nextReminderDate = try container.decodeIfPresent(Date.self, forKey: .nextReminderDate)
        actionLine = try container.decodeIfPresent(String.self, forKey: .actionLine) ?? ""
        contextKind = try container.decodeIfPresent(String.self, forKey: .contextKind) ?? ""
        contextTitle = try container.decodeIfPresent(String.self, forKey: .contextTitle) ?? ""
        lastUpdated = try container.decodeIfPresent(Date.self, forKey: .lastUpdated)
    }
}

enum ProductivityContextStore {
    private static let key = "productivityContextSnapshot"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: OnboardingResponseStore.appGroupID) ?? .standard
    }

    static func save(_ snapshot: ProductivityContextSnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        defaults.set(data, forKey: key)
    }

    static func load() -> ProductivityContextSnapshot {
        guard let data = defaults.data(forKey: key),
              let snapshot = try? JSONDecoder().decode(ProductivityContextSnapshot.self, from: data) else {
            return .empty
        }

        return snapshot
    }

    static func clear() {
        defaults.removeObject(forKey: key)
    }
}
