import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings
import os
import UserNotifications

final class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    private let store = ManagedSettingsStore()
    private let logger = Logger(subsystem: "com.AnishaDasgupta.DisconnectApp", category: "DeviceActivityMonitor")

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        guard activity == .disconnectShieldBypass else { return }
        logger.notice("Bypass interval started; reapplying shields")
        endBypassAndReapplyShields()
        DeviceActivityCenter().stopMonitoring([.disconnectShieldBypass, .disconnectBypassUsage])
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        if activity == .disconnectShieldBypass {
            logger.notice("Bypass interval ended; reapplying shields")
            endBypassAndReapplyShields()
        } else if activity == .disconnectBypassUsage {
            logger.notice("Bypass usage interval ended; clearing reminder notifications")
            SharedMonitorReminder.cancelBreakReminders()
        }
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)

        if activity == .disconnectShieldBypass, event == .disconnectShieldBypassLimit {
            logger.notice("Bypass usage threshold reached; reapplying shields")
            endBypassAndReapplyShields()
            return
        }

        guard activity == .disconnectBypassUsage,
              let minute = event.disconnectBypassUsageMinute else {
            return
        }

        let totalMinutes = SharedMonitorBypass.bypassMinutes()
        logger.notice("Bypass usage reminder threshold reached for minute \(minute, privacy: .public)")
        SharedMonitorReminder.postUsageReminder(minute: minute, totalMinutes: totalMinutes)

        if minute >= totalMinutes {
            SharedMonitorBypass.clearBypass()
            reapplyShields()
            DeviceActivityCenter().stopMonitoring([.disconnectShieldBypass, .disconnectBypassUsage])
        }
    }

    private func endBypassAndReapplyShields() {
        SharedMonitorBypass.clearBypass()
        SharedMonitorReminder.cancelBreakReminders()
        reapplyShields()
    }

    private func reapplyShields() {
        let selection = SharedMonitorAppSelection.load()
        logger.notice("Applying monitor shield selection. apps: \(selection.applicationTokens.count, privacy: .public), categories: \(selection.categoryTokens.count, privacy: .public), webDomains: \(selection.webDomainTokens.count, privacy: .public)")
        applySelection(selection)
    }

    private func applySelection(_ selection: FamilyActivitySelection) {
        SharedMonitorShieldWriter.apply(selection, store: store)
    }
}

private enum SharedMonitorShieldWriter {
    static func apply(_ selection: FamilyActivitySelection, store: ManagedSettingsStore = ManagedSettingsStore()) {
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
        store.shield.webDomainCategories = selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
    }
}

private extension DeviceActivityName {
    static let disconnectShieldBypass = Self("disconnectShieldBypass")
    static let disconnectBypassUsage = Self("disconnectBypassUsage")
}

private extension DeviceActivityEvent.Name {
    static let disconnectShieldBypassLimit = Self("disconnectShieldBypassLimit")

    private static let disconnectBypassUsagePrefix = "disconnectBypassUsage.minute."

    var disconnectBypassUsageMinute: Int? {
        guard rawValue.hasPrefix(Self.disconnectBypassUsagePrefix) else { return nil }
        return Int(rawValue.dropFirst(Self.disconnectBypassUsagePrefix.count))
    }
}

private enum SharedMonitorBypass {
    private static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"
    private static let onboardingKey = "onboardingResponses"
    private static let bypassUntilKey = "shieldBypassUntil"

    static func bypassMinutes() -> Int {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        guard let data = defaults.data(forKey: onboardingKey),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let minutes = object["bypassMinutes"] as? Int else {
            return 5
        }

        return min(max(minutes, 5), 60)
    }

    static func clearBypass() {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        defaults.removeObject(forKey: bypassUntilKey)
    }
}

private enum SharedMonitorReminder {
    private static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"
    private static let onboardingKey = "onboardingResponses"
    private static let reminderPrefix = "disconnect.breakReminder."

