import SwiftUI

struct HistoryReportView:View {
    let summary:HistoryUsageComparison
    let period:HistoryPeriod
    var body:some View {
        VStack(alignment:.leading,spacing:10) {
            metric("Selected-app time so far", value: HistoryUsageComparison.duration(summary.currentSeconds))
            Text("\(period.title) · Apple-reported usage")
                .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            Divider()
            if let previous = summary.beforeSeconds, let current = summary.afterSeconds {
                HStack(alignment: .top, spacing: 10) {
                    metric(period.previousTitle, value: HistoryUsageComparison.duration(previous))
                    metric(period.title, value: HistoryUsageComparison.duration(current))
                }
                Text("Matching completed days in each period. Today is excluded.")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
                Divider()
                if current > previous {
                    metric("More selected-app time", value: HistoryUsageComparison.duration(current - previous), highlight: false)
                } else if current < previous, let percent = summary.reductionPercent, let circles = summary.freedCircles {
                    HStack(alignment: .top, spacing: 10) {
                        metric("Time reclaimed", value: HistoryUsageComparison.duration(summary.freedSeconds))
                        metric("Less selected-app time", value: "\(Int(percent.rounded()))%")
                    }
                    HStack(spacing: 8) {
                        ForEach(0..<10, id: \.self) { index in
                            Circle().fill(index < circles ? DisconnectTheme.green : DisconnectTheme.border)
                                .frame(width: 16, height: 16)
                        }
                    }
                    .accessibilityHidden(true)
                    Text("\(circles) of 10 filled · 10 percentage points per circle, rounded")
                        .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
                } else {
                    Text("Selected-app time was the same across these days.")
                        .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
                }
            } else {
                Text("Your trend will appear when Apple Screen Time has records for at least \(HistoryUsageComparison.minimumComparableDays) matching completed days in both periods.")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            }
            Text("Only selected apps are included. Usage stays on this device.")
                .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
        }
        .foregroundStyle(DisconnectTheme.ink)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.white)
        .environment(\.colorScheme, .light)
    }
    private func metric(_ title:String,value:String,highlight:Bool = true)->some View {
        VStack(alignment:.leading,spacing:5) {
            Text(title).font(.system(size:12,weight:.bold)).foregroundStyle(DisconnectTheme.mutedInk)
            Text(value).font(.system(size:value=="Not available" ? 16 : 24,weight:.heavy))
                .foregroundStyle(value=="Not available" || !highlight ? DisconnectTheme.mutedInk : DisconnectTheme.green)
                .minimumScaleFactor(0.7).lineLimit(1)
        }.frame(maxWidth:.infinity,alignment:.leading)
    }
}
