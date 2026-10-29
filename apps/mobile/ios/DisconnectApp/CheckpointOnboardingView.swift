//
//  CheckpointOnboardingView.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/24/26.
//

import SwiftUI

struct CheckpointOnboardingView: View {
    var onComplete: (IdentityCheckpoint) -> Void
    
    var body: some View {
        VStack {
            Text("Set up your Checkpoint")
                .font(.title)
            // Your logic for creating the checkpoint goes here
            Button("Create Checkpoint") {
                // Example placeholder checkpoint
                let new = IdentityCheckpoint(question: "What is my goal?", fullAnswer: "To code", keywords: ["code"], categoryHint: "Professional", firstLetterHint: "T", partialHint: "T... c...")
                onComplete(new)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
