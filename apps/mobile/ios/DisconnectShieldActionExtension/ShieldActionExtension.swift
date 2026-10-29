import Foundation
import DeviceActivity
import FamilyControls
import ManagedSettings
import ManagedSettingsUI
import os
import UserNotifications

final class ShieldActionExtension: ShieldActionDelegate {
    private let store = ManagedSettingsStore()
    private let logger = Logger(subsystem: "com.AnishaDasgupta.DisconnectApp", category: "ShieldAction")

    override func handle(action: ShieldAction, for application: ApplicationToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        handle(action: action, completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction, for webDomain: WebDomainToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        handle(action: action, completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction, for category: ActivityCategoryToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        handle(action: action, completionHandler: completionHandler)
    }

    private func handle(action: ShieldAction, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            logger.notice("Primary shield action pressed; closing app and keeping shields active")
            SharedShieldBypass.cancelBreakReminders()
            SharedShieldBypass.clearBypass()
            SharedShieldBypass.stopBypassMonitoring()
            SharedShieldBypass.resetAttemptCount()
            SharedInterventionHistory.recordStayedFocused()
            completionHandler(.close)

        case .secondaryButtonPressed:
            let minutes = SharedShieldBypass.bypassMinutes()
            logger.notice("Secondary shield action pressed; deferring shield for \(minutes, privacy: .public) minutes")
            SharedInterventionHistory.recordOpenedAnyway()
            SharedShieldBypass.incrementAttemptCount()
            SharedShieldBypass.setBypass(minutes: minutes)
            SharedShieldBypass.scheduleBreakReminders(minutes: minutes)
            SharedShieldBypass.scheduleBypassMonitor(minutes: minutes)
            SharedShieldBypass.scheduleUsageMonitor(minutes: minutes)
            removeShieldsForBypass()

            DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + 0.2) {
                SharedShieldWriter.removeAllShields()
            }

            DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + 0.6) {
                SharedShieldWriter.removeAllShields()
            }

            completionHandler(.defer)

        @unknown default:
            logger.warning("Unknown shield action; closing app")
            completionHandler(.close)
        }
    }

    private func removeShieldsForBypass() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        store.shield.webDomainCategories = nil
    }
}

private enum SharedShieldWriter {
    static func removeAllShields(store: ManagedSettingsStore = ManagedSettingsStore()) {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        store.shield.webDomainCategories = nil
    }
}

private enum SharedShieldBypass {
    private static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"
    private static let onboardingKey = "onboardingResponses"
    private static let appSelectionKey = "familyActivitySelection"
    private static let bypassUntilKey = "shieldBypassUntil"
    private static let pendingAppNameKey = "pendingShieldAppName"
    private static let attemptCountsKey = "shieldAttemptCounts"
    private static let reminderPrefix = "disconnect.breakReminder."
    private static let reminderCategoryIdentifier = "disconnect.breakReminder.category"
    private static let doneScrollingActionIdentifier = "disconnect.breakReminder.doneScrolling"

    static func bypassMinutes() -> Int {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        guard let data = defaults.data(forKey: onboardingKey),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let minutes = object["bypassMinutes"] as? Int else {
            return 5
        }

        return min(max(minutes, 5), 60)
    }

    static func setBypass(minutes: Int) {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        defaults.set(Date().addingTimeInterval(TimeInterval(minutes * 60)), forKey: bypassUntilKey)
    }

    static func clearBypass() {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        defaults.removeObject(forKey: bypassUntilKey)
    }

    static func incrementAttemptCount() {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        let appName = defaults.string(forKey: pendingAppNameKey) ?? "protected app"
        let key = normalizedKey(for: appName)
        var counts = defaults.dictionary(forKey: attemptCountsKey) as? [String: Int] ?? [:]
        counts[key] = min((counts[key] ?? 0) + 1, 8)
        defaults.set(counts, forKey: attemptCountsKey)
    }

    static func resetAttemptCount() {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        guard let appName = defaults.string(forKey: pendingAppNameKey) else { return }
        let key = normalizedKey(for: appName)
        var counts = defaults.dictionary(forKey: attemptCountsKey) as? [String: Int] ?? [:]
        counts[key] = nil
        defaults.set(counts, forKey: attemptCountsKey)
    }

