import CoreFoundation
import Foundation

enum ReflectionPrompts {
    static let timing = "Is this a good time to scroll, or are you avoiding something?"
    static let three = "What are three things you could do in the next 10 minutes instead?"
    static let available = [timing, three]
}

/// Curated complete sentences. Free-text answers select a topic; they are never
/// inserted into a sentence or clipped into fragments in an OS shield/banner.
enum PersonalizedNudgeLibrary {
    static let topics: [(keywords: [String], messages: [String])] = [
        (["read", "book", "novel", "library"], [
            "Your next page is waiting. Would you like to read it now?",
            "Trade a little scrolling for a story you chose.",
            "One page is a small step back toward your reading goal.",
            "Would you like to use this moment for the book you chose?"
        ]),
        (["study", "exam", "school", "class", "learn", "course"], [
            "Could one small study task be your next step?",
            "Your learning goal is still there. Start with one question.",
            "Take a breath, then decide whether to return to your notes.",
            "A short review could help you feel ready for what comes next."
        ]),
        (["gym", "fitness", "workout", "exercise", "walk", "run", "health"], [
            "Would a short walk feel better than another scroll?",
            "Your movement goal can begin with one comfortable step.",
            "Check in with your body. Would you like to move a little?",
            "A gentle stretch is an option if it feels right for you."
        ]),
        (["sleep", "bed", "rest", "night", "wind down"], [
            "Would putting the phone down help you wind down?",
            "Give yourself a quieter moment before you keep scrolling.",
            "Your rest matters. Is this a good time to step away?",
            "Try a calm breath and choose what helps you rest."
        ]),
        (["write", "draft", "essay", "creative", "art", "music", "draw"], [
            "Could one small creative step be more satisfying right now?",
            "Your idea deserves a little space. Would you like to return to it?",
            "One sentence or one sketch can be enough to begin.",
            "Pause the feed and make room for something of your own."
        ]),
        (["family", "friend", "partner", "relationship", "connect"], [
            "Would a moment with someone you care about feel better?",
            "A small check-in can make room for a real connection.",
            "Think of someone who matters to you. What would help you connect?",
            "Your attention is yours to share. Where would you like it to go?"
        ]),
        (["work", "career", "job", "project", "focus", "productivity"], [
            "What is one small task you would feel good about finishing?",
            "You can return to your goal with one manageable step.",
            "Pause and choose where your next few minutes should go.",
            "Would closing the feed make space for what you planned?"
        ])
    ]
    static let general = [
        "Pause for a breath. Is this still the break you wanted?",
        "You can keep scrolling or choose something else for this moment.",
        "What would help you feel good about your next choice?",
        "Take a moment to notice what you need before you continue."
    ]
    static let preferenceMessages:[String:[String:[String]]] = [
        "aiTone":[
            "Supportive":["One small choice can help you return to what matters.","You can pause here and give yourself a fresh start."],
            "Direct":["Pause the feed. Choose your next step.","Check your goal before you spend more time here."],
            "Playful":["The feed has no finish line. Your next small win does.","Give your thumb a break and your plans a turn."],
            "Intense":["Pause now. Make your next choice deliberate.","Your attention matters. Put it toward a goal you chose."]
        ],
        "aiFrictionStyle":[
            "Balanced":["Take a breath, check your plan, and choose what comes next."],
            "Reflective":["What feeling brought you here, and what do you need now?","Will another scroll help you feel the way you want to feel?"],
            "Direct":["Close the feed and try one small step toward your goal."]
        ],
        "persuasionStyle":[
            "Future Self":["What choice would your future self thank you for?"],
            "Goal Cost":["What would you rather do with your next few minutes?"],
            "Tiny Action":["Pick one small task. You only need to begin."],
            "Identity":["Take one small action that reflects the person you want to be."]
        ]
    ]
    static func messages(answers: [String: String], selectedPrompts: [String] = []) -> [String] {
        let text = answers.values.joined(separator: " ").lowercased()
        let matches = topics.filter { topic in topic.keywords.contains { keyword in
            text.range(of: "\\b" + NSRegularExpression.escapedPattern(for: keyword) + "[a-z]*\\b", options: .regularExpression) != nil
        }}
        let base=matches.isEmpty ? general : matches.flatMap(\.messages)
        let preferences=["aiTone","aiFrictionStyle","persuasionStyle"].flatMap { field in
            preferenceMessages[field]?[answers[field] ?? ""] ?? []
        }
        var seen=Set<String>()
        return (ReflectionPrompts.available.filter(selectedPrompts.contains) + base + preferences).filter { seen.insert($0).inserted }
    }
    /// Keep a short history across callbacks so a session does not cycle between two messages.
    static func choose(_ messages: [String], recent: [String]) -> String {
        let complete = Array(Set(messages.filter {
            !$0.isEmpty && $0.count <= 110 && $0.last.map { ".?!".contains($0) } == true
        })).sorted()
        guard !complete.isEmpty else { return general[0] }
        let unseen = complete.filter { !recent.contains($0) }
        if let message = unseen.randomElement() { return message }
        // When every message has appeared, reuse the least recently shown one.
        return complete.min { (recent.lastIndex(of:$0) ?? -1) < (recent.lastIndex(of:$1) ?? -1) }!
    }
    static func remainingTime(_ minutes: Int) -> String {
        let value = max(0, minutes)
        return "\(value) \(value == 1 ? "minute" : "minutes") left."
    }
    static func choose(_ messages: [String], avoiding previous: String?) -> String {
        let complete = messages.filter { $0.count <= 110 && $0.last.map { ".?!".contains($0) } == true }
        return complete.filter { $0 != previous }.randomElement() ?? complete.first ?? general[0]
    }
}

