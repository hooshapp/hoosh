import Foundation

/// Small on-device snapshot shared with extensions. Never include this in telemetry or AI requests.
struct LocalReminderTask: Codable {
    var title:String
    var dueAt:Date?
}
struct LocalProductivityNudge: Codable {
    var provider: String
    var title: String
    var dueAt: Date?
    var refreshedAt: Date
    var reminderTasks:[LocalReminderTask]? = nil
    static func selectReminders(_ tasks:[LocalReminderTask],now:Date) -> LocalProductivityNudge? {
        let valid=tasks.filter { !$0.title.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty }
        let soon=valid.filter { $0.dueAt.map { $0>now && $0.timeIntervalSince(now)<=4*3600 } ?? false }.sorted { $0.dueAt! < $1.dueAt! }
        if let task=soon.first { return LocalProductivityNudge(provider:"reminders",title:task.title,dueAt:task.dueAt,refreshedAt:now) }
        let overdue=valid.filter { $0.dueAt.map { $0<=now } ?? false }.sorted { $0.dueAt! < $1.dueAt! }
        let undated=valid.filter { $0.dueAt == nil }
        let group = overdue.isEmpty ? undated : overdue
        if !group.isEmpty {
            return LocalProductivityNudge(provider:"reminders",title:group.map(\.title).joined(separator:", "),dueAt:group.first!.dueAt,refreshedAt:now,reminderTasks:group)
        }
        guard let future=valid.sorted(by:{($0.dueAt ?? .distantFuture)<($1.dueAt ?? .distantFuture)}).first else { return nil }
        return LocalProductivityNudge(provider:"reminders",title:future.title,dueAt:future.dueAt,refreshedAt:now)
    }
    private func groupedMessage(_ tasks:[LocalReminderTask],overdue:Bool) -> String {
        let prefix=overdue ? "Overdue: " : "On your list: "
        let ending=overdue ? (tasks.count == 1 ? ". Get started on this." : ". Get started on these.") : (tasks.count == 1 ? ". Make time to get this done." : ". Make time to get these done.")
        let names=tasks.map { $0.title.replacingOccurrences(of:"\n",with:" ").trimmingCharacters(in:.whitespacesAndNewlines) }.filter { !$0.isEmpty }
        var included:[String]=[]
        for name in names {
            let candidate=included+[name]
            let remaining=names.count-candidate.count
            let more=remaining>0 ? ", and \(remaining) more" : ""
            guard (prefix+candidate.joined(separator:", ")+more+ending).count<=110 else { break }
            included=candidate
        }
        guard !included.isEmpty else {
            return overdue ? "You have \(names.count) overdue reminders. Get started on one." : "You have \(names.count) undated reminders. Make time to get them done."
        }
        let remaining=names.count-included.count
        return prefix+included.joined(separator:", ")+(remaining>0 ? ", and \(remaining) more" : "")+ending
    }
    /// Upcoming timed tasks, upcoming events, overdue tasks, then undated tasks.
    func priority(now:Date) -> Int {
        if provider == "calendar" { return dueAt.map { $0 > now && $0.timeIntervalSince(now)<=4*3600 ? 1 : 4 } ?? 4 }
        guard let dueAt else { return 3 }
        if dueAt <= now { return 2 }
        return dueAt.timeIntervalSince(now)<=4*3600 ? 0 : 4
    }
    static func reminderDueDate(_ components:DateComponents?,calendar:Calendar = .current) -> Date? {
        guard let components, let date=components.date ?? calendar.date(from:components) else { return nil }
        if components.hour == nil {
            return calendar.date(byAdding:.day,value:1,to:calendar.startOfDay(for:date))?.addingTimeInterval(-1)
        }
        return date
    }
    func messages(now: Date = Date()) -> [String] {
        guard ["calendar","reminders"].contains(provider),
              now >= refreshedAt, now.timeIntervalSince(refreshedAt) <= 4*3600,
              priority(now:now)<4 else { return [] }
        if provider == "reminders", let tasks=reminderTasks, !tasks.isEmpty {
            let overdue=tasks.filter { $0.dueAt.map { $0<=now } ?? false }
            let undated=tasks.filter { $0.dueAt == nil }
            if !overdue.isEmpty { return [groupedMessage(overdue,overdue:true)] }
            if !undated.isEmpty { return [groupedMessage(undated,overdue:false)] }
        }
        let clean=title.replacingOccurrences(of:"\n",with:" ").trimmingCharacters(in:.whitespacesAndNewlines)
        let named = !clean.isEmpty && clean.count<=48 && !clean.contains("\"")
        if provider == "calendar" {
            guard let dueAt else { return [] }
            let time = dueAt.formatted(date: .omitted, time: .shortened)
            let message = "At \(time): “\(clean)”. Would you like time to prepare?"
            return [named && message.count <= 110 ? message : "Your next calendar event is at \(time). Would you like time to prepare?"]
        }
        if let dueAt {
            if dueAt <= now {
                return [named ? "Past due: “\(clean)”. Could you make a start?" : "A reminder is past due. Could you take one small step?"]
            }
            let formatter=DateFormatter();formatter.dateStyle = .none;formatter.timeStyle = .short
            let message=named ? "Due at \(formatter.string(from:dueAt)): “\(clean)”. Take one small step?" : "A reminder is due soon. Would you like to take one small step?"
            return [message.count<=110 ? message : "A reminder is due soon. Would you like to take one small step?"]
        }
        return [named ? "On your list: “\(clean)”. Could you make a start?" : "You have an unfinished reminder. Would you like to take one small step?"]
    }
}
enum LocalProductivityNudgeStore {
    static let key="disconnect.localProductivityNudge.v1"
    static func save(_ values: [LocalProductivityNudge]) {
        let defaults = ShieldPresentationStore.defaults
        if values.isEmpty { defaults.removeObject(forKey: key) }
        else { defaults.set(try? JSONEncoder().encode(values), forKey: key) }
    }

    static func messages(now: Date = Date()) -> [String] {
        guard let data = ShieldPresentationStore.defaults.data(forKey: key) else { return [] }
        let decoder = JSONDecoder()
        if let values = try? decoder.decode([LocalProductivityNudge].self, from: data) {
            return values.flatMap { $0.messages(now: now) }
        }
        return (try? decoder.decode(LocalProductivityNudge.self, from: data))?.messages(now: now) ?? []
    }
}