    static func scheduleBreakReminders(minutes: Int) {
        cancelBreakReminders()
        registerNotificationActions()
    }

    static func cancelBreakReminders() {
        let identifiers = (1...60).map { "\(reminderPrefix)\($0)" }
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        center.removeDeliveredNotifications(withIdentifiers: identifiers)
    }

    static func registerNotificationActions() {
        let doneAction = UNNotificationAction(
            identifier: doneScrollingActionIdentifier,
            title: "I'm done",
            options: [.foreground]
        )
        let category = UNNotificationCategory(
            identifier: reminderCategoryIdentifier,
            actions: [doneAction],
            intentIdentifiers: [],
            options: []
        )
        UNUserNotificationCenter.current().setNotificationCategories([category])
    }

    static func stopBypassMonitoring() {
        DeviceActivityCenter().stopMonitoring([.disconnectShieldBypass, .disconnectBypassUsage])
    }

    static func scheduleBypassMonitor(minutes: Int) {
        let clampedMinutes = min(max(minutes, 1), 60)
        let center = DeviceActivityCenter()
        let calendar = Calendar.current
        let now = Date()
        let selection = loadSelection()

        // Relock just before the final reminder fires so the shield is ready on first presentation.
        let relockStart = now.addingTimeInterval(max(1, TimeInterval(clampedMinutes * 60) - 2))
        let relockEnd = relockStart.addingTimeInterval(15 * 60)
        let schedule = DeviceActivitySchedule(
            intervalStart: calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: relockStart),
            intervalEnd: calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: relockEnd),
            repeats: false
        )
        let event = DeviceActivityEvent(
            applications: selection.applicationTokens,
            categories: selection.categoryTokens,
            webDomains: selection.webDomainTokens,
            threshold: DateComponents(minute: 1)
        )
        let events: [DeviceActivityEvent.Name: DeviceActivityEvent] =
            event.includesAllActivity ? [:] : [.disconnectShieldBypassLimit: event]

        center.stopMonitoring([.disconnectShieldBypass])

        do {
            try center.startMonitoring(.disconnectShieldBypass, during: schedule, events: events)
        } catch {
            print("Failed to schedule bypass monitor:", error)
        }
    }

    static func scheduleUsageMonitor(minutes: Int) {
        let clampedMinutes = min(max(minutes, 1), 60)
        let center = DeviceActivityCenter()
        let calendar = Calendar.current
        let now = Date()
        let monitorEnd = now.addingTimeInterval(TimeInterval(max(15, clampedMinutes + 1) * 60))
        let schedule = DeviceActivitySchedule(
            intervalStart: calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: now),
            intervalEnd: calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: monitorEnd),
            repeats: false
        )
        let selection = loadSelection()
        let events = usageEvents(minutes: clampedMinutes, selection: selection)

        center.stopMonitoring([.disconnectBypassUsage])

        guard !events.isEmpty else { return }

        do {
            try center.startMonitoring(.disconnectBypassUsage, during: schedule, events: events)
        } catch {
            print("Failed to schedule bypass usage monitor:", error)
        }
    }

    private static func reminderMinutes(for totalMinutes: Int) -> [Int] {
        guard totalMinutes > 5 else {
            return Array(1...totalMinutes)
        }

        let fiveMinuteMarks = stride(from: 5, through: max(5, totalMinutes - 5), by: 5)
        let finalMinuteMarks = max(1, totalMinutes - 4)...totalMinutes
        return Array(Set(fiveMinuteMarks).union(finalMinuteMarks)).sorted()
    }

    private static func usageEvents(minutes: Int, selection: FamilyActivitySelection) -> [DeviceActivityEvent.Name: DeviceActivityEvent] {
        guard !selection.applicationTokens.isEmpty || !selection.categoryTokens.isEmpty || !selection.webDomainTokens.isEmpty else {
            return [:]
        }

        return Dictionary(uniqueKeysWithValues: reminderMinutes(for: minutes).map { minute in
            (
                DeviceActivityEvent.Name.disconnectBypassUsageMinute(minute),
                DeviceActivityEvent(
                    applications: selection.applicationTokens,
                    categories: selection.categoryTokens,
                    webDomains: selection.webDomainTokens,
                    threshold: DateComponents(minute: minute)
                )
            )
        })
    }


    private static func loadResponses() -> [String: Any] {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        guard let data = defaults.data(forKey: onboardingKey),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }

        return object
    }

    private static func normalizedKey(for appName: String) -> String {
        appName
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .replacingOccurrences(of: ".", with: "_")
    }

    private static func loadSelection() -> FamilyActivitySelection {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        guard let data = defaults.data(forKey: appSelectionKey),
              let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) else {
            return FamilyActivitySelection()
        }

        return selection
    }

    private static func reminderBody(for responses: [String: Any], minute: Int, totalMinutes: Int) -> String {
        SharedAIFrictionPromptEngine.reminderBody(for: responses, minute: minute, totalMinutes: totalMinutes)
    }
}

