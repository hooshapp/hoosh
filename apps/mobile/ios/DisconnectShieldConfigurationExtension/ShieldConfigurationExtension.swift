import Foundation
import FamilyControls
import ManagedSettings
import ManagedSettingsUI
import os
import UIKit

final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    private let logger = Logger(subsystem: "com.AnishaDasgupta.DisconnectApp", category: "ShieldConfiguration")

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        logger.notice("Requested app shield configuration for \(application.localizedDisplayName ?? "unknown app", privacy: .public)")
        return makeConfiguration(appName: application.localizedDisplayName ?? "this app")
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        logger.notice("Requested category app shield configuration for \(application.localizedDisplayName ?? "unknown app", privacy: .public)")
        return makeConfiguration(appName: application.localizedDisplayName ?? "this app")
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        logger.notice("Requested web shield configuration for \(webDomain.domain ?? "unknown domain", privacy: .public)")
        return makeConfiguration(appName: webDomain.domain ?? "this website")
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        logger.notice("Requested category web shield configuration for \(webDomain.domain ?? "unknown domain", privacy: .public)")
        return makeConfiguration(appName: webDomain.domain ?? "this website")
    }

    private func makeConfiguration(appName: String) -> ShieldConfiguration {
        SharedShieldContext.setPendingAppName(appName)
        let responses = SharedOnboardingResponses.load()
        let productivityContext = SharedProductivityContext.load()
        SharedShieldDiagnostics.recordConfigurationRequest(appName: appName, bypassMinutes: responses.bypassMinutes)
        logger.notice("Returning custom shield for \(appName, privacy: .public), minutes: \(responses.bypassMinutes, privacy: .public)")
        let question = stableLine(responses.customQuestion.isEmpty
            ? responses.selectedQuestions.first ?? "Why did you open \(appName)?"
            : responses.customQuestion, limit: 96)
        let nudge = stableLine(SharedFrictionPrompt.makeNudge(from: responses, appName: appName, productivityContext: productivityContext), limit: 96)

        let subtitle = """
        \(question)

        \(nudge)

        Continue for \(responses.bypassMinutes) minutes, or leave now.
        """

        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterialDark,
            backgroundColor: UIColor(red: 0.07, green: 0.08, blue: 0.10, alpha: 1),
            icon: UIImage(systemName: "brain.head.profile"),
            title: ShieldConfiguration.Label(
                text: "Pause before \(appName)",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: subtitle,
                color: UIColor(white: 0.78, alpha: 1)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Close App & Stay Focused",
                color: UIColor(red: 0.03, green: 0.07, blue: 0.04, alpha: 1)
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.13, green: 0.79, blue: 0.33, alpha: 1),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Open for \(responses.bypassMinutes) minutes",
                color: UIColor(white: 0.82, alpha: 1)
            )
        )
    }

    private func stableLine(_ text: String, limit: Int) -> String {
        let cleaned = text
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: "  ", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard cleaned.count > limit else { return cleaned }
        let index = cleaned.index(cleaned.startIndex, offsetBy: limit)
        return String(cleaned[..<index]).trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

private enum SharedShieldContext {
    private static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"
    private static let pendingAppNameKey = "pendingShieldAppName"

    static func setPendingAppName(_ appName: String) {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        defaults.set(appName, forKey: pendingAppNameKey)
    }
}

private enum SharedShieldDiagnostics {
    private static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"

    static func recordConfigurationRequest(appName: String, bypassMinutes: Int) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        defaults.set(Date(), forKey: "lastShieldConfigurationDate")
        defaults.set(appName, forKey: "lastShieldConfigurationAppName")
        defaults.set(bypassMinutes, forKey: "lastShieldConfigurationMinutes")
    }
}

