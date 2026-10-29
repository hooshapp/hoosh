//
//  TestDashboardView.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/22/26.
//

import SwiftUI

struct TestDashboardView: View {
    @State private var nudgeResult = "Waiting for AI..."
    let aiService = AIService()
    
    // Create a mock user
    let testUser = User(email: "test@test.com", goal: "Finish my thesis", genre: "Arts", tone: "Harsh")
    
    var body: some View {
        VStack(spacing: 20) {
            Text("AI Service Tester")
                .font(.title)
            
            Text(nudgeResult)
                .padding()
                .multilineTextAlignment(.center)
            
            Button("Test 'Harsh' Nudge") {
                Task {
                    // We feed it 150 minutes to trigger the "Harsh" message
                    nudgeResult = await aiService.generateNudge(for: testUser, screenTimeData: 150)
                }
            }
            .buttonStyle(.borderedProminent)
        }
    }
}