private extension DeviceActivityName {
    static let disconnectShieldBypass = Self("disconnectShieldBypass")
    static let disconnectBypassUsage = Self("disconnectBypassUsage")
}

private extension DeviceActivityEvent.Name {
    static let disconnectShieldBypassLimit = Self("disconnectShieldBypassLimit")

    static func disconnectBypassUsageMinute(_ minute: Int) -> Self {
        Self("disconnectBypassUsage.minute.\(minute)")
    }
}

private enum SharedAIFrictionPromptEngine {
    static func reminderBody(for responses: [String: Any], minute: Int, totalMinutes: Int) -> String {
        let goal = clean(responses["primaryGoal"] as? String, fallback: "your goal")
        let feeling = clean(responses["focusFeeling"] as? String, fallback: "in control")
        let context = productivityContext(fallbackAction: replacementTask(goal: goal, task: responses["tinyTask"] as? String))
        let temptation = clean(responses["scrollTemptation"] as? String, fallback: "autopilot")
        let cost = clean(responses["scrollCost"] as? String, fallback: "lost momentum")
        let anchor = clean(responses["accountabilityAnchor"] as? String, fallback: "your reason")
        let tone = clean(responses["aiTone"] as? String, fallback: "Supportive")
        let style = clean(responses["aiFrictionStyle"] as? String, fallback: "Balanced")
        let persuasion = clean(responses["persuasionStyle"] as? String, fallback: "Future Self")

        return compactReminder(
            goal: goal,
            feeling: feeling,
            context: context,
            temptation: temptation,
            cost: cost,
            anchor: anchor,
            tone: tone,
            style: style,
            persuasion: persuasion,
            minute: minute,
            totalMinutes: totalMinutes
        )
    }

    private static func finalPrompt(goal: String, task: String, temptation: String, cost: String, anchor: String, persuasion: String) -> String {
        switch persuasion {
        case "Goal Cost":
            return "Minute is up. The cost you named was: \(cost). Locking the door now. Go protect \(goal)."
        case "Tiny Action":
            return "Time is up. Do not negotiate with \(temptation.lowercased()). Put one foot back into your life: \(task)"
        case "Identity":
            return "Time is up. This is the rep that matters: choose \(anchor), close the loop, and return to \(goal)."
        default:
            return "Time is up. The feed got its break. Now give \(goal) the next honest minute: \(task)"
        }
    }

