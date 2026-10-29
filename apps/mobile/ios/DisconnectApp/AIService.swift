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
        let title = firstUseful([context.contextTitle, context.nextReminderTitle, context.nextCalendarTitle], fallback: "")
        let kind = firstUseful([context.contextKind, context.nextReminderTitle.isEmpty ? "calendar" : "reminder"], fallback: "reminder")
        let action = firstUseful([context.actionLine, concreteAction(for: responses.primaryGoal, task: responses.tinyTask)], fallback: "take one useful step")
        let goal = firstUseful([responses.primaryGoal, responses.focusGoal], fallback: "your real goal")
        let tone = firstUseful([responses.aiTone], fallback: "Supportive")
        let label = kind.lowercased() == "calendar" ? "Calendar" : "Reminder"

        let shield: String
        let active: [String]
        let final: [String]

        if !title.isEmpty {
            switch tone {
            case "Direct":
                shield = "\(label): \(short(title, 30)). \(short(action, 42))."
                active = [
                    "\(label): \(short(title, 28)). \(short(action, 32)).",
                    "\(short(title, 30)) beats this scroll.",
                    "\(short(action, 34)). Then decide."
                ]
                final = [
                    "Time is up. \(short(action, 34)).",
                    "Relock. Return to \(short(title, 30))."
                ]
            case "Playful":
                shield = "Plot twist: \(short(title, 30)) gets the next scene. \(short(action, 34))."
                active = [
                    "Plot twist: \(short(title, 28)).",
                    "\(label) cameo: \(short(action, 32)).",
                    "Give \(short(title, 28)) the next scene."
                ]
                final = [
                    "Feed break is over. \(short(title, 30)) is up.",
                    "Credits roll. \(short(action, 34))."
                ]
            case "Intense":
                shield = "\(short(title, 30)) is waiting. \(short(action, 36)), not the feed."
                active = [
                    "\(short(title, 28)) is waiting. Leave.",
                    "Do not trade \(short(title, 24)) for this.",
                    "\(short(action, 34)). Protect your day."
                ]
                final = [
                    "No overtime. \(short(action, 34)).",
                    "Close the loop. \(short(title, 30))."
                ]
            default:
                shield = "Your \(label.lowercased()) says \(short(title, 30)). \(short(action, 38))."
                active = [
                    "Return to \(short(title, 28)).",
                    "Your \(label.lowercased()) is next: \(short(action, 30)).",
                    "\(short(action, 34)). Make this interruption useful."
                ]
                final = [
                    "Time is up. Return to \(short(title, 30)).",
                    "Leave cleanly. \(short(action, 34))."
                ]
            }
        } else {
            shield = AIFrictionPromptEngine.shieldNudge(for: responses, appName: "{app}")
            active = [
                "\(short(goal, 28)) gets the next minute.",
                "\(short(action, 34)). Make this real.",
                "Leave before this turns automatic."
            ]
            final = [
                "Time is up. Return to \(short(goal, 30)).",
                "Relock. \(short(action, 34))."
            ]
        }

        return AIGeneratedNudgePack(
            shieldPrompt: shield,
            activeReminders: active,
            finalReminders: final,
            contextTitle: title,
            contextKind: kind,
            tone: tone,
            generatedAt: Date()
        )
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
        request.httpBody = try JSONEncoder().encode(AINudgeRequest(responses: responses, context: context))

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }

        return try JSONDecoder().decode(AIGeneratedNudgePack.self, from: data)
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