struct ShieldPresentation: Codable {
    static let sessionExplanation = "Continue when you’re ready, or step away for now."
    var day: String
    var title: String
    var explanation: String
    var action: String?
    var messages: [String]
    var dailyLimitReached: Bool? = nil

    static func session(day: String, nextMinutes: Int, completedSessions: Int, messages: [String]) -> Self {
        if nextMinutes == 0 {
            return Self(day: day, title: "You’ve reached your daily app limit",
                        explanation: "Your daily allowance renews tomorrow.",
                        action: nil, messages: messages, dailyLimitReached: true)
        }
        return Self(day: day, title: completedSessions > 0 ? "Your session has ended" : "Pause and choose",
                    explanation: sessionExplanation,
                    action: "Continue to app", messages: messages, dailyLimitReached: false)
    }

    func actionLabel(appName: String?) -> String? {
        // Cached shields from older installs may still contain an extension button.
        if dailyLimitReached == true { return nil }
        guard action != nil, dailyLimitReached == false else { return action }
        guard let name = appName?.trimmingCharacters(in: .whitespacesAndNewlines),
              !name.isEmpty else { return "Continue to app" }
        return "Continue to \(name)"
    }

    func forFirstDay(_ isFirstDay: Bool) -> Self {
        guard isFirstDay, dailyLimitReached == true else { return self }
        var guidance = self
        guidance.explanation = "Open the Stats tab in Hoosh to customize this app’s daily limit and session length."
        guidance.action = nil
        guidance.messages = []
        return guidance
    }
}
enum ShieldPresentationStore {
    static let group = "group.com.AnishaDasgupta.DisconnectApp"
    static var defaults: UserDefaults { UserDefaults(suiteName: group)! }
    static func synchronize() {
        // The host and shield extensions can read this suite from different processes.
        CFPreferencesAppSynchronize(group as CFString)
    }

    static func key(_ tokenData: Data) -> String { "disconnect.shieldPresentation." + tokenData.base64EncodedString() }
    static func day() -> String {
        let p = Calendar.current.dateComponents([.year,.month,.day], from: Date())
        return "\(p.year ?? 0)-\(p.month ?? 0)-\(p.day ?? 0)"
    }
    static func save(_ value: ShieldPresentation, tokenData: Data) throws {
        defaults.set(try JSONEncoder().encode(value), forKey: key(tokenData))
    }
    static func load(tokenData: Data) -> ShieldPresentation? {
        guard let data = defaults.data(forKey: key(tokenData)), data.count < 16384,
              let value = try? JSONDecoder().decode(ShieldPresentation.self, from: data), value.day == day() else { return nil }
        return value
    }
    static func selectedPrompts() -> [String] {
        guard let data = defaults.data(forKey: "onboardingResponses"),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return [] }
        return object["selectedQuestions"] as? [String] ?? []
    }

    static func answers() -> [String: String] {
        guard let data = defaults.data(forKey: "onboardingResponses"),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return [:] }
        return object.reduce(into: [:]) { result, item in
            if item.key != "customQuestion", let text = item.value as? String { result[item.key] = text }
        }
    }
}
