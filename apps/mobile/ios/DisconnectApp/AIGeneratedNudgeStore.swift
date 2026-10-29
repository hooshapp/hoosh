import Foundation

struct AIGeneratedNudgePack: Codable {
    var shieldPrompt: String
    var activeReminders: [String]
    var finalReminders: [String]
    var contextTitle: String
    var contextKind: String
    var tone: String
    var generatedAt: Date

    var hasUsefulMessages: Bool {
        !shieldPrompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
        !activeReminders.isEmpty ||
        !finalReminders.isEmpty
    }
}

enum AIGeneratedNudgeStore {
    private static let key = "aiGeneratedNudgePack"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: OnboardingResponseStore.appGroupID) ?? .standard
    }

    static func save(_ pack: AIGeneratedNudgePack) {
        guard let data = try? JSONEncoder().encode(pack) else { return }
        defaults.set(data, forKey: key)
    }

    static func load() -> AIGeneratedNudgePack? {
        guard let data = defaults.data(forKey: key),
              let pack = try? JSONDecoder().decode(AIGeneratedNudgePack.self, from: data),
              pack.hasUsefulMessages else {
            return nil
        }

        return pack
    }

    static func clear() {
        defaults.removeObject(forKey: key)
    }
}