    static func postUsageReminder(minute: Int, totalMinutes: Int) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: reminderIdentifiers())

        let content = UNMutableNotificationContent()
        content.title = minute >= totalMinutes ? "Time is up" : "Tap to end session early"
        content.body = reminderBody(minute: minute, totalMinutes: totalMinutes)
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: "\(reminderPrefix)\(minute)",
            content: content,
            trigger: nil
        )
        center.add(request)
    }

    static func cancelBreakReminders() {
        let identifiers = reminderIdentifiers()
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        center.removeDeliveredNotifications(withIdentifiers: identifiers)
    }

    private static func reminderIdentifiers() -> [String] {
        (1...60).map { "\(reminderPrefix)\($0)" }
    }

    private static func reminderBody(minute: Int, totalMinutes: Int) -> String {
        let responses = loadResponses()
        let goal = clean(responses["primaryGoal"] as? String, fallback: "your goal")
        let feeling = clean(responses["focusFeeling"] as? String, fallback: "in control")
        let task = replacementTask(goal: goal, task: responses["tinyTask"] as? String)
        let temptation = clean(responses["scrollTemptation"] as? String, fallback: "autopilot")
        let cost = clean(responses["scrollCost"] as? String, fallback: "lost momentum")
        let anchor = clean(responses["accountabilityAnchor"] as? String, fallback: "your reason")
        let tone = clean(responses["aiTone"] as? String, fallback: "Supportive")
        let style = clean(responses["aiFrictionStyle"] as? String, fallback: "Balanced")
        let persuasion = clean(responses["persuasionStyle"] as? String, fallback: "Future Self")
        let prefix = minute >= totalMinutes ? "Done:" : "Min \(minute)/\(totalMinutes):"
        let shortGoal = bannerPhrase(goal, fallback: "your goal")
        let shortFeeling = bannerPhrase(feeling, fallback: "in control")
        let shortTask = bannerPhrase(task, fallback: "one real action")
        let shortTemptation = bannerPhrase(temptation, fallback: "autopilot")
        let shortCost = bannerPhrase(cost, fallback: "lost momentum")
        let shortAnchor = bannerPhrase(anchor, fallback: "your reason")

        let options = minute >= totalMinutes
            ? finalReminderOptions(goal: shortGoal, task: shortTask, anchor: shortAnchor, tone: tone)
            : activeReminderOptions(goal: shortGoal, feeling: shortFeeling, task: shortTask, temptation: shortTemptation, cost: shortCost, anchor: shortAnchor, tone: tone, style: style, persuasion: persuasion)
        let ordinal = reminderOrdinal(minute: min(minute, totalMinutes), totalMinutes: totalMinutes)
        let message = options[ordinal % options.count]

        return fitBanner("\(prefix) \(message)")
    }

    private static func activeReminderOptions(goal: String, feeling: String, task: String, temptation: String, cost: String, anchor: String, tone: String, style: String, persuasion: String) -> [String] {
        let persuasionOptions: [String]
        switch persuasion {
        case "Goal Cost":
            persuasionOptions = [
                "\(cost) is the price. Still buying?",
                "\(goal) is paying for this minute.",
                "Leave before \(cost.lowercased()).",
                "Protect the hour after this.",
                "This scroll is not free.",
                "The bill is your attention.",
                "Stop before momentum leaks.",
                "\(task). Pay yourself first."
            ]
        case "Tiny Action":
            persuasionOptions = [
                "\(task). Then choose again.",
                "One tiny action beats this.",
                "Make leaving physical: \(task).",
                "Trade scrolling for motion.",
                "\(goal) only needs a start.",
                "Shrink the task. Begin.",
                "One minute can restart you.",
                "Do the smallest useful thing."
            ]
        case "Identity":
            persuasionOptions = [
                "Choose \(anchor).",
                "This exit proves the promise.",
                "Be the follow-through.",
                "\(goal) is who you vote for.",
                "Act like the person you named.",
                "Keep the private promise.",
                "\(anchor) gets this minute.",
                "Identity is one tap away."
            ]
        default:
            persuasionOptions = [
                "\(goal) gets next.",
                "Is this helping you feel \(feeling)?",
                "Leave while it is a choice.",
                "Your better plan is waiting.",
                "Name it: \(temptation). Then leave.",
                "Give the next minute back.",
                "Do you want this feeling after?",
                "\(anchor) is the reason."
            ]
        }

        return unique(persuasionOptions + styleOptions(style: style, goal: goal, feeling: feeling, task: task, temptation: temptation, cost: cost) + toneOptions(tone: tone, goal: goal, task: task, anchor: anchor))
    }

    private static func styleOptions(style: String, goal: String, feeling: String, task: String, temptation: String, cost: String) -> [String] {
        switch style {
        case "Reflective":
            return [
                "What are you avoiding?",
                "Will this end with \(feeling)?",
                "Is this rest or \(temptation.lowercased())?",
                "What would feel better after?",
                "Name the urge, then \(task)."
            ]
        case "Direct":
            return [
                "Close it before drift.",
                "Stop feeding the loop.",
                "\(goal) is the priority.",
                "Exit now, not later.",
                "\(cost) starts with one more minute."
            ]
        default:
            return [
                "Check in, then choose.",
                "This is the exit ramp.",
                "Small reset: \(task).",
                "Your time is still yours.",
                "Leave before autopilot."
            ]
        }
    }

    private static func toneOptions(tone: String, goal: String, task: String, anchor: String) -> [String] {
        switch tone {
        case "Direct":
            return [
                "Put it down cleanly.",
                "End the scroll here.",
                "No extra lap.",
                "Close and move.",
                "\(task). No debate."
            ]
        case "Playful":
            return [
                "Plot twist: you leave.",
                "The feed can wait.",
                "Future you gets the mic.",
                "Exit scene, choose \(goal).",
                "Tiny win: \(task)."
            ]
        case "Intense":
            return [
                "Take attention back.",
                "Do not donate more time.",
                "Break the loop.",
                "\(goal) over the feed.",
                "\(task). Kill the loop."
            ]
        default:
            return [
                "You can leave gently.",
                "Choose the quiet win.",
                "\(anchor) can have this.",
                "Pause, breathe, exit.",
                "\(task). You are in control."
            ]
        }
    }

    private static func finalReminderOptions(goal: String, task: String, anchor: String, tone: String) -> [String] {
        switch tone {
        case "Direct":
            return ["Time is up. \(task)."]
        case "Playful":
            return ["Break over. \(anchor) gets the next scene."]
        case "Intense":
            return ["Time is up. Protect \(goal). Leave now."]
        default:
            return ["Time is up. Give \(goal) the next minute."]
        }
    }

    private static func reminderOrdinal(minute: Int, totalMinutes: Int) -> Int {
        let minutes = reminderMinutes(for: totalMinutes)
        return minutes.firstIndex(of: minute) ?? max(0, minute - 1)
    }

    private static func reminderMinutes(for totalMinutes: Int) -> [Int] {
        guard totalMinutes > 5 else {
            return Array(1...totalMinutes)
        }

        let fiveMinuteMarks = stride(from: 5, through: max(5, totalMinutes - 5), by: 5)
        let finalMinuteMarks = max(1, totalMinutes - 4)...totalMinutes
        return Array(Set(fiveMinuteMarks).union(finalMinuteMarks)).sorted()
    }

    private static func unique(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.filter { seen.insert($0).inserted }
    }

    private static func fitBanner(_ text: String) -> String {
        guard text.count > 88 else { return text }
        let index = text.index(text.startIndex, offsetBy: 85)
        return "\(text[..<index])..."
    }

    private static func replacementTask(goal: String, task: String?) -> String {
        let cleanedTask = clean(task, fallback: "")
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

    private static func loadResponses() -> [String: Any] {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        guard let data = defaults.data(forKey: onboardingKey),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }

        return object
    }

    private static func clean(_ value: String?, fallback: String) -> String {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? fallback : trimmed
    }

    private static func bannerPhrase(_ text: String, fallback: String) -> String {
        text.count <= 22 ? text : fallback
    }
}

private enum SharedMonitorAppSelection {
    private static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"
    private static let key = "familyActivitySelection"

    static func load() -> FamilyActivitySelection {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        guard let data = defaults.data(forKey: key) else {
            return FamilyActivitySelection()
        }

        do {
            return try PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
        } catch {
            return FamilyActivitySelection()
        }
    }
}
