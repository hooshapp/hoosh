import Foundation

enum HistoryPeriod:String,CaseIterable,Codable {
    case week,month
    var reportContext: String { "disconnect.history.\(rawValue).summary" }
    var title:String { self == .week ? "This week" : "This month" }
    var previousTitle:String { self == .week ? "Previous week" : "Previous month" }
    func window(now:Date,calendar:Calendar = .current) -> HistoryComparisonWindow {
        let component:Calendar.Component = self == .week ? .weekOfYear : .month
        let current=calendar.dateInterval(of:component,for:now)!
        let previous=calendar.dateInterval(of:component,for:current.start.addingTimeInterval(-1))!
        let today=calendar.startOfDay(for:now)
        let elapsed=calendar.dateComponents([.day],from:current.start,to:today).day ?? 0
        let previousDays=calendar.dateComponents([.day],from:previous.start,to:previous.end).day ?? 0
        return HistoryComparisonWindow(currentStart:current.start,previousStart:previous.start,
            comparisonDays:max(0,min(elapsed,previousDays)),now:now)
    }
}
struct HistoryComparisonWindow {
    var currentStart:Date
    var previousStart:Date
    var comparisonDays:Int
    var now:Date
}
struct HistoryTurnOff:Codable,Identifiable {
    var id:UUID
    var date:Date
    var sessionID:String?
    static func count(_ events:[Self],period:HistoryPeriod,now:Date,calendar:Calendar = .current) -> Int {
        let window=period.window(now:now,calendar:calendar)
        var ids=Set<UUID>(),sessions=Set<String>()
        return events.filter { event in
            guard event.date>=window.currentStart,event.date<=now,ids.insert(event.id).inserted else { return false }
            if let session=event.sessionID { return sessions.insert(session).inserted }
            return true
        }.count
    }
}
