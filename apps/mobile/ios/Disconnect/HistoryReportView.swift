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
            HStack(alignment: .top, spacing: 10) {
                metric("Before", value: HistoryUsageComparison.duration(summary.beforeSeconds))
                metric("Now", value: HistoryUsageComparison.duration(summary.afterSeconds))
            }
            if summary.beforeSeconds == nil {
                Text("A comparison needs Apple usage records for matching completed days in both periods.")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            }
            Divider()
            HStack(alignment: .top, spacing: 10) {
                metric("Time reclaimed", value: HistoryUsageComparison.duration(summary.freedSeconds))
                if let percent = summary.reductionPercent {
                    metric(percent < 0 ? "More screen time" : "Less screen time",
                           value: "\(Int(abs(percent).rounded()))%")
                }
            }
            if let circles = summary.freedCircles {
                HStack(spacing: 8) {
                    ForEach(0..<10, id: \.self) { index in
                        Circle().fill(index < circles ? DisconnectTheme.green : DisconnectTheme.border)
                            .frame(width: 16, height: 16)
                    }
                }
                .accessibilityHidden(true)
                Text("\(circles) of 10 filled · 10 percentage points per circle, rounded")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            } else if summary.beforeSeconds == 0 {
                Text("A zero baseline can’t produce a percentage change.")
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
    private func metric(_ title:String,value:String)->some View {
        VStack(alignment:.leading,spacing:5) {
            Text(title).font(.system(size:12,weight:.bold)).foregroundStyle(DisconnectTheme.mutedInk)
            Text(value).font(.system(size:value=="Not available" ? 16 : 24,weight:.heavy))
                .foregroundStyle(value=="Not available" ? DisconnectTheme.mutedInk : DisconnectTheme.green)
                .minimumScaleFactor(0.7).lineLimit(1)
        }.frame(maxWidth:.infinity,alignment:.leading)
    }
}
