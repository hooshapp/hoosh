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
    enum Page { case summary, progress, reclaimed }
    var page: Page = .summary
    private let ink = Color(red: 0.23, green: 0.15, blue: 0)
    private let green = Color(red: 0.04, green: 0.60, blue: 0.40)
    private let cream = Color(red: 1, green: 0.945, blue: 0.867)

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 6 : 14) {
            if compact {
                Text(comparison.reduction.map { hours(abs($0)) } ?? "—")
                    .font(.title2.bold()).foregroundStyle(cream)
                Text(comparison.reduction.map { $0 == 0 ? "No change" : $0 > 0 ? "Less time · last 7 days" : "More time · last 7 days" }
                    ?? "No measured comparison yet")
            } else {
                report
                if page == .summary, let yesterday = comparison.yesterday {
                    Text("Yesterday · \(hours(yesterday))").font(.caption)
                }
            }
        }
        .font(compact ? .caption : .subheadline)
        .foregroundStyle(ink)
        .padding(.vertical, compact ? 0 : 8)
        .fixedSize(horizontal: false, vertical: true)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: compact ? .leading : .topLeading)
    }

    @ViewBuilder private var report: some View {
        let recent = comparison.recent
        let previous = comparison.previous
        let change = comparison.reduction
        let percent = previous.flatMap { baseline in change.flatMap { baseline > 0 ? $0 / baseline : nil } }
        switch page {
        case .summary:
            HStack(alignment: .center, spacing: 12) {
                comparisonValue("BEFORE", duration: previous, caption: "Previous \(days) days", color: ink.opacity(0.7))
                Image(systemName: "arrow.right").foregroundStyle(green).accessibilityHidden(true)
                comparisonValue("NOW", duration: recent, caption: "Last \(days) days", color: green)
            }
            Divider()
            Text(change.map { hours(abs($0)) } ?? "—").font(.system(size: 40, weight: .bold)).foregroundStyle(green)
            Text(change.map { $0 >= 0 ? "Time saved · last \(days) days" : "Additional use · last \(days) days" }
                ?? "No measured comparison yet")
        case .progress:
            Divider()
            if let previous, let recent {
                Text("Screen time went from \(hours(previous)) to \(hours(recent)) over two \(days)-day periods.")
            } else {
                Text("Your progress will appear when there are enough comparable Screen Time days.")
            }
            Divider()
            Text(percent.map { $0 >= 0 ? "LESS SCREEN TIME" : "MORE SCREEN TIME" } ?? "SCREEN TIME CHANGE").font(.caption.bold())
            Text(percent.map { abs($0).formatted(.percent.precision(.fractionLength(0))) } ?? "—")
                .font(.system(size: 58, weight: .bold)).foregroundStyle(green)
            Text("Compared with the previous \(days) days").font(.caption)
        case .reclaimed:
            let filled = min(10, max(0, Int((percent ?? 0) * 10)))
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 5), spacing: 10) {
                ForEach(0..<10) { index in
                    Circle().fill(index < filled ? green : ink.opacity(0.12)).aspectRatio(1, contentMode: .fit)
                }
            }
            .accessibilityLabel(percent == nil ? "No measured reduction yet" : "\(filled) of 10 circles filled")
            Text(percent == nil ? "No measured comparison yet" : "\(filled) of 10 · time freed").font(.caption)
            Divider()
            Text("LOOK AHEAD · NEXT YEAR").font(.caption.bold())
            Text(change.flatMap { $0 > 0 ? hours($0 / Double(days) * 365) : nil } ?? "—")
                .font(.system(size: 32, weight: .bold)).foregroundStyle(green)
            Text("Illustrative · Assumes the same pace").font(.caption)
        }
    }

    private func comparisonValue(_ label: String, duration: TimeInterval?, caption: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label).font(.caption2.bold())
            Text(duration.map(hours) ?? "—").font(.title2.bold()).foregroundStyle(color)
            Text(caption).font(.caption)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }

    private func hours(_ seconds: TimeInterval) -> String {
        let minutes = Int((seconds / 60).rounded())
        return minutes >= 60 ? "\(minutes / 60) h \(minutes % 60) m" : "\(minutes) min"
    }
}
