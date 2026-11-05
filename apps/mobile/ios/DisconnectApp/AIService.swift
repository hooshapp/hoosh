import Foundation

class AIService {
    private let endpointInfoKey = "AI_NUDGE_ENDPOINT"
    
    func generateNudge(for user: User, screenTimeData: Int) async -> String {
        return simulateAIResponse(goal: user.goal, tone: user.tone, screenTime: screenTimeData)
    }

    func refreshCachedNudgePack(responses: OnboardingResponses, context: ProductivityContextSnapshot) async {
        let fallbackPack = Self.localNudgePack(responses: responses, context: context)

        guard let endpoint = aiEndpoint else {
            AIGeneratedNudgeStore.save(fallbackPack)
            return
        }

        do {
            let generatedPack = try await requestNudgePack(endpoint: endpoint, responses: responses, context: context)
            AIGeneratedNudgeStore.save(generatedPack.hasUsefulMessages ? generatedPack : fallbackPack)
        } catch {
            AIGeneratedNudgeStore.save(fallbackPack)
            DatabaseService.shared.logEvent("ai_nudge_generation_failed", properties: ["reason": error.localizedDescription])
        }
    }

    static func localNudgePack(responses: OnboardingResponses, context: ProductivityContextSnapshot) -> AIGeneratedNudgePack {
        let messages = PersonalizedNudgeLibrary.messages(answers: [
            "primaryGoal":responses.primaryGoal,"focusGoal":responses.focusGoal,
            "tinyTask":responses.tinyTask,"feeling":responses.focusFeeling
        ])
        return AIGeneratedNudgePack(shieldPrompts: messages,
            shieldPrompt: messages[0], activeReminders: messages,
            finalReminders: ["Your session has ended. Take a moment to choose what comes next."],
            contextTitle: "", contextKind: "", tone: responses.aiTone, generatedAt: Date())
    }

    private var aiEndpoint: URL? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: endpointInfoKey) as? String,
              !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return nil
        }

        return URL(string: value)
    }

    private func requestNudgePack(endpoint: URL, responses: OnboardingResponses, context: ProductivityContextSnapshot) async throws -> AIGeneratedNudgePack {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 12
        request.httpBody = try JSONEncoder().encode(AINudgeRequest(responses: responses, context: .empty))

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }

        return try NudgeResponseDecoder.decode(AIGeneratedNudgePack.self, from: data)
    }
    
    private func simulateAIResponse(goal: String, tone: String, screenTime: Int) -> String {
        let action = concreteAction(for: goal)
        let minutes = max(screenTime, 1)

        if minutes > 120 {
            switch tone {
            case "Direct", "Harsh":
                return "You have already paid \(minutes) minutes to the feed. Stop the leak: \(action)."
            case "Playful":
                return "Plot twist: \(goal) gets the next scene. Close this and \(action)."
            case "Intense":
                return "The feed has taken enough. Protect \(goal) now: \(action)."
            default:
                return "\(goal) is still available. Leave cleanly and \(action)."
            }
        }

        switch tone {
        case "Direct", "Harsh":
            return "Do not let this turn into another lost hour. \(action)."
        case "Playful":
            return "Tiny win available: \(action). Future you will notice."
        case "Intense":
            return "This is where the habit breaks. Exit and \(action)."
        default:
            return "One small move can protect \(goal): \(action)."
        }
    }

    private func concreteAction(for goal: String) -> String {
        Self.concreteAction(for: goal, task: "")
    }

    private static func concreteAction(for goal: String, task: String) -> String {
        let cleanedTask = task.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanedTask.isEmpty && !isWeakTask(cleanedTask) {
            return cleanedTask
        }

        let lowerGoal = goal.lowercased()
        if lowerGoal.contains("gym") || lowerGoal.contains("workout") || lowerGoal.contains("fitness") || lowerGoal.contains("active") {
            return "do 20 squats or 10 pushups"
        }
        if lowerGoal.contains("study") || lowerGoal.contains("class") || lowerGoal.contains("exam") || lowerGoal.contains("school") {
            return "open your notes for 5 minutes"
        }
        if lowerGoal.contains("read") || lowerGoal.contains("book") {
            return "read two pages"
        }
        if lowerGoal.contains("write") || lowerGoal.contains("draft") || lowerGoal.contains("essay") {
            return "write one rough sentence"
        }
        if lowerGoal.contains("career") || lowerGoal.contains("job") || lowerGoal.contains("application") {
            return "send one message or update one line"
        }
        return "take one real step before you reopen the feed"
    }

    static func frictionNudge(from responses: OnboardingResponses, appName: String) -> String {
        AIFrictionPromptEngine.shieldNudge(for: responses, appName: appName)
    }

    private static func firstUseful(_ values: [String], fallback: String) -> String {
        for value in values {
            let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if !cleaned.isEmpty { return cleaned }
        }
        return fallback
    }

    private static func short(_ text: String, _ limit: Int) -> String {
        let cleaned = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard cleaned.count > limit else { return cleaned }
        return String(cleaned.prefix(limit))
    }

    private static func isWeakTask(_ task: String) -> Bool {
        let lowerTask = task.lowercased()
        return lowerTask == "drink water"
            || lowerTask == "stretch"
            || lowerTask.contains("clear my desk")
            || lowerTask.contains("take five deep breaths")
    }
}

private struct AINudgeRequest: Encodable {
    let responses: OnboardingResponses
    let context: ProductivityContextSnapshot
}
