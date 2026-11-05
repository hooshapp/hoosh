import EventKit
import Foundation

@MainActor
final class AppleProductivityContextService: ObservableObject {
    @Published private(set) var snapshot = ProductivityContextStore.load()
    @Published private(set) var isRefreshing = false
    @Published private(set) var errorMessage: String?

    private let eventStore = EKEventStore()

    func refreshAuthorizationStatus() {
        snapshot.calendarAccess = accessState(for: EKEventStore.authorizationStatus(for: .event))
        snapshot.remindersAccess = accessState(for: EKEventStore.authorizationStatus(for: .reminder))
        ProductivityContextStore.save(snapshot)
        recordConnection(provider:"calendar",state:snapshot.calendarAccess)
        recordConnection(provider:"reminders",state:snapshot.remindersAccess)
        if snapshot.calendarAccess != .authorized && snapshot.remindersAccess != .authorized {
            LocalProductivityNudgeStore.save(nil)
        }
    }

    private func recordConnection(provider:String,state:ProductivityContextSnapshot.AccessState) {
        let key="disconnect.connectionStatus."+provider
        let defaults=ShieldPresentationStore.defaults
        guard defaults.string(forKey:key) != state.rawValue else { return }
        defaults.set(state.rawValue,forKey:key)
        NativeResearchQueue.enqueue("productivity_connection_status",properties:["provider":provider,"status":state.rawValue])
    }

