import Foundation

struct StudyCustomFocusGoal: Identifiable,Codable,Equatable {
    var id=UUID()
    var title:String
    var iconName:String
    var displayTitle:String {
        let clean=title.trimmingCharacters(in:.whitespacesAndNewlines)
        return clean.isEmpty ? "Custom Focus" : clean
    }
}
struct OnboardingGoalDraft: Codable,Equatable {
    var presetIDs:Set<String>
    var customGoals:[StudyCustomFocusGoal]
    var selectedCustomIDs:Set<UUID>
}
enum OnboardingGoalDraftStore {
    static let key="disconnect.onboardingGoalDraft.v1"
    static func load(defaults:UserDefaults=ShieldPresentationStore.defaults) -> OnboardingGoalDraft? {
        guard let data=defaults.data(forKey:key) else { return nil }
        return try? JSONDecoder().decode(OnboardingGoalDraft.self,from:data)
    }
    static func save(_ value:OnboardingGoalDraft,defaults:UserDefaults=ShieldPresentationStore.defaults) {
        guard let data=try? JSONEncoder().encode(value) else { return }
        defaults.set(data,forKey:key)
    }
}