    private static func compactReminder(goal: String, feeling: String, context: SharedProductivityPromptContext, temptation: String, cost: String, anchor: String, tone: String, style: String, persuasion: String, minute: Int, totalMinutes: Int) -> String {
        let prefix = minute == totalMinutes ? "Done:" : "Min \(minute)/\(totalMinutes):"
        if let cached = cachedReminderMessage(minute: minute, totalMinutes: totalMinutes) {
            return fitBanner("\(prefix) \(cached)")
        }

        let shortGoal = bannerPhrase(goal, fallback: "your goal")
        let shortAnchor = bannerPhrase(anchor, fallback: "your reason")
        let shortFeeling = bannerPhrase(feeling, fallback: "in control")
        let shortTask = bannerPhrase(context.action, fallback: "one real action")
        let shortTemptation = bannerPhrase(temptation, fallback: "autopilot")
        let shortCost = bannerPhrase(cost, fallback: "lost momentum")
        let shortContext = context.shortened()

        let messages: [String]
        if minute == totalMinutes {
            messages = finalReminderOptions(goal: shortGoal, task: shortTask, anchor: shortAnchor, tone: tone)
        } else {
            messages = activeReminderOptions(
                goal: shortGoal,
                feeling: shortFeeling,
                task: shortTask,
                context: shortContext,
                temptation: shortTemptation,
                cost: shortCost,
                anchor: shortAnchor,
                tone: tone,
                style: style,
                persuasion: persuasion
            )
        }
        let index = reminderSequenceIndex(minute: minute, totalMinutes: totalMinutes)
        let message = messages[index % messages.count]

        return fitBanner("\(prefix) \(message)")
    }

