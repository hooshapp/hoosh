//
//  TotalActivityReport.swift
//  Disconnect
//
//  Created by Anisha Dasgupta on 6/15/26.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
    // If your app initializes a DeviceActivityReport with this context, then the system will use
    // your extension's corresponding DeviceActivityReportScene to render the contents of the
    // report.
    static let totalActivity = Self("Total Activity")
}

struct TotalActivityReport: DeviceActivityReportScene {
    // Define which context your scene will represent.
    let context: DeviceActivityReport.Context = .totalActivity
    
    // Define the custom configuration and the resulting view for this report.
    let content: (String) -> TotalActivityView
    
    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> String {
        // Reformat the data into a configuration that can be used to create
        // the report's view.
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.day, .hour, .minute, .second]
        formatter.unitsStyle = .abbreviated
        formatter.zeroFormattingBehavior = .dropAll
        
        let totalActivityDuration = await data.flatMap { $0.activitySegments }.reduce(0, {
            $0 + $1.totalActivityDuration
        })
        return formatter.string(from: totalActivityDuration) ?? "No activity data"
    }
}

/// All usage results and arithmetic stay in Apple's report extension.
struct HooshUsageComparison: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context
    let days: Int
    let content: (UsageComparison) -> UsageComparisonView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> UsageComparison {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        var totals: [Date: TimeInterval] = [:]
        var seenDevices = 0
        for await device in data {
            seenDevices += 1
            // Never add several devices together and label it as the phone's usage.
            guard seenDevices == 1 else { return UsageComparison() }
            for await segment in device.activitySegments {
                let day = calendar.startOfDay(for: segment.dateInterval.start)
                guard day < today, totals[day] == nil,
                    segment.dateInterval.start == day,
                    segment.dateInterval.end == calendar.date(byAdding: .day, value: 1, to: day)
                else { continue }
                var seconds: TimeInterval = 0
                for await category in segment.categories {
                    for await app in category.applications {
                        seconds += app.totalActivityDuration
                    }
                }
                guard seconds.isFinite, (0...segment.dateInterval.duration).contains(seconds) else { continue }
                totals[day] = seconds
            }
        }
        let closedDays = (1...(2 * days)).compactMap { offset in
            calendar.date(byAdding: .day, value: -offset, to: today).flatMap { totals[$0] }
        }
        return UsageComparison(yesterday: calendar.date(byAdding: .day, value: -1, to: today).flatMap { totals[$0] },
            recent: closedDays.count == 2 * days ? closedDays.prefix(days).reduce(0, +) : nil,
            previous: closedDays.count == 2 * days ? closedDays.suffix(days).reduce(0, +) : nil)
    }
}

struct UsageComparison {
    var yesterday: TimeInterval?
    var recent: TimeInterval?
    var previous: TimeInterval?
    var reduction: TimeInterval? {
        guard let previous, let recent else { return nil }
        return previous - recent
    }
}

struct UsageComparisonView: View {
    let comparison: UsageComparison
    let compact: Bool
    let days: Int
    private let ink = Color(red: 0.043, green: 0.2, blue: 0.126)
    private let cream = Color(red: 1, green: 0.945, blue: 0.867)

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 6 : 9) {
            if let change = comparison.reduction {
                Text(hours(abs(change)))
                    .font(.system(compact ? .title2 : .title, design: .monospaced, weight: .bold))
                    .foregroundStyle(compact ? cream : ink)
                Text(change == 0 ? "No change" : change > 0 ? "Less time · last \(days) days" : "More time · last \(days) days")
                if !compact, let recent = comparison.recent, let previous = comparison.previous {
                    Text("\(hours(recent)) in the last \(days) days · \(hours(previous)) in the previous \(days)")
                    if previous > 0 {
                        Text("\(abs(change / previous).formatted(.percent.precision(.fractionLength(0)))) \(change >= 0 ? "less" : "more") screen time")
                    }
                }
            } else if compact {
                Text("—").font(.system(.title, weight: .bold)).foregroundStyle(cream)
                Text("No measured comparison yet")
            } else {
                Text("Collecting comparable Screen Time days")
            }
            if !compact, let yesterday = comparison.yesterday {
                Text("Yesterday · \(hours(yesterday))")
            }
        }
        .font(.system(compact ? .caption : .subheadline))
        .foregroundStyle(ink)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private func hours(_ seconds: TimeInterval) -> String {
        let minutes = Int((seconds / 60).rounded())
        return minutes >= 60 ? "\(minutes / 60) h \(minutes % 60) m" : "\(minutes) min"
    }
}
