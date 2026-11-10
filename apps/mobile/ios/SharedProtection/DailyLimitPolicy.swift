import Foundation

/// Opaque Apple token data remains on-device. IDs are random local rule IDs, never app names.
struct DailyAppRule: Codable, Identifiable, Equatable {
    let id: String
    let tokenData: Data
    var minutes: Int
    var revision: Int
    var configuredSessionMinutes: Int? = nil
    var researchLabel: String? = nil
    var sessionMinutes: Int { min(minutes, max(5, configuredSessionMinutes ?? 15)) }
    var eventName: String { "disconnect.perApp.\(id).\(revision)" }
}
struct DailyRuleCatalog: Codable {
    var version = 1
    var rules: [DailyAppRule] = []

    mutating func reconcile(tokens: [Data], defaultMinutes: Int = 30) {
        for token in tokens where !rules.contains(where: { $0.tokenData == token }) {
            rules.append(DailyAppRule(id: UUID().uuidString, tokenData: token,
                minutes: min(max(defaultMinutes, 5), 240), revision: 1,
                configuredSessionMinutes: 10))
        }
    }
    mutating func setMinutes(_ minutes: Int, for id: String) {
        guard let i = rules.firstIndex(where: { $0.id == id }) else { return }
        let clamped = min(max(minutes, 5), 240)
        if rules[i].minutes != clamped {
            rules[i].minutes = clamped
            rules[i].revision += 1
        }
    }
    mutating func setResearchLabel(_ text: String, for id: String) {
        guard let i=rules.firstIndex(where: { $0.id==id }) else { return }
        let label=String(text.trimmingCharacters(in:.whitespacesAndNewlines).prefix(80))
        rules[i].researchLabel=label.isEmpty ? nil : label
    }
    mutating func setSessionMinutes(_ minutes: Int, for id: String) {
        guard let i = rules.firstIndex(where: { $0.id == id }) else { return }
        rules[i].configuredSessionMinutes = min(rules[i].minutes, max(5, minutes))
    }
    func selected(tokens: [Data]) -> [DailyAppRule] {
        rules.filter { tokens.contains($0.tokenData) }.sorted { $0.id < $1.id }
    }
    static func decode(_ data: Data) throws -> DailyRuleCatalog {
        let value = try JSONDecoder().decode(Self.self, from: data)
        guard value.version == 1,
              Set(value.rules.map(\.id)).count == value.rules.count,
              Set(value.rules.map(\.tokenData)).count == value.rules.count,
              value.rules.allSatisfy({ !$0.id.isEmpty && !$0.tokenData.isEmpty && (5...240).contains($0.minutes) && $0.revision > 0 && ($0.configuredSessionMinutes.map { (5...240).contains($0) } ?? true) }) else {
            throw CocoaError(.coderReadCorrupt)
        }
        return value
    }
}
struct DailyAppAllowance: Codable {
    let activity: String
    let day: String
    let expiresAt: Date
    var minutes: Int? = nil
    var isExtra: Bool? = nil
}
enum DailyLimitPolicy {
    static func day(at date: Date, calendar: Calendar = .current) -> String {
        let p = calendar.dateComponents([.year, .month, .day], from: date)
        return "\(p.year ?? 0)-\(p.month ?? 0)-\(p.day ?? 0)"
    }
    static func sessionWindow(at date: Date, calendar: Calendar = .current) -> DateInterval {
        let midnight = calendar.dateInterval(of: .day, for: date)!.end
        // DeviceActivity requires a 15-minute schedule even when a session starts just before midnight.
        let start = min(date.addingTimeInterval(-60), midnight.addingTimeInterval(-15 * 60))
        return DateInterval(start: start, end: midnight)
    }

    static func shieldedIDs(selected: Set<String>, reached: [String: String], allowances: [String: DailyAppAllowance], day: String, now: Date) -> Set<String> {
        Set(selected.filter { id in
            guard reached[id] == day else { return false }
            if let allowance = allowances[id], allowance.day == day, allowance.expiresAt > now { return false }
            return true
        })
    }
}

/// Accounting is updated only by native usage callbacks, never by elapsed wall time.
struct AppSessionLedger: Codable {
    var day: String
    var usedMinutes = 0
    var extraUsed = false
    var completedSessions = 0
    var activity: String? = nil
    var progress = 0
    var lastNotifiedMinute = 0

    mutating func begin(activity: String, extra: Bool) {
        self.activity = activity
        progress = 0
        lastNotifiedMinute = 0
        if extra { extraUsed = true }
    }
    @discardableResult mutating func record(activity: String, minute: Int, duration: Int, extra: Bool) -> Bool {
        guard self.activity == activity, minute > progress, minute <= duration else { return false }
        if !extra { usedMinutes += minute - progress }
        progress = minute
        return true
    }
    mutating func finish(activity: String) {
        guard self.activity == activity else { return }
        self.activity = nil
        completedSessions += 1
    }
}
enum AppSessionPolicy {
    static func nextMinutes(rule: DailyAppRule, used: Int, reached: Bool) -> Int {
        reached ? 0 : min(rule.sessionMinutes, max(0, rule.minutes - used))
    }
    static func nudgeMinutes(duration: Int) -> [Int] {
        Array(Set((1...3).map { Int(ceil(Double(duration * $0) / 4)) })).filter { $0 > 0 && $0 < duration }.sorted()
    }
    static func blocks(allowance: DailyAppAllowance?, reached: Bool, day: String, now: Date) -> Bool {
        guard let allowance, allowance.day == day, allowance.expiresAt > now,
              allowance.minutes != nil, allowance.isExtra == false else { return true }
        return reached
    }
    static func finishesSession(progress: Int, duration: Int, used: Int, dailyLimit: Int) -> Bool {
        progress >= duration || used >= dailyLimit
    }
}