private struct SharedOnboardingResponses: Codable {
    var focusGoal: String
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
        focusGoal = try container.decodeIfPresent(String.self, forKey: .focusGoal) ?? "Hit the Gym"
        selectedQuestions = try container.decodeIfPresent([String].self, forKey: .selectedQuestions) ?? ["Why did you open this app?"]
        customQuestion = try container.decodeIfPresent(String.self, forKey: .customQuestion) ?? ""
        primaryGoal = try container.decodeIfPresent(String.self, forKey: .primaryGoal) ?? "Stay focused on what matters today."
        focusFeeling = try container.decodeIfPresent(String.self, forKey: .focusFeeling) ?? "I will feel calmer and more in control."
        tinyTask = try container.decodeIfPresent(String.self, forKey: .tinyTask) ?? "Take five deep breaths or do 10 pushups."
        scrollTemptation = try container.decodeIfPresent(String.self, forKey: .scrollTemptation) ?? "I open it when I want an easy escape."
        scrollCost = try container.decodeIfPresent(String.self, forKey: .scrollCost) ?? "I lose momentum and feel behind."
        accountabilityAnchor = try container.decodeIfPresent(String.self, forKey: .accountabilityAnchor) ?? "the version of me who keeps promises"
        let savedMinutes = try container.decodeIfPresent(Int.self, forKey: .bypassMinutes) ?? 5
        bypassMinutes = min(max(savedMinutes, 5), 60)
        aiFrictionStyle = try container.decodeIfPresent(String.self, forKey: .aiFrictionStyle) ?? "Balanced"
        aiTone = try container.decodeIfPresent(String.self, forKey: .aiTone) ?? "Supportive"
        persuasionStyle = try container.decodeIfPresent(String.self, forKey: .persuasionStyle) ?? "Future Self"
    }

    static func load() -> SharedOnboardingResponses {
        let defaults = UserDefaults(suiteName: "group.com.AnishaDasgupta.DisconnectApp") ?? .standard
        guard let data = defaults.data(forKey: "onboardingResponses"),
              let responses = try? JSONDecoder().decode(SharedOnboardingResponses.self, from: data) else {
            return SharedOnboardingResponses(
                focusGoal: "Hit the Gym",
                selectedQuestions: ["Why did you open this app?"],
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

        return responses
    }
}

private struct SharedProductivityContext: Decodable {
    var actionLine: String
    var contextKind: String
    var contextTitle: String

    var hasExternalTask: Bool {
        !contextTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var label: String {
        contextKind.lowercased() == "calendar" ? "Calendar" : "Reminder"
    }

    enum CodingKeys: String, CodingKey {
        case actionLine
        case contextKind
        case contextTitle
        case nextCalendarTitle
        case nextReminderTitle
    }

    init(actionLine: String, contextKind: String = "", contextTitle: String = "") {
        self.actionLine = actionLine
        self.contextKind = contextKind
        self.contextTitle = contextTitle
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        actionLine = try container.decodeIfPresent(String.self, forKey: .actionLine) ?? ""
        let reminderTitle = try container.decodeIfPresent(String.self, forKey: .nextReminderTitle) ?? ""
        let calendarTitle = try container.decodeIfPresent(String.self, forKey: .nextCalendarTitle) ?? ""
        contextKind = try container.decodeIfPresent(String.self, forKey: .contextKind) ?? (reminderTitle.isEmpty ? "calendar" : "reminder")
        contextTitle = try container.decodeIfPresent(String.self, forKey: .contextTitle) ?? (reminderTitle.isEmpty ? calendarTitle : reminderTitle)
    }

    static func load() -> SharedProductivityContext {
        let defaults = UserDefaults(suiteName: "group.com.AnishaDasgupta.DisconnectApp") ?? .standard
        guard let data = defaults.data(forKey: "productivityContextSnapshot"),
              let snapshot = try? JSONDecoder().decode(SharedProductivityContext.self, from: data) else {
            return SharedProductivityContext(actionLine: "")
        }

        return snapshot
    }
}

private enum SharedFrictionPrompt {
    static func makeNudge(from responses: SharedOnboardingResponses, appName: String, productivityContext: SharedProductivityContext) -> String {
        if let cached = SharedGeneratedNudgePack.load()?.shieldPrompt.trimmingCharacters(in: .whitespacesAndNewlines),
           !cached.isEmpty {
            return cached.replacingOccurrences(of: "{app}", with: appName)
        }

        let goal = responses.primaryGoal.isEmpty ? "Stay focused on what matters today." : responses.primaryGoal
        let task = productivityTask(from: productivityContext, fallback: replacementTask(goal: goal, task: responses.tinyTask))
        let cost = responses.scrollCost.isEmpty ? "I lose momentum and feel behind." : responses.scrollCost
        let anchor = responses.accountabilityAnchor.isEmpty ? "the version of me who keeps promises" : responses.accountabilityAnchor
        let tone = responses.aiTone.isEmpty ? "Supportive" : responses.aiTone

        if productivityContext.hasExternalTask {
            let title = shortened(productivityContext.contextTitle, fallback: "your next task")
            switch tone {
            case "Direct":
                return "\(productivityContext.label): \(title). \(task)."
            case "Playful":
                return "Plot twist: \(title). \(task), then decide."
            case "Intense":
                return "\(title) is waiting. \(task), not \(appName)."
            default:
                return "Your \(productivityContext.label.lowercased()) says \(title). \(task)."
            }
        }

        switch responses.persuasionStyle {
        case "Goal Cost":
            return "Action: \(task). Protect \(goal) from \(cost.lowercased())."
        case "Tiny Action":
            return "Action: \(task). Then decide if \(appName) still matters."
        case "Identity":
            return "Action: \(task). Do it for \(anchor)."
        default:
            return "Action: \(task). Give \(goal) the first move."
        }
    }

    private static func shieldStyleWrap(_ text: String, goal: String, task: String, style: String, tone: String) -> String {
        let styleLine: String
        switch style {
        case "Reflective":
            styleLine = "Tell the truth, then choose the version of you that gets \(goal)."
        case "Direct":
            styleLine = "Close this and do this now: \(task)"
        default:
            styleLine = "A better first move is available: \(task)"
        }

        let toneLine: String
        switch tone {
        case "Direct":
            toneLine = "No extra debate."
        case "Playful":
            toneLine = "Tiny plot twist: you leave with your day intact."
        case "Intense":
            toneLine = "Do not let the feed spend your ambition for you."
        default:
            toneLine = "You can still make the clean choice."
        }

        return "\(text) \(styleLine) \(toneLine)"
    }

    private static func productivityTask(from context: SharedProductivityContext, fallback: String) -> String {
        let cleaned = context.actionLine.trimmingCharacters(in: .whitespacesAndNewlines)
        return cleaned.isEmpty ? fallback : cleaned
    }

    private static func shortened(_ text: String, fallback: String) -> String {
        let cleaned = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.isEmpty { return fallback }
        return cleaned.count <= 30 ? cleaned : String(cleaned.prefix(30))
    }

    private static func replacementTask(goal: String, task: String) -> String {
        let cleanedTask = task.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanedTask.isEmpty && cleanedTask != "Take five deep breaths or do 10 pushups." && !isWeakTask(cleanedTask) {
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
        return "Take five deep breaths or do 10 pushups."
    }

    private static func isWeakTask(_ task: String) -> Bool {
        let lowerTask = task.lowercased()
        return lowerTask == "drink water"
            || lowerTask == "stretch"
            || lowerTask.contains("clear my desk")
            || lowerTask.contains("take five deep breaths")
    }
}

private struct SharedGeneratedNudgePack: Decodable {
    var shieldPrompt: String
    var activeReminders: [String]
    var finalReminders: [String]

    static func load() -> SharedGeneratedNudgePack? {
        let defaults = UserDefaults(suiteName: "group.com.AnishaDasgupta.DisconnectApp") ?? .standard
        guard let data = defaults.data(forKey: "aiGeneratedNudgePack") else { return nil }
        return try? JSONDecoder().decode(SharedGeneratedNudgePack.self, from: data)
    }
}

private enum LegacySharedFrictionPrompt {
    static func makeNudge(from responses: SharedOnboardingResponses, appName: String) -> String {
        switch responses.aiFrictionStyle {
        case "Direct":
            return "You chose \(responses.primaryGoal). If \(appName) is not part of that, close it and do this now: \(responses.tinyTask)"
        case "Reflective":
            return "Before \(appName), picture how you wanted to feel: \(responses.focusFeeling). What choice protects that?"
        default:
            return "Quick reset: \(responses.primaryGoal). Try this instead for one minute: \(responses.tinyTask)"
        }
    }
}
