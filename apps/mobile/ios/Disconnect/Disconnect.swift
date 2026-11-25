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
        HooshUsageComparison(context: .init("Hoosh Usage Week"), days: 7) {
            UsageComparisonView(comparison: $0, compact: false, days: 7)
        }
        HooshUsageComparison(context: .init("Hoosh Usage Month"), days: 28) {
            UsageComparisonView(comparison: $0, compact: false, days: 28)
        }
    }
}
