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
    }

    func requestCalendarAccess() async {
        do {
            let granted: Bool
            if #available(iOS 17.0, *) {
                granted = try await eventStore.requestFullAccessToEvents()
            } else {
                granted = try await eventStore.requestAccess(to: .event)
            }

            snapshot.calendarAccess = granted ? .authorized : .denied
            ProductivityContextStore.save(snapshot)
            DatabaseService.shared.logEvent("calendar_permission_result", properties: ["granted": granted])
            await refreshContext()
        } catch {
            errorMessage = error.localizedDescription
            snapshot.calendarAccess = .denied
            ProductivityContextStore.save(snapshot)
        }
    }

    func requestReminderAccess() async {
        do {
            let granted: Bool
            if #available(iOS 17.0, *) {
                granted = try await eventStore.requestFullAccessToReminders()
            } else {
                granted = try await eventStore.requestAccess(to: .reminder)
            }

            snapshot.remindersAccess = granted ? .authorized : .denied
            ProductivityContextStore.save(snapshot)
            DatabaseService.shared.logEvent("reminders_permission_result", properties: ["granted": granted])
            await refreshContext()
        } catch {
            errorMessage = error.localizedDescription
            snapshot.remindersAccess = .denied
            ProductivityContextStore.save(snapshot)
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
            .filter { $0.endDate >= now || ($0.isAllDay && $0.endDate >= Calendar.current.startOfDay(for: now)) }
            .sorted { $0.startDate < $1.startDate }
            .first
            .map { ProductivityItem(title: cleanTitle($0.title), date: $0.startDate, kind: .calendar) }
    }

    private func nextReminder() async -> ProductivityItem? {
        let predicate = eventStore.predicateForIncompleteReminders(withDueDateStarting: nil, ending: nil, calendars: nil)

        return await withCheckedContinuation { continuation in
            eventStore.fetchReminders(matching: predicate) { reminders in
                let next = reminders?
                    .compactMap { reminder -> ProductivityItem? in
                        let dueDate = reminder.dueDateComponents?.date ?? Date.distantFuture
                        return ProductivityItem(title: self.cleanTitle(reminder.title), date: dueDate, kind: .reminder)
                    }
                    .filter { !$0.title.isEmpty }
                    .sorted { $0.date < $1.date }
                    .first

                continuation.resume(returning: next)
            }
        }
    }

    private func priorityItem(calendarItem: ProductivityItem?, reminderItem: ProductivityItem?) -> ProductivityItem? {
        if let reminderItem, reminderItem.date <= nextFewHours {
            return reminderItem
        }

        if let calendarItem, calendarItem.date <= nextFewHours {
            return calendarItem
        }

        return reminderItem ?? calendarItem
    }

    private func actionLine(for priorityItem: ProductivityItem?, calendarItem: ProductivityItem?, reminderItem: ProductivityItem?) -> String {
        guard let priorityItem else { return "" }

        switch priorityItem.kind {
        case .reminder:
            if priorityItem.date <= nextFewHours {
                return "start \(priorityItem.title)"
            }
            return "make progress on \(priorityItem.title)"
        case .calendar:
            if priorityItem.date <= nextFewHours {
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
        return String(cleaned.prefix(48))
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
    let date: Date
    let kind: Kind
}
