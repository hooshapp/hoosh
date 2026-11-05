//
//  Disconnect.swift
//  Disconnect
//
//  Created by Anisha Dasgupta on 6/15/26.
//

import DeviceActivity
import SwiftUI

@main
struct Disconnect: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Create a report for each DeviceActivityReport.Context that your app supports.
        TotalActivityReport { totalActivity in
            TotalActivityView(totalActivity: totalActivity)
        }
        HistoryActivityReport(period: .week) { HistoryReportView(summary: $0, period: .week) }
        HistoryActivityReport(period: .month) { HistoryReportView(summary: $0, period: .month) }
    }
}
