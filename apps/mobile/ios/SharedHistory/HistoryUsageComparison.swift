import Foundation

/// These values are calculated/rendered INSIDE DeviceActivityReport, never exported.
struct HistoryUsageDay {
    var date:Date
    var seconds:TimeInterval
}
struct HistoryUsageComparison {
    static let minimumComparableDays = 3
    var currentSeconds:TimeInterval?
    var beforeSeconds:TimeInterval?
    var afterSeconds:TimeInterval?
    var comparedDays:Int
    var previousDates: ClosedRange<Date>?
    var currentDates: ClosedRange<Date>?
    var requiredDays:Int
    var reportedCurrentDays:Int
    var reductionPercent:Double? {
        guard let beforeSeconds,let afterSeconds,beforeSeconds>0 else { return nil }
        return (beforeSeconds-afterSeconds)/beforeSeconds*100
    }
    var freedSeconds:TimeInterval? {
        guard let beforeSeconds,let afterSeconds else { return nil }
        return max(0,beforeSeconds-afterSeconds)
    }
    var freedCircles:Int? {
        reductionPercent.map { Int((min(100,max(0,$0))/10).rounded()) }
    }
    init(days:[HistoryUsageDay],period:HistoryPeriod,now:Date,calendar:Calendar = .current) {
        let window=period.window(now:now,calendar:calendar)
        var totals:[Date:Double]=[:]
        for day in days where day.seconds.isFinite && day.seconds>=0 && day.date<=now {
            totals[calendar.startOfDay(for:day.date),default:0] += day.seconds
        }
        let current=totals.filter { $0.key>=window.currentStart && $0.key<=now }
        currentSeconds=current.isEmpty ? nil : current.values.reduce(0,+)
        reportedCurrentDays=current.count
        requiredDays=window.comparisonDays
        var before=0.0,after=0.0,count=0
        for offset in 0..<window.comparisonDays {
            let old=calendar.date(byAdding:.day,value:offset,to:window.previousStart)!
            let new=calendar.date(byAdding:.day,value:offset,to:window.currentStart)!
            if let b=totals[old],let a=totals[new] { before+=b;after+=a;count+=1 }
        }
        comparedDays=count
        // A short or incomplete comparison can give a misleading change.
        if count >= Self.minimumComparableDays && count == window.comparisonDays {
            beforeSeconds = before.rounded()
            afterSeconds = after.rounded()
            let offset = count - 1
            if let previousEnd = calendar.date(byAdding: .day, value: offset, to: window.previousStart),
               let currentEnd = calendar.date(byAdding: .day, value: offset, to: window.currentStart) {
                previousDates = window.previousStart...previousEnd
                currentDates = window.currentStart...currentEnd
            }
        } else { beforeSeconds=nil;afterSeconds=nil }
    }
    static func duration(_ seconds:TimeInterval?) -> String {
        guard let seconds,seconds.isFinite,seconds>=0 else { return "Not available" }
        let total = Int(seconds.rounded())
        let hours = total / 3600
        let minutes = total / 60 % 60
        let remainder = total % 60
        if hours > 0 { return "\(hours)h \(minutes)m \(remainder)s" }
        if minutes > 0 { return "\(minutes)m \(remainder)s" }
        return "\(remainder)s"
    }
}
