import Foundation

struct DailySavedTime: Identifiable {
    let id = UUID()
    let label: String
    let minutes: Int
}

struct DashboardMetrics {
    let todaySavedMinutes: Int
    let yesterdaySavedMinutes: Int
    let currentWeekSavedMinutes: Int
    let previousWeekSavedMinutes: Int
    let weeklySavedTime: [DailySavedTime]
    let intentionalOpeningRate: Int
    let topAvoidedAppName: String
    let topAvoidedCount: Int
    let focusedCount: Int
    let openedAnywayCount: Int

    var totalInterventions: Int {
        focusedCount + openedAnywayCount
    }

    var todaySavedText: String {
        Self.durationText(minutes: todaySavedMinutes)
    }

    var yesterdayDeltaText: String {
        let delta = todaySavedMinutes - yesterdaySavedMinutes
        if delta == 0 {
            return "No change vs yesterday"
        }

        let sign = delta > 0 ? "+" : "-"
        return "~ \(sign)\(Self.durationText(minutes: abs(delta))) vs yesterday"
    }

    var reclaimedWakingHoursText: String {
        guard todaySavedMinutes > 0 else {
            return "No saved time recorded yet today."
        }

        let wakingMinutes = 16 * 60
        let percentage = Int((Double(todaySavedMinutes) / Double(wakingMinutes) * 100).rounded())
        return "That's roughly \(percentage)% of your waking hours protected by Disconnect."
    }

    var weeklyMomentumText: String {
        if currentWeekSavedMinutes == 0 {
            return "Use a protected app and choose focus to start building real stats."
        }

        let delta = currentWeekSavedMinutes - previousWeekSavedMinutes
        if previousWeekSavedMinutes == 0 {
            return "You've protected \(Self.durationText(minutes: currentWeekSavedMinutes)) this week."
        }

        let direction = delta >= 0 ? "more" : "less"
        return "You've saved \(Self.durationText(minutes: abs(delta))) \(direction) than the previous 7 days."
    }

    static func load(now: Date = Date()) -> DashboardMetrics {
        let events = InterventionHistoryStore.load(limit: 500)
        let calendar = Calendar.current
        let todayStart = calendar.startOfDay(for: now)
        let yesterdayStart = calendar.date(byAdding: .day, value: -1, to: todayStart) ?? todayStart
        let tomorrowStart = calendar.date(byAdding: .day, value: 1, to: todayStart) ?? now
        let currentWeekStart = calendar.date(byAdding: .day, value: -6, to: todayStart) ?? todayStart
        let previousWeekStart = calendar.date(byAdding: .day, value: -13, to: todayStart) ?? todayStart

        let focusedEvents = events.filter { $0.decision == .stayedFocused }
        let todaySaved = focusedEvents.savedMinutes(from: todayStart, to: tomorrowStart)
        let yesterdaySaved = focusedEvents.savedMinutes(from: yesterdayStart, to: todayStart)
        let currentWeekSaved = focusedEvents.savedMinutes(from: currentWeekStart, to: tomorrowStart)
        let previousWeekSaved = focusedEvents.savedMinutes(from: previousWeekStart, to: currentWeekStart)

        let weekly = (0..<7).compactMap { offset -> DailySavedTime? in
            guard let day = calendar.date(byAdding: .day, value: offset, to: currentWeekStart),
                  let nextDay = calendar.date(byAdding: .day, value: 1, to: day) else {
                return nil
            }

            let label = day.formatted(.dateTime.weekday(.abbreviated))
            return DailySavedTime(label: label, minutes: focusedEvents.savedMinutes(from: day, to: nextDay))
        }

        let totalEvents = events.count
        let focusedCount = focusedEvents.count
        let openedAnywayCount = events.filter { $0.decision == .openedAnyway }.count
        let focusRate = totalEvents == 0 ? 0 : Int((Double(focusedCount) / Double(totalEvents) * 100).rounded())
        let topAvoided = Self.topAvoidedApp(from: focusedEvents)

        return DashboardMetrics(
            todaySavedMinutes: todaySaved,
            yesterdaySavedMinutes: yesterdaySaved,
            currentWeekSavedMinutes: currentWeekSaved,
            previousWeekSavedMinutes: previousWeekSaved,
            weeklySavedTime: weekly,
            intentionalOpeningRate: focusRate,
            topAvoidedAppName: topAvoided.name,
            topAvoidedCount: topAvoided.count,
            focusedCount: focusedCount,
            openedAnywayCount: openedAnywayCount
        )
    }

    static func durationText(minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes)m"
        }

        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        return remainingMinutes == 0 ? "\(hours)h" : "\(hours)h \(remainingMinutes)m"
    }

    private static func topAvoidedApp(from events: [InterventionHistoryEvent]) -> (name: String, count: Int) {
        let counts = Dictionary(grouping: events, by: \.appName).mapValues(\.count)
        guard let top = counts.max(by: { $0.value < $1.value }) else {
            return ("None yet", 0)
        }

        return (top.key, top.value)
    }
}

private extension Array where Element == InterventionHistoryEvent {
    func savedMinutes(from startDate: Date, to endDate: Date) -> Int {
        filter { event in
            event.date >= startDate && event.date < endDate
        }
        .reduce(0) { total, event in
            total + event.savedMinutes
        }
    }
}
