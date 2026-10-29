import Foundation
import UserNotifications

enum BreakReminderScheduler {
    private static let requestPrefix = "disconnect.breakReminder."
    static let reminderCategoryIdentifier = "disconnect.breakReminder.category"
    static let doneScrollingActionIdentifier = "disconnect.breakReminder.doneScrolling"

    static func requestAuthorization() async {
        registerNotificationActions()

        do {
            try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])
        } catch {
            print("Failed to request break reminder authorization:", error)
        }
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

    static func scheduleBreakReminders(minutes: Int, responses: OnboardingResponses) {
        cancelBreakReminders()

        let clampedMinutes = min(max(minutes, 5), 60)
        let center = UNUserNotificationCenter.current()

        for minute in reminderMinutes(for: clampedMinutes) {
            let content = UNMutableNotificationContent()
            content.title = minute == clampedMinutes ? "Time is up" : "Tap to end session early"
            content.body = reminderBody(for: responses, minute: minute, totalMinutes: clampedMinutes)
            content.sound = .default
            content.categoryIdentifier = reminderCategoryIdentifier

            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(minute * 60), repeats: false)
            let request = UNNotificationRequest(identifier: "\(requestPrefix)\(minute)", content: content, trigger: trigger)
            center.add(request)
        }
    }

    static func cancelBreakReminders() {
        let identifiers = (1...60).map { "\(requestPrefix)\($0)" }
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        center.removeDeliveredNotifications(withIdentifiers: identifiers)
    }

    private static func reminderMinutes(for totalMinutes: Int) -> [Int] {
        guard totalMinutes > 5 else {
            return Array(1...totalMinutes)
        }

        let fiveMinuteMarks = stride(from: 5, through: max(5, totalMinutes - 5), by: 5)
        let finalMinuteMarks = max(1, totalMinutes - 4)...totalMinutes
        return Array(Set(fiveMinuteMarks).union(finalMinuteMarks)).sorted()
    }

    private static func reminderBody(for responses: OnboardingResponses, minute: Int, totalMinutes: Int) -> String {
        AIFrictionPromptEngine.reminderBody(for: responses, minute: minute, totalMinutes: totalMinutes)
    }
}

enum AIFrictionPromptEngine {
    static func reminderBody(for responses: OnboardingResponses, minute: Int, totalMinutes: Int) -> String {
        let goal = clean(responses.primaryGoal, fallback: OnboardingResponses.fallback.primaryGoal)
        let feeling = clean(responses.focusFeeling, fallback: OnboardingResponses.fallback.focusFeeling)
        let context = productivityContext(fallbackAction: replacementTask(goal: goal, task: responses.tinyTask))
        let temptation = clean(responses.scrollTemptation, fallback: OnboardingResponses.fallback.scrollTemptation)
        let cost = clean(responses.scrollCost, fallback: OnboardingResponses.fallback.scrollCost)
        let anchor = clean(responses.accountabilityAnchor, fallback: OnboardingResponses.fallback.accountabilityAnchor)
        let tone = clean(responses.aiTone, fallback: "Supportive")
        let style = clean(responses.aiFrictionStyle, fallback: "Balanced")
        let persuasion = clean(responses.persuasionStyle, fallback: "Future Self")

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

    static func shieldNudge(for responses: OnboardingResponses, appName: String) -> String {
        if let cached = AIGeneratedNudgeStore.load()?.shieldPrompt.trimmingCharacters(in: .whitespacesAndNewlines),
           !cached.isEmpty {
            return cached.replacingOccurrences(of: "{app}", with: appName)
        }

        let goal = clean(responses.primaryGoal, fallback: OnboardingResponses.fallback.primaryGoal)
        let context = productivityContext(fallbackAction: replacementTask(goal: goal, task: responses.tinyTask))
        let task = context.action
        let cost = clean(responses.scrollCost, fallback: OnboardingResponses.fallback.scrollCost)
        let anchor = clean(responses.accountabilityAnchor, fallback: OnboardingResponses.fallback.accountabilityAnchor)
        let tone = clean(responses.aiTone, fallback: "Supportive")
        let persuasion = clean(responses.persuasionStyle, fallback: "Future Self")

        if context.hasExternalTask {
            switch tone {
            case "Direct":
                return "\(context.label): \(context.title). \(task)."
            case "Playful":
                return "Plot twist: \(context.title). \(task), then decide."
            case "Intense":
                return "\(context.title) is waiting. \(task), not \(appName)."
            default:
                return "Your \(context.label.lowercased()) says \(context.title). \(task)."
            }
        }

        switch persuasion {
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

    private static func compactReminder(goal: String, feeling: String, context: ProductivityPromptContext, temptation: String, cost: String, anchor: String, tone: String, style: String, persuasion: String, minute: Int, totalMinutes: Int) -> String {
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

    private static func activeReminderOptions(goal: String, feeling: String, task: String, context: ProductivityPromptContext, temptation: String, cost: String, anchor: String, tone: String, style: String, persuasion: String) -> [String] {
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

    private static func productivityReminderOptions(context: ProductivityPromptContext, task: String, tone: String) -> [String] {
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

    private static func productivityContext(fallbackAction: String) -> ProductivityPromptContext {
        let snapshot = ProductivityContextStore.load()
        let action = clean(snapshot.actionLine, fallback: "")
        let title = clean(snapshot.contextTitle, fallback: snapshot.nextReminderTitle.isEmpty ? snapshot.nextCalendarTitle : snapshot.nextReminderTitle)
        let kind = clean(snapshot.contextKind, fallback: snapshot.nextReminderTitle.isEmpty ? "calendar" : "reminder")
        return ProductivityPromptContext(
            kind: kind,
            title: title,
            action: action.isEmpty ? fallbackAction : action
        )
    }

    private static func cachedReminderMessage(minute: Int, totalMinutes: Int) -> String? {
        guard let pack = AIGeneratedNudgeStore.load() else { return nil }
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

    private static func replacementTask(goal: String, task: String) -> String {
        let cleanedTask = clean(task, fallback: "")
        if !cleanedTask.isEmpty && cleanedTask != OnboardingResponses.fallback.tinyTask && !isWeakTask(cleanedTask) {
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
        return OnboardingResponses.fallback.tinyTask
    }

    private static func isWeakTask(_ task: String) -> Bool {
        let lowerTask = task.lowercased()
        return lowerTask == "drink water"
            || lowerTask == "stretch"
            || lowerTask.contains("clear my desk")
            || lowerTask.contains("take five deep breaths")
    }

    private static func bannerPhrase(_ text: String, fallback: String) -> String {
        let cleaned = clean(text, fallback: fallback)
        return cleaned.count <= 22 ? cleaned : fallback
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

    private static func clean(_ value: String, fallback: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? fallback : trimmed
    }
}

private struct ProductivityPromptContext {
    let kind: String
    let title: String
    let action: String

    var hasExternalTask: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var label: String {
        kind.lowercased() == "calendar" ? "Calendar" : "Reminder"
    }

    func shortened() -> ProductivityPromptContext {
        ProductivityPromptContext(
            kind: kind,
            title: title.count <= 28 ? title : String(title.prefix(28)),
            action: action.count <= 32 ? action : "start the next step"
        )
    }
}