    func requestCalendarAccess() async {
        NativeResearchQueue.enqueue("productivity_connection_requested",properties:["provider":"calendar"])
        do {
            let granted: Bool
            if #available(iOS 17.0, *) {
                granted = try await eventStore.requestFullAccessToEvents()
            } else {
                granted = try await eventStore.requestAccess(to: .event)
            }

            snapshot.calendarAccess = granted ? .authorized : .denied
            ProductivityContextStore.save(snapshot)
            NativeResearchQueue.enqueue("productivity_permission_result",properties:["provider":"calendar","granted":String(granted)])
            await refreshContext()
        } catch {
            NativeResearchQueue.enqueue("productivity_permission_error",properties:["provider":"calendar"])
            errorMessage = error.localizedDescription
            snapshot.calendarAccess = .denied
            ProductivityContextStore.save(snapshot)
            recordConnection(provider:"calendar",state:.denied)
            LocalProductivityNudgeStore.save(nil)
            try? await DatabaseService.shared.saveEnrollment()
        }
    }

    func requestReminderAccess() async {
        NativeResearchQueue.enqueue("productivity_connection_requested",properties:["provider":"reminders"])
        do {
            let granted: Bool
            if #available(iOS 17.0, *) {
                granted = try await eventStore.requestFullAccessToReminders()
            } else {
                granted = try await eventStore.requestAccess(to: .reminder)
            }

            snapshot.remindersAccess = granted ? .authorized : .denied
            ProductivityContextStore.save(snapshot)
            NativeResearchQueue.enqueue("productivity_permission_result",properties:["provider":"reminders","granted":String(granted)])
            await refreshContext()
        } catch {
            NativeResearchQueue.enqueue("productivity_permission_error",properties:["provider":"reminders"])
            errorMessage = error.localizedDescription
            snapshot.remindersAccess = .denied
            ProductivityContextStore.save(snapshot)
            recordConnection(provider:"reminders",state:.denied)
            LocalProductivityNudgeStore.save(nil)
            try? await DatabaseService.shared.saveEnrollment()
        }
    }

    func refreshContext() async {
        refreshAuthorizationStatus()
        isRefreshing = true
        errorMessage = nil
        defer { isRefreshing = false }

        let calendarItem = snapshot.calendarAccess == .authorized ? nextCalendarEvent() : nil
        let reminderItem = snapshot.remindersAccess == .authorized ? await nextReminder() : nil

        snapshot.nextCalendarTitle = calendarItem?.title ?? ""
        snapshot.nextCalendarDate = calendarItem?.date
        snapshot.nextReminderTitle = reminderItem?.title ?? ""
        snapshot.nextReminderDate = reminderItem?.date
        let priorityItem = priorityItem(calendarItem: calendarItem, reminderItem: reminderItem)
        snapshot.actionLine = actionLine(for: priorityItem, calendarItem: calendarItem, reminderItem: reminderItem)
        snapshot.contextKind = priorityItem?.kind.label ?? ""
        snapshot.contextTitle = priorityItem?.title ?? ""
        snapshot.lastUpdated = Date()
        ProductivityContextStore.save(snapshot)
        if let item=priorityItem {
            LocalProductivityNudgeStore.save(LocalProductivityNudge(provider:item.kind == .calendar ? "calendar" : "reminders",
                title:item.title,dueAt:item.date,refreshedAt:Date(),reminderTasks:item.reminderTasks))
        } else { LocalProductivityNudgeStore.save(nil) }
        // Refresh presentation immediately; extensions can then use the local context offline.
        try? PerAppProtection.reconcileShields()
        try? await DatabaseService.shared.saveEnrollment()
        await AIService().refreshCachedNudgePack(responses: OnboardingResponseStore.load(), context: snapshot)

        DatabaseService.shared.logEvent(
            "productivity_context_refreshed",
            properties: [
                "has_calendar_item": calendarItem != nil,
                "has_reminder_item": reminderItem != nil
            ]
        )
    }

    private func nextCalendarEvent() -> ProductivityItem? {
        let now = Date()
        let end = Calendar.current.date(byAdding: .hour, value: 36, to: now) ?? now.addingTimeInterval(36 * 60 * 60)
        let predicate = eventStore.predicateForEvents(withStart: now, end: end, calendars: nil)

        return eventStore.events(matching: predicate)
            .filter { !$0.isAllDay && $0.startDate > now }
            .sorted { $0.startDate < $1.startDate }
            .first
            .map { ProductivityItem(title: cleanTitle($0.title), date: $0.startDate, kind: .calendar) }
    }

    private func nextReminder() async -> ProductivityItem? {
        let predicate = eventStore.predicateForIncompleteReminders(withDueDateStarting: nil, ending: nil, calendars: nil)

        return await withCheckedContinuation { continuation in
            eventStore.fetchReminders(matching: predicate) { reminders in
                let tasks=(reminders ?? []).map { reminder in
                    LocalReminderTask(title:self.cleanTitle(reminder.title),dueAt:LocalProductivityNudge.reminderDueDate(reminder.dueDateComponents))
                }
                let selected=LocalProductivityNudge.selectReminders(tasks,now:Date())
                let next=selected.map { ProductivityItem(title:$0.title,date:$0.dueAt,kind:.reminder,reminderTasks:$0.reminderTasks) }

                continuation.resume(returning: next)
            }
        }
    }

    private func priorityItem(calendarItem: ProductivityItem?, reminderItem: ProductivityItem?) -> ProductivityItem? {
        let now=Date()
        return [calendarItem,reminderItem].compactMap { $0 }.min {
            LocalProductivityNudge(provider:$0.kind == .calendar ? "calendar" : "reminders",title:$0.title,dueAt:$0.date,refreshedAt:now).priority(now:now) <
            LocalProductivityNudge(provider:$1.kind == .calendar ? "calendar" : "reminders",title:$1.title,dueAt:$1.date,refreshedAt:now).priority(now:now)
        }
    }

    private func actionLine(for priorityItem: ProductivityItem?, calendarItem: ProductivityItem?, reminderItem: ProductivityItem?) -> String {
        guard let priorityItem else { return "" }

        switch priorityItem.kind {
        case .reminder:
            if priorityItem.date.map({$0 <= nextFewHours}) ?? true {
                return "start \(priorityItem.title)"
            }
            return "make progress on \(priorityItem.title)"
        case .calendar:
            if priorityItem.date.map({$0 <= nextFewHours}) ?? true {
                return "prepare for \(priorityItem.title)"
            }
            return "prep one thing for \(priorityItem.title)"
        }
    }

    private var nextFewHours: Date {
        Date().addingTimeInterval(4 * 60 * 60)
    }

    private func accessState(for status: EKAuthorizationStatus) -> ProductivityContextSnapshot.AccessState {
        switch status {
        case .notDetermined:
            return .notDetermined
        case .restricted:
            return .restricted
        case .denied:
            return .denied
        case .authorized:
            return .authorized
        case .writeOnly:
            return .partial
        case .fullAccess:
            return .authorized
        @unknown default:
            return .unknown
        }
    }

    private func cleanTitle(_ title: String?) -> String {
        let cleaned = (title ?? "")
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return cleaned
    }
}

private struct ProductivityItem {
    enum Kind {
        case calendar
        case reminder

        var label: String {
            switch self {
            case .calendar:
                return "calendar"
            case .reminder:
                return "reminder"
            }
        }
    }

    let title: String
    let date: Date?
    let kind: Kind
    var reminderTasks:[LocalReminderTask]? = nil
}
