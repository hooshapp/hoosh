import Foundation

struct OnboardingResponses: Codable {
    var focusGoal: String
    var focusGoalIconName: String
    var selectedQuestions: [String]
    var customQuestion: String
    var primaryGoal: String
    var focusFeeling: String
    var tinyTask: String
    var scrollTemptation: String
    var scrollCost: String
    var accountabilityAnchor: String
    var bypassMinutes: Int
    var aiFrictionStyle: String
    var aiTone: String
    var persuasionStyle: String

    enum CodingKeys: String, CodingKey {
        case focusGoal
        case focusGoalIconName
        case selectedQuestions
        case customQuestion
        case primaryGoal
        case focusFeeling
        case tinyTask
        case scrollTemptation
        case scrollCost
        case accountabilityAnchor
        case bypassMinutes
        case aiFrictionStyle
        case aiTone
        case persuasionStyle
    }

    init(
        focusGoal: String,
        focusGoalIconName: String,
        selectedQuestions: [String],
        customQuestion: String,
        primaryGoal: String,
        focusFeeling: String,
        tinyTask: String,
        scrollTemptation: String,
        scrollCost: String,
        accountabilityAnchor: String,
        bypassMinutes: Int,
        aiFrictionStyle: String,
        aiTone: String,
        persuasionStyle: String
    ) {
        self.focusGoal = focusGoal
        self.focusGoalIconName = focusGoalIconName
        self.selectedQuestions = selectedQuestions
        self.customQuestion = customQuestion
        self.primaryGoal = primaryGoal
        self.focusFeeling = focusFeeling
        self.tinyTask = tinyTask
        self.scrollTemptation = scrollTemptation
        self.scrollCost = scrollCost
        self.accountabilityAnchor = accountabilityAnchor
        self.bypassMinutes = min(max(bypassMinutes, 5), 60)
        self.aiFrictionStyle = aiFrictionStyle
        self.aiTone = aiTone
        self.persuasionStyle = persuasionStyle
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        focusGoal = try container.decode(String.self, forKey: .focusGoal)
        focusGoalIconName = try container.decodeIfPresent(String.self, forKey: .focusGoalIconName) ?? "dumbbell"
        selectedQuestions = try container.decode([String].self, forKey: .selectedQuestions)
        customQuestion = try container.decode(String.self, forKey: .customQuestion)
        primaryGoal = try container.decode(String.self, forKey: .primaryGoal)
        focusFeeling = try container.decode(String.self, forKey: .focusFeeling)
        tinyTask = try container.decode(String.self, forKey: .tinyTask)
        scrollTemptation = try container.decodeIfPresent(String.self, forKey: .scrollTemptation) ?? "I open it when I want an easy escape."
        scrollCost = try container.decodeIfPresent(String.self, forKey: .scrollCost) ?? "I lose momentum and feel behind."
        accountabilityAnchor = try container.decodeIfPresent(String.self, forKey: .accountabilityAnchor) ?? "the version of me who keeps promises"
        let savedMinutes = try container.decodeIfPresent(Int.self, forKey: .bypassMinutes) ?? 5
        bypassMinutes = min(max(savedMinutes, 5), 60)
        aiFrictionStyle = try container.decodeIfPresent(String.self, forKey: .aiFrictionStyle) ?? "Balanced"
        aiTone = try container.decodeIfPresent(String.self, forKey: .aiTone) ?? "Supportive"
        persuasionStyle = try container.decodeIfPresent(String.self, forKey: .persuasionStyle) ?? "Future Self"
    }

    static let fallback = OnboardingResponses(
        focusGoal: "Hit the Gym",
        focusGoalIconName: "dumbbell",
        selectedQuestions: [
            "Is this a good time to scroll, or are you avoiding something?"
        ],
        customQuestion: "",
        primaryGoal: "Stay focused on what matters today.",
        focusFeeling: "I will feel calmer and more in control.",
        tinyTask: "Take five deep breaths or do 10 pushups.",
        scrollTemptation: "I open it when I want an easy escape.",
        scrollCost: "I lose momentum and feel behind.",
        accountabilityAnchor: "the version of me who keeps promises",
        bypassMinutes: 5,
        aiFrictionStyle: "Balanced",
        aiTone: "Supportive",
        persuasionStyle: "Future Self"
    )
}

enum OnboardingResponseStore {
    static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"
    private static let key = "onboardingResponses"
    private static let bypassUntilKey = "shieldBypassUntil"
    private static let onboardingCompletedKey = "onboardingCompleted"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroupID) ?? .standard
    }

    static func save(_ responses: OnboardingResponses) {
        guard let data = try? JSONEncoder().encode(responses) else { return }
        defaults.set(data, forKey: key)
    }

    static func load() -> OnboardingResponses {
        guard let data = defaults.data(forKey: key),
              let responses = try? JSONDecoder().decode(OnboardingResponses.self, from: data) else {
            return .fallback
        }

        return responses
    }

    static var breakMinuteOptions: [Int] {
        Array(stride(from: 5, through: 60, by: 5))
    }

    static func setBypass(minutes: Int) {
        defaults.set(Date().addingTimeInterval(TimeInterval(minutes * 60)), forKey: bypassUntilKey)
    }

    static func bypassUntil() -> Date? {
        defaults.object(forKey: bypassUntilKey) as? Date
    }

    static func clearBypass() {
        defaults.removeObject(forKey: bypassUntilKey)
    }

    static var hasCompletedOnboarding: Bool {
        defaults.bool(forKey: onboardingCompletedKey)
    }

    static func markOnboardingCompleted() {
        defaults.set(true, forKey: onboardingCompletedKey)
    }
}
