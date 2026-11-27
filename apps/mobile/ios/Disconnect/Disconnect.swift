//
//  Disconnect.swift
//  Disconnect
//
//  Created by Anisha Dasgupta on 6/15/26.
//

import DeviceActivity
import ExtensionKit
import SwiftUI

@main
struct Disconnect: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Create a report for each DeviceActivityReport.Context that your app supports.
        TotalActivityReport { totalActivity in
            TotalActivityView(totalActivity: totalActivity)
        }
        HooshUsageComparison(context: .init("Hoosh Usage Compact"), days: 7) {
            UsageComparisonView(comparison: $0, compact: true, days: 7)
        }
        HooshUsageComparison(context: .init("Hoosh History summary 7"), days: 7) {
            UsageComparisonView(comparison: $0, compact: false, days: 7, page: .summary)
        }
        HooshUsageComparison(context: .init("Hoosh History summary 28"), days: 28) {
            UsageComparisonView(comparison: $0, compact: false, days: 28, page: .summary)
        }
        HooshUsageComparison(context: .init("Hoosh History progress 7"), days: 7) {
            UsageComparisonView(comparison: $0, compact: false, days: 7, page: .progress)
        }
        HooshUsageComparison(context: .init("Hoosh History progress 28"), days: 28) {
            UsageComparisonView(comparison: $0, compact: false, days: 28, page: .progress)
        }
        HooshUsageComparison(context: .init("Hoosh History reclaimed 7"), days: 7) {
            UsageComparisonView(comparison: $0, compact: false, days: 7, page: .reclaimed)
        }
        HooshUsageComparison(context: .init("Hoosh History reclaimed 28"), days: 28) {
            UsageComparisonView(comparison: $0, compact: false, days: 28, page: .reclaimed)
        }
    }
}