    private static func activeReminderOptions(goal: String, feeling: String, task: String, context: SharedProductivityPromptContext, temptation: String, cost: String, anchor: String, tone: String, style: String, persuasion: String) -> [String] {
        let productivity = productivityReminderOptions(context: context, task: task, tone: tone)
        let primary: [String]
        switch persuasion {
        case "Goal Cost":
            primary = [
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
            primary = [
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
            primary = [
                "Choose \(anchor).",
                "This exit proves the promise.",
                "Be the follow-through.",
                "\(goal) is who you vote for.",
                "Keep the small promise.",
                "Act like the person you named.",
                "\(anchor) gets this minute.",
                "Identity is one tap away."
            ]
        default:
            primary = [
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

        return unique(productivity + primary + styleOptions(style: style, goal: goal, feeling: feeling, task: task, temptation: temptation, cost: cost) + toneOptions(tone: tone, goal: goal, task: task, anchor: anchor))
    }

    private static func productivityReminderOptions(context: SharedProductivityPromptContext, task: String, tone: String) -> [String] {
        guard context.hasExternalTask else { return [] }

        switch tone {
        case "Direct":
            return [
                "\(context.label): \(context.title). \(task).",
                "\(task). Then come back if needed.",
                "\(context.title) beats this scroll."
            ]
        case "Playful":
            return [
                "Plot twist: \(context.title).",
                "\(context.label) cameo: \(task).",
                "Give \(context.title) the next scene."
            ]
        case "Intense":
            return [
                "\(context.title) is waiting. Leave.",
                "Do not trade \(context.title) for this.",
                "\(task). Protect your day."
            ]
        default:
            return [
                "Return to \(context.title).",
                "Your \(context.label.lowercased()) is next: \(task).",
                "\(task). Make this interruption useful."
            ]
        }
    }

    private static func finalReminderOptions(goal: String, task: String, anchor: String, tone: String) -> [String] {
        switch tone {
        case "Direct":
            return ["Time is up. \(task).", "Enough. Return to \(goal).", "Relock. Move now."]
        case "Playful":
            return ["Feed break is over. \(task).", "Future you gets the mic.", "\(anchor) gets the next scene."]
        case "Intense":
            return ["End it here. \(task).", "No overtime. Protect \(goal).", "Do not donate the next hour."]
        default:
            return ["Time is up. Return to \(goal).", "Leave cleanly. \(task).", "\(anchor) gets this back."]
        }
    }

    private static func toneOptions(tone: String, goal: String, task: String, anchor: String) -> [String] {
        switch tone {
        case "Direct":
            return ["Put it down cleanly.", "End the scroll here.", "No extra lap.", "Close and move.", "\(task). No debate."]
        case "Playful":
            return ["Plot twist: leave.", "The feed can wait.", "Future you gets the mic.", "Exit scene, choose \(goal).", "Tiny win: \(task)."]
        case "Intense":
            return ["Take attention back.", "Do not donate more time.", "Break the loop.", "\(goal) over the feed.", "\(task). Kill the loop."]
        default:
            return ["You can leave gently.", "Choose the quiet win.", "\(anchor) can have this.", "Pause, breathe, exit.", "\(task). You are in control."]
        }
    }

    private static func styleOptions(style: String, goal: String, feeling: String, task: String, temptation: String, cost: String) -> [String] {
        switch style {
        case "Reflective":
            return ["Is this rest or \(temptation.lowercased())?", "Will this end with \(feeling)?", "What are you avoiding?", "What would feel better after?", "Name the urge, then \(task)."]
        case "Direct":
            return ["Close it before drift.", "Stop feeding the loop.", "\(goal) is the priority.", "Exit now, not later.", "\(cost) starts with one more minute."]
        default:
            return ["Check in, then choose.", "This is the exit ramp.", "Small reset: \(task).", "Your time is still yours.", "Leave before autopilot."]
        }
    }

    private static func reminderSequenceIndex(minute: Int, totalMinutes: Int) -> Int {
        let reminders = reminderMinutes(for: totalMinutes)
        return reminders.firstIndex(of: minute) ?? max(0, minute - 1)
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

    private static func productivityContext(fallbackAction: String) -> SharedProductivityPromptContext {
        let defaults = UserDefaults(suiteName: "group.com.AnishaDasgupta.DisconnectApp") ?? .standard
        guard let data = defaults.data(forKey: "productivityContextSnapshot"),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return SharedProductivityPromptContext(kind: "", title: "", action: fallbackAction)
        }

        let action = clean(object["actionLine"] as? String, fallback: "")
        let reminderTitle = clean(object["nextReminderTitle"] as? String, fallback: "")
        let calendarTitle = clean(object["nextCalendarTitle"] as? String, fallback: "")
        let title = clean(object["contextTitle"] as? String, fallback: reminderTitle.isEmpty ? calendarTitle : reminderTitle)
        let kind = clean(object["contextKind"] as? String, fallback: reminderTitle.isEmpty ? "calendar" : "reminder")
        return SharedProductivityPromptContext(
            kind: kind,
            title: title,
            action: action.isEmpty ? fallbackAction : action
        )
    }

    private static func cachedReminderMessage(minute: Int, totalMinutes: Int) -> String? {
        guard let pack = SharedGeneratedNudgePack.load() else { return nil }
        let options = minute == totalMinutes ? pack.finalReminders : pack.activeReminders
        guard !options.isEmpty else { return nil }
        let index = reminderSequenceIndex(minute: minute, totalMinutes: totalMinutes)
        return options[index % options.count]
    }

    private static func fitBanner(_ text: String) -> String {
        guard text.count > 88 else { return text }
        let index = text.index(text.startIndex, offsetBy: 85)
        return "\(text[..<index])..."
    }

    private static func bannerPhrase(_ text: String, fallback: String) -> String {
        let cleaned = text.trimmingCharacters(in: .whitespacesAndNewlines)
        return cleaned.count <= 22 && !cleaned.isEmpty ? cleaned : fallback
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

    private static func clean(_ value: String?, fallback: String) -> String {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? fallback : trimmed
    }

    private static func promptsFor(
        persuasion: String,
        goal: String,
        feeling: String,
        task: String,
        temptation: String,
        cost: String,
        anchor: String,
        style: String
    ) -> [String] {
        switch persuasion {
        case "Goal Cost":
            return [
                "you named the cost: \(cost). Is this still a good trade?",
                "\(goal) is paying for this scroll in tiny installments.",
                "if you keep going, what part of \(cost) shows up first?",
                "this started as \(temptation). Do you want it to become a lost hour?",
                "one exit now protects the next hour of \(goal)."
            ]
        case "Tiny Action":
            return [
                "close the app and do the smallest possible version of this: \(task)",
                "you do not need motivation. You need one motion: \(task)",
                "make leaving easier than staying. Start with \(task)",
                "\(temptation) can wait. Your next move is \(task)",
                "trade this minute for proof that you can begin: \(task)"
            ]
        case "Identity":
            return [
                "this is for \(anchor). Would they want you to keep scrolling?",
                "\(goal) is not abstract. It is this exact minute.",
                "the old habit wants automatic. You chose intentional.",
                "prove the identity in public only after you practice it alone.",
                "act like the person who already follows through for \(anchor)."
            ]
        default:
            return [
                "you wanted to feel \(feeling). Is this still taking you there?",
                "your future self gets a vote. Do they choose the feed or \(goal)?",
                "pause and tell the truth: is this rest, or is it \(temptation)?",
                "\(goal) is still waiting. Return before \(cost.lowercased()) shows up.",
                "choose the relief that lasts longer than the feed."
            ]
        }
    }

    private static func toneWrap(_ text: String, tone: String, minute: Int? = nil, totalMinutes: Int? = nil) -> String {
        switch tone {
        case "Direct":
            return "\(text) \(directEnding(for: minute))"
        case "Playful":
            return "\(text) \(playfulEnding(for: minute))"
        case "Intense":
            return "\(text) \(intenseEnding(for: minute, totalMinutes: totalMinutes))"
        default:
            return text
        }
    }

    private static func directEnding(for minute: Int?) -> String {
        let endings = ["Close it now.", "Make the exit clean.", "Choose the better move."]
        return endings[index(for: minute, count: endings.count)]
    }

    private static func playfulEnding(for minute: Int?) -> String {
        let endings = ["Tiny plot twist: you can leave.", "Exit stage left from the feed.", "Your future self gets a cameo here."]
        return endings[index(for: minute, count: endings.count)]
    }

    private static func intenseEnding(for minute: Int?, totalMinutes: Int?) -> String {
        if let minute, let totalMinutes, minute == min(5, totalMinutes) {
            return "This is your exit."
        }

        let endings = ["Take your attention back.", "Do not let the feed spend this minute for you.", "Leave before this turns automatic."]
        return endings[index(for: minute, count: endings.count)]
    }

    private static func index(for minute: Int?, count: Int) -> Int {
        guard let minute else { return 0 }
        return abs(minute - 1) % count
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

private struct SharedProductivityPromptContext {
    let kind: String
    let title: String
    let action: String

    var hasExternalTask: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var label: String {
        kind.lowercased() == "calendar" ? "Calendar" : "Reminder"
    }

    func shortened() -> SharedProductivityPromptContext {
        SharedProductivityPromptContext(
            kind: kind,
            title: title.count <= 28 ? title : String(title.prefix(28)),
            action: action.count <= 32 ? action : "start the next step"
        )
    }
}

private struct SharedInterventionHistoryEvent: Codable {
    enum Decision: String, Codable {
        case stayedFocused
        case openedAnyway
    }

    let id: UUID
    let appName: String
    let decision: Decision
    let date: Date
    let savedMinutes: Int
}

private enum SharedInterventionHistory {
    private static let appGroupID = "group.com.AnishaDasgupta.DisconnectApp"
    private static let eventsKey = "interventionHistoryEvents"
    private static let pendingAppNameKey = "pendingShieldAppName"

    static func recordStayedFocused() {
        let minutes = SharedShieldBypass.bypassMinutes()
        record(decision: .stayedFocused, savedMinutes: minutes)
    }

    static func recordOpenedAnyway() {
        record(decision: .openedAnyway, savedMinutes: 0)
    }

    private static func record(decision: SharedInterventionHistoryEvent.Decision, savedMinutes: Int) {
        let defaults = UserDefaults(suiteName: appGroupID) ?? .standard
        let appName = defaults.string(forKey: pendingAppNameKey) ?? "Protected App"
        let event = SharedInterventionHistoryEvent(
            id: UUID(),
            appName: appName,
            decision: decision,
            date: Date(),
            savedMinutes: savedMinutes
        )

        var events = loadEvents(from: defaults)
        events.insert(event, at: 0)
        events = Array(events.prefix(50))

        if let data = try? PropertyListEncoder().encode(events) {
            defaults.set(data, forKey: eventsKey)
        }
    }

    private static func loadEvents(from defaults: UserDefaults) -> [SharedInterventionHistoryEvent] {
        guard let data = defaults.data(forKey: eventsKey),
              let events = try? PropertyListDecoder().decode([SharedInterventionHistoryEvent].self, from: data) else {
            return []
        }

        return events
    }
}
