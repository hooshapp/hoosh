//
//  TotalActivityView.swift
//  Disconnect
//
//  Created by Anisha Dasgupta on 6/15/26.
//

import SwiftUI

struct TotalActivityView: View {
    let totalActivity: String
    
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text(totalActivity)
                .font(.system(size: 30, weight: .heavy))
                .foregroundStyle(Color.black)

            Text("used")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(Color.black.opacity(0.62))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .colorScheme(.light)
    }
}

// In order to support previews for your extension's custom views, make sure its source files are
// members of your app's Xcode target as well as members of your extension's target. You can use
// Xcode's File Inspector to modify a file's Target Membership.
#Preview {
    TotalActivityView(totalActivity: "1h 23m")
}
