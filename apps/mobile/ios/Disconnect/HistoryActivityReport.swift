import DeviceActivity
import SwiftUI

struct HistoryActivityReport:DeviceActivityReportScene {
    let period:HistoryPeriod
    var context:DeviceActivityReport.Context { .init(period.reportContext) }
    let content:(HistoryUsageComparison)->HistoryReportView
    func makeConfiguration(representing data:DeviceActivityResults<DeviceActivityData>) async -> HistoryUsageComparison {
        var days:[HistoryUsageDay]=[]
        for await device in data {
            for await segment in device.activitySegments {
                var seconds: TimeInterval?
                // Sum the applications returned by the selected-app filter, not
                // the segment's potentially broader device-activity total.
                for await category in segment.categories {
                    for await application in category.applications {
                        let duration = application.totalActivityDuration
                        guard duration.isFinite, duration >= 0 else { continue }
                        seconds = (seconds ?? 0) + duration
                    }
                }
                if let seconds {
                    days.append(HistoryUsageDay(date: segment.dateInterval.start, seconds: seconds))
                }
            }
        }
        return HistoryUsageComparison(days:days,period:period,now:Date())
    }
}
