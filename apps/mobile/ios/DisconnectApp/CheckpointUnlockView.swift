//
//  CheckpointUnlockView.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/24/26.
//

import SwiftUI

struct CheckpointUnlockView: View {
    let checkpoint: IdentityCheckpoint
    @State private var answer = ""
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 52)

            VStack(spacing: 28) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 34, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 70, height: 70)
                    .background(Circle().fill(DisconnectTheme.green.opacity(0.13)))

                VStack(spacing: 26) {
                    Text(checkpoint.question.isEmpty ? "Didn't you wanna do 10\npushups today?" : checkpoint.question)
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)

                    Text("Take a second to remember why you set\nthis goal.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                }
            }

            VStack(alignment: .leading, spacing: 14) {
                Text("YOUR COMMITMENT")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.mutedInk)

                TextField("Why did you open this app?", text: $answer)
                    .font(.system(size: 16, weight: .medium))
                    .padding(.horizontal, 16)
                    .frame(height: 54)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
                    .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)

                HStack(alignment: .top, spacing: 12) {
                    Circle()
                        .fill(DisconnectTheme.green)
                        .frame(width: 8, height: 8)
                        .padding(.top, 7)

                    (Text("Fact: ").fontWeight(.heavy)
                        + Text("Taking 5 deep breaths increases your\nself-control by up to 40%. You're stronger\nthan an algorithm."))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(DisconnectTheme.ink)
                        .lineSpacing(5)
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 15).fill(DisconnectTheme.green.opacity(0.04)))
                .overlay(RoundedRectangle(cornerRadius: 15).stroke(DisconnectTheme.green.opacity(0.18), lineWidth: 1))
                .padding(.top, 30)
            }
            .padding(.horizontal, 30)
            .padding(.top, 36)

            Spacer()

            VStack(spacing: 22) {
                Button {
                } label: {
                    Label("Close App & Stay Focused", systemImage: "xmark.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())

                Button {
                } label: {
                    HStack(spacing: 8) {
                        Text("Open anyway")
                        Image(systemName: "arrow.right")
                    }
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(DisconnectTheme.subtleInk)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 30)
            .padding(.bottom, 44)
        }
        .background(
            LinearGradient(
                colors: [Color.white, DisconnectTheme.green.opacity(0.05), Color(red: 0.94, green: 0.97, blue: 1.0)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
        )
    }
}

#Preview {
    CheckpointUnlockView(
        checkpoint: IdentityCheckpoint(
            question: "Didn't you wanna do 10\npushups today?",
            fullAnswer: "",
            keywords: [],
            categoryHint: "",
            firstLetterHint: "",
            partialHint: ""
        )
    )
}
