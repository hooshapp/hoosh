import SwiftUI
import FamilyControls

struct AppSelectionView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var authorizationService = ScreenTimeAuthorizationService()

    @State private var selection = AppSelectionStore.load()
    @State private var isPickerPresented = false
    @State private var showDidYouKnow = false
    @State private var selectionPrompt: String?
    @State private var isContinuing = false

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "APP SELECTION", showsBackButton: true) {
                dismiss()
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 9) {
                        Text("Choose the apps\nyou want to block.")
                            .font(.system(size: 24, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.ink)
                            .lineSpacing(2)

                        Text("Pick specific apps, websites, or a whole category from Apple's Screen Time picker. Disconnect will protect exactly what you choose.")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(3)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Button {
                        Task {
                            await openFamilyActivityPicker()
                        }
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: "app.badge")
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundStyle(DisconnectTheme.green)
                                .frame(width: 42, height: 42)
                                .background(RoundedRectangle(cornerRadius: 10).fill(DisconnectTheme.green.opacity(0.1)))

                            VStack(alignment: .leading, spacing: 4) {
                                Text(protectedSelectionTitle)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(DisconnectTheme.ink)

                                Text("Select Instagram, TikTok, YouTube, X, Snapchat, games, or any category you want protected.")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(DisconnectTheme.mutedInk)
                                    .fixedSize(horizontal: false, vertical: true)
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(DisconnectTheme.mutedInk)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 15)
                                .fill(Color.white)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 15)
                                .stroke(DisconnectTheme.border, style: StrokeStyle(lineWidth: 1, dash: [2, 3]))
                        )
                    }
                    .buttonStyle(.plain)

                    if let selectionPrompt {
                        Text(selectionPrompt)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    if let errorMessage = authorizationService.errorMessage {
                        Text(errorMessage)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.red)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.horizontal, 26)
                .padding(.top, 26)
                .padding(.bottom, 20)
            }

            VStack(spacing: 12) {
                Button {
                    Task {
                        await continueAfterVerification()
                    }
                } label: {
                    Text(isContinuing ? "Checking Access..." : "Continue")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(isContinuing)

                Text("STEP 1 OF 6 - APP PROTECTION")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.3)
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }
            .padding(.horizontal, 26)
            .padding(.top, 16)
            .padding(.bottom, 18)
            .background(Color.white)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(DisconnectTheme.border)
                    .frame(height: 1)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .familyActivityPicker(
            isPresented: $isPickerPresented,
            selection: $selection
        )
        .navigationDestination(isPresented: $showDidYouKnow) {
            DidYouKnowView()
        }
        .onAppear {
            authorizationService.refreshStatus()
            selection = AppSelectionStore.load()
        }
    }

    private var protectedSelectionTitle: String {
        let total = selection.applicationTokens.count + selection.categoryTokens.count + selection.webDomainTokens.count
        return total == 0 ? "Choose apps to protect" : "\(total) protected item\(total == 1 ? "" : "s") selected"
    }

    @MainActor
    private func openFamilyActivityPicker() async {
        if !authorizationService.isApproved {
            await authorizationService.requestAuthorization()
        }

        if authorizationService.isApproved {
            isPickerPresented = true
            selectionPrompt = "Choose specific apps, websites, or full categories. Categories like Social or Games will be protected too."
        }
    }

    @MainActor
    private func continueAfterVerification() async {
        isContinuing = true
        defer { isContinuing = false }

        if !authorizationService.isApproved {
            await authorizationService.requestAuthorization()
        }

        guard authorizationService.isApproved else {
            selectionPrompt = "Screen Time access is required before Disconnect can protect apps."
            return
        }

        guard !selection.applicationTokens.isEmpty || !selection.categoryTokens.isEmpty || !selection.webDomainTokens.isEmpty else {
            isPickerPresented = true
            selectionPrompt = "Choose at least one app, website, or category from Apple's picker so Disconnect has something to protect."
            return
        }

        AppSelectionStore.save(selection)
        showDidYouKnow = true
    }
}

#Preview {
    NavigationStack {
        AppSelectionView()
    }
}
