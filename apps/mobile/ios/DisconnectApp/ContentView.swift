import SwiftUI
import UIKit
import FamilyControls
import DeviceActivity
import ManagedSettings
import UserNotifications

struct ContentView: View {
    @StateObject private var flow = NativeAppFlow()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        NavigationStack {
            Group {
            switch flow.phase {
            case .restoring:
                ProgressView(flow.loadingMessage)
            case .signedOut:
                ScrollView {
                    VStack(spacing:24) {
                        DisconnectHeaderBar(title:"HOOSH",showsLogo:true)
                        DisconnectLogo(size:78,cornerRadius:15)
                        Text(flow.needsStudyDetails ? "Complete your study profile" : "Start your study profile")
                            .font(.system(size:26,weight:.heavy)).foregroundStyle(DisconnectTheme.ink)
                        Text("Next, choose the apps you want to protect and set your intentions.")
                            .font(.subheadline).foregroundStyle(DisconnectTheme.mutedInk).multilineTextAlignment(.center)
                        StudyEnrollmentCard()
                    }.padding(24)
                }.background(DisconnectTheme.softBackground)
            case .onboarding:
                WelcomeOnboardingView()
            case .dashboard:
                DashboardView()
            case .failed:
                VStack(spacing:16) {
                    Text(flow.errorMessage).multilineTextAlignment(.center)
                    Button("Retry account setup") { Task { await flow.refresh() } }.frame(minHeight:44)
                    Button("Sign out") { Task { await NativeSupabase.shared.signOut() } }.frame(minHeight:44)
                }.padding(24)
            }
            }
        .toolbar {
            ToolbarItemGroup(placement:.keyboard) {
                Spacer()
                Button("Done") {
                    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder),to:nil,from:nil,for:nil)
                }.accessibilityIdentifier("keyboard.done")
            }
        }
        }
        .id(flow.navigationID)
        .tint(DisconnectTheme.green)
        .preferredColorScheme(.light)
        .task { if flow.navigationID == "restoring" { await flow.refresh() } }
        .onChange(of:scenePhase) { phase in
            if phase == .active { Task { await flow.refresh() } }
            if phase == .background {
                StudyConfigurationHistory.capture(reason:"app_background")
                StudyAppVisitTracker.shared.enteredBackground()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for:.disconnectAccountChanged)) { _ in
            Task { await flow.refresh() }
        }
        .onReceive(NotificationCenter.default.publisher(for:.disconnectOnboardingCompleted)) { _ in
            Task { await flow.refresh() }
        }
    }
}

extension Notification.Name {
    static let disconnectOnboardingCompleted = Notification.Name("disconnectOnboardingCompleted")
}

private struct WelcomeOnboardingView: View {
    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "HOOSH", showsLogo: true)

            ScrollView {
                VStack(spacing: 26) {
                    Spacer(minLength: 6)

                    DisconnectLogo(size: 78, cornerRadius: 15)
                        .padding(.top, 2)

                    VStack(spacing: 24) {
                        Text("Let's disconnect\nwith tech and\nconnect with the\nworld")
                            .font(.system(size: 29, weight: .heavy))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(DisconnectTheme.ink)
                            .lineSpacing(3)

                        Text("Master your digital habits and rediscover the\njoy of intentional living.")
                            .font(.system(size: 14, weight: .medium))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(4)
                    }

                    VStack(spacing: 18) {
                        WelcomeBenefitRow(
                            iconName: "clock",
                            iconColor: DisconnectTheme.green,
                            title: "Save Your Time",
                            subtitle: "Reclaim hours lost to mindless scrolling\nevery single day."
                        )

                        WelcomeBenefitRow(
                            iconName: "brain.head.profile",
                            iconColor: DisconnectTheme.blue,
                            title: "Mindful Focus",
                            subtitle: "Interrupt habits with reflective questions that\nbuild awareness."
                        )

                        WelcomeBenefitRow(
                            iconName: "globe.americas",
                            iconColor: DisconnectTheme.orange,
                            title: "Real-world Connection",
                            subtitle: "Use your saved time to reach goals and\nconnect with people."
                        )
                    }
                    .padding(.top, 4)

                    NavigationLink(destination: AppSelectionView()) {
                        HStack(spacing: 10) {
                            Text("Get Started")
                                .font(.system(size: 17, weight: .heavy))

                            Image(systemName: "arrow.right")
                                .font(.system(size: 16, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .padding(.top, 8)

                    Text("By continuing, you agree to our Terms of Service.")
                        .font(.system(size: 12))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .padding(.bottom, 12)
                }
                .padding(.horizontal, 24)
                .padding(.top, 28)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
    }
}

private struct WelcomeBenefitRow: View {
    let iconName: String
    let iconColor: Color
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.white)
                    .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 4)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(DisconnectTheme.border, lineWidth: 1)
                    )

                Image(systemName: iconName)
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(iconColor)
            }
            .frame(width: 40, height: 40)

            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(DisconnectTheme.ink)

                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(DisconnectTheme.mutedInk)
                    .lineSpacing(3)
            }

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 17)
        .padding(.vertical, 17)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(DisconnectTheme.softBackground)
        )
    }
}

private struct CommunityAvatar: View {
    let index: Int

    private var gradient: LinearGradient {
        let palettes: [[Color]] = [
            [Color(red: 0.27, green: 0.36, blue: 0.45), Color(red: 0.83, green: 0.66, blue: 0.52)],
            [Color(red: 0.19, green: 0.54, blue: 0.73), Color(red: 0.95, green: 0.83, blue: 0.64)],
            [Color(red: 0.88, green: 0.54, blue: 0.30), Color(red: 0.25, green: 0.31, blue: 0.38)],
            [Color(red: 0.37, green: 0.64, blue: 0.72), Color(red: 0.85, green: 0.72, blue: 0.58)],
            [Color(red: 0.12, green: 0.21, blue: 0.29), Color(red: 0.66, green: 0.78, blue: 0.83)]
        ]

        return LinearGradient(
            colors: palettes[index % palettes.count],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var body: some View {
        Circle()
            .fill(gradient)
            .frame(width: 24, height: 24)
            .overlay(
                Image(systemName: "person.fill")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.82))
            )
            .overlay(Circle().stroke(Color.white, lineWidth: 2))
    }
}

struct DidYouKnowView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "DID YOU KNOW?", showsBackButton: true) {
                dismiss()
            }

            ScrollView {
                VStack(spacing: 26) {
                    ProgressPills(activeIndex: 2)
                        .padding(.top, 3)

                    VStack(spacing: 12) {
                        Text("90%")
                            .font(.system(size: 68, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.green)

                        Text("Of social media usage is purely\nsubconscious.")
                            .font(.system(size: 21, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.ink)
                            .multilineTextAlignment(.center)
                            .lineSpacing(2)

                        Text("Most people open apps without even\nrealizing they've reached for their phone.")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                            .padding(.top, 3)
                    }

                    VStack(alignment: .leading, spacing: 22) {
                        HStack(spacing: 12) {
                            Image(systemName: "brain.head.profile")
                                .font(.system(size: 21, weight: .semibold))
                                .foregroundStyle(DisconnectTheme.green)

                            Text("The Hoosh Method")
                                .font(.system(size: 20, weight: .heavy))
                                .foregroundStyle(DisconnectTheme.ink)
                        }

                        (Text("Our app creates a ")
                            + Text("\"Reflective Buffer\"").italic().fontWeight(.bold)
                            + Text(".\nInstead of jumping straight into a\nscroll-loop, we ask you a personalized\nquestion first."))
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(6)

                        HStack(spacing: 26) {
                            MethodStep(iconName: "shield", label: "TRIGGER", caption: "App Open", isActive: false)

                            Image(systemName: "arrow.right")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(DisconnectTheme.subtleInk)

                            MethodStep(iconName: "text.bubble", label: "PAUSE", caption: "Reflection", isActive: true)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(DisconnectTheme.softBackground)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(DisconnectTheme.border, lineWidth: 1)
                    )

                    VStack(alignment: .leading, spacing: 18) {
                        (Text("By answering a simple question, you move\nfrom ")
                            + Text("autopilot").foregroundColor(DisconnectTheme.green).fontWeight(.heavy)
                            + Text(" to ")
                            + Text("intentionality.").foregroundColor(DisconnectTheme.green).fontWeight(.heavy))
                            .font(.system(size: 16))
                            .foregroundStyle(DisconnectTheme.ink)
                            .lineSpacing(5)

                        Text("It gives you the space to decide: Is this actually\nhow I want to spend the next 20 minutes?")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(5)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    NavigationLink(destination: FocusGoalsView()) {
                        Text("Choose your questions")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())

                    Text("Next: Select the activities you'd rather be doing.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .padding(.bottom, 18)
                }
                .padding(.horizontal, 28)
                .padding(.top, 28)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
    }
}

private struct MethodStep: View {
    let iconName: String
    let label: String
    let caption: String
    let isActive: Bool

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 15)
                    .fill(isActive ? DisconnectTheme.green : Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(isActive ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(isActive ? 0 : 0.04), radius: 8, x: 0, y: 4)

                Image(systemName: iconName)
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(isActive ? .white : DisconnectTheme.mutedInk)
            }
            .frame(width: 46, height: 46)

            VStack(spacing: 3) {
                Text(label)
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(isActive ? DisconnectTheme.green : DisconnectTheme.mutedInk)

                Text(caption)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundStyle(DisconnectTheme.subtleInk)
            }
        }
    }
}

private struct ProgressPills: View {
    let activeIndex: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<5, id: \.self) { index in
                Capsule()
                    .fill(index == activeIndex ? DisconnectTheme.green : (index < activeIndex ? DisconnectTheme.green.opacity(0.32) : DisconnectTheme.border))
                    .frame(width: 32, height: 4)
            }
        }
    }
}

struct DisconnectHeaderBar: View {
    let title: String
    var showsLogo = false
    var showsBackButton = false
    var backAction: (() -> Void)?

    var body: some View {
        ZStack {
            Text(title)
                .font(.system(size: 13, weight: .heavy))
                .tracking(1.6)
                .foregroundStyle(DisconnectTheme.ink)

            HStack {
                if showsLogo {
                    DisconnectLogo(size: 31, cornerRadius: 6)
                } else if showsBackButton {
                    Button {
                        backAction?()
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(DisconnectTheme.ink)
                            .frame(width: 44, height: 44, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Back")
                } else {
                    Color.clear.frame(width: 31, height: 31)
                }

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .frame(height: title == "SETTINGS" ? 48 : 72)
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(DisconnectTheme.border)
                .frame(height: 1)
        }
    }
}

struct DisconnectLogo: View {
    let size: CGFloat
    let cornerRadius: CGFloat

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(DisconnectTheme.ink)
            .frame(width: size, height: size)
            .overlay {
                Image(systemName: "bolt")
                    .font(.system(size: size * 0.58, weight: .bold))
                    .foregroundStyle(.white)
            }
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .heavy))
            .foregroundStyle(Color.black)
            .padding(.vertical, 18)
            .background(
                RoundedRectangle(cornerRadius: 13)
                    .fill(DisconnectTheme.green)
            )
            .shadow(color: DisconnectTheme.green.opacity(configuration.isPressed ? 0.12 : 0.28), radius: configuration.isPressed ? 5 : 14, x: 0, y: configuration.isPressed ? 2 : 7)
            .scaleEffect(configuration.isPressed ? 0.99 : 1)
    }
}

struct FocusGoalsView: View {
    @State private var showQuestions = false
    @Environment(\.dismiss) private var dismiss
    @State private var selectedGoalIDs: Set<String> = OnboardingGoalDraftStore.load()?.presetIDs ?? ["gym"]
    @State private var customGoals: [CustomFocusGoal] = OnboardingGoalDraftStore.load()?.customGoals ?? []
    @State private var selectedCustomGoalIDs: Set<UUID> = OnboardingGoalDraftStore.load()?.selectedCustomIDs ?? []
    @State private var editingCustomGoalID: UUID?

    private let goals = [
        FocusGoal(id: "gym", title: "Hit the Gym", subtitle: "Physical Health", iconName: "dumbbell"),
        FocusGoal(id: "study", title: "Deep Study", subtitle: "Learning", iconName: "book"),
        FocusGoal(id: "career", title: "Career Growth", subtitle: "Applications", iconName: "briefcase"),
        FocusGoal(id: "read", title: "Read Daily", subtitle: "Mindfulness", iconName: "books.vertical"),
        FocusGoal(id: "meditation", title: "Meditation", subtitle: "Mental Peace", iconName: "wind")
    ]

    private var selectedFocusTitles: [String] {
        let presetTitles = goals
            .filter { selectedGoalIDs.contains($0.id) }
            .map(\.title)
        let customTitles = customGoals
            .filter { selectedCustomGoalIDs.contains($0.id) }
            .map { $0.title.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        return presetTitles + customTitles
    }

    private var selectedFocusIconName: String {
        if let customGoal = customGoals.first(where: { selectedCustomGoalIDs.contains($0.id) }) {
            return customGoal.iconName
        }

        return goals.first { selectedGoalIDs.contains($0.id) }?.iconName ?? "dumbbell"
    }

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "FOCUS GOALS", showsBackButton: true) {
                dismiss()
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    HStack {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 10) {
                                Image(systemName: "trophy")
                                    .font(.system(size: 20, weight: .semibold))

                                Text("Pick your focus")
                                    .font(.system(size: 26, weight: .heavy))
                            }
                            .foregroundStyle(DisconnectTheme.ink)

                            Text("What would you rather return to when Hoosh interrupts a scroll?")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundStyle(DisconnectTheme.mutedInk)
                                .lineSpacing(6)
                        }

                        Spacer(minLength: 0)
                    }

                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 18), GridItem(.flexible(), spacing: 18)], spacing: 18) {
                        ForEach(goals) { goal in
                            FocusGoalCard(goal: goal, isSelected: selectedGoalIDs.contains(goal.id)) {
                                togglePresetGoal(goal.id)
                            }
                        }

                        ForEach(customGoals) { goal in
                            FocusGoalCard(
                                goal: FocusGoal(
                                    id: goal.id.uuidString,
                                    title: goal.displayTitle,
                                    subtitle: "Custom",
                                    iconName: goal.iconName
                                ),
                                isSelected: selectedCustomGoalIDs.contains(goal.id)
                            ) {
                                toggleCustomGoal(goal.id)
                            }
                        }

                        AddCustomGoalCard {
                            addCustomGoal()
                        }
                    }

                    if let editingCustomGoalID,
                       let customGoalBinding = binding(for: editingCustomGoalID) {
                        CustomGoalEditor(
                            title: customGoalBinding.title,
                            selectedIconName: customGoalBinding.iconName,
                            onDelete: {
                                deleteCustomGoal(editingCustomGoalID)
                            }
                        )
                    }

                    InsightCallout(text: "Choosing clear alternatives makes it 40% easier to\nbreak a bad habit.")

                    Button {
                        saveGoalDraft()
                        showQuestions = true
                    } label: {
                        HStack(spacing: 12) {
                            Text("Get Started")
                            Image(systemName: "arrow.right")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(selectedFocusTitles.isEmpty)

                }
                .padding(.horizontal, 24)
                .padding(.top, 28)
                .padding(.bottom, 20)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(isPresented:$showQuestions) { ConfigureQuestionsView() }
        .onChange(of:selectedGoalIDs) { _ in saveGoalDraft() }
        .onChange(of:customGoals) { _ in saveGoalDraft() }
        .onChange(of:selectedCustomGoalIDs) { _ in saveGoalDraft() }
    }

    private func saveGoalDraft() {
        OnboardingGoalDraftStore.save(OnboardingGoalDraft(presetIDs:selectedGoalIDs,customGoals:customGoals,selectedCustomIDs:selectedCustomGoalIDs))
        var responses=OnboardingResponseStore.load()
        responses.focusGoal=selectedFocusTitles.joined(separator:", ")
        responses.focusGoalIconName=selectedFocusIconName
        OnboardingResponseStore.save(responses)
    }

    private func togglePresetGoal(_ id: String) {
        if selectedGoalIDs.contains(id) {
            selectedGoalIDs.remove(id)
        } else {
            selectedGoalIDs.insert(id)
        }
    }

    private func addCustomGoal() {
        let goal = CustomFocusGoal(title: "", iconName: "sparkles")
        customGoals.append(goal)
        selectedCustomGoalIDs.insert(goal.id)
        editingCustomGoalID = goal.id
    }

    private func toggleCustomGoal(_ id: UUID) {
        if selectedCustomGoalIDs.contains(id) {
            selectedCustomGoalIDs.remove(id)
        } else {
            selectedCustomGoalIDs.insert(id)
        }

        editingCustomGoalID = id
    }

    private func deleteCustomGoal(_ id: UUID) {
        customGoals.removeAll { $0.id == id }
        selectedCustomGoalIDs.remove(id)
        editingCustomGoalID = customGoals.last?.id
    }

    private func binding(for id: UUID) -> (title: Binding<String>, iconName: Binding<String>)? {
        guard customGoals.contains(where: { $0.id == id }) else { return nil }

        return (
            title: Binding(
                get: { customGoals.first(where: { $0.id == id })?.title ?? "" },
                set: { newValue in
                    guard let index = customGoals.firstIndex(where: { $0.id == id }) else { return }
                    customGoals[index].title = newValue
                }
            ),
            iconName: Binding(
                get: { customGoals.first(where: { $0.id == id })?.iconName ?? "sparkles" },
                set: { newValue in
                    guard let index = customGoals.firstIndex(where: { $0.id == id }) else { return }
                    customGoals[index].iconName = newValue
                }
            )
        )
    }
}

private struct FocusGoal: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let iconName: String
}

private typealias CustomFocusGoal = StudyCustomFocusGoal

private struct FocusGoalCard: View {
    let goal: FocusGoal
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top) {
                    Image(systemName: goal.iconName)
                        .font(.system(size: 23, weight: .semibold))
                        .foregroundStyle(isSelected ? DisconnectTheme.green : DisconnectTheme.ink)

                    Spacer()

                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(isSelected ? DisconnectTheme.green : DisconnectTheme.subtleInk)
                }

                Spacer(minLength: 18)

                VStack(alignment: .leading, spacing: 6) {
                    Text(goal.title)
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text(goal.subtitle)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                }
            }
            .padding(18)
            .frame(height: 154)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: isSelected ? 2 : 1.5)
            )
            .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("goal."+goal.id)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private struct AddCustomGoalCard: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 14) {
                Image(systemName: "plus")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
                    .frame(width: 46, height: 46)
                    .background(Circle().fill(Color.white))
                    .overlay(Circle().stroke(DisconnectTheme.border, lineWidth: 1))

                Text("Add Custom")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }
            .frame(height: 154)
            .frame(maxWidth: .infinity)
            .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(
                        DisconnectTheme.border,
                        style: StrokeStyle(lineWidth: 1.5, dash: [4, 4])
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

private struct CustomGoalEditor: View {
    @Binding var title: String
    @Binding var selectedIconName: String
    var onDelete: (() -> Void)?

    private let iconNames = [
        "sparkles",
        "paintbrush",
        "music.note",
        "figure.run",
        "leaf",
        "laptopcomputer",
        "pencil.and.outline",
        "heart",
        "camera",
        "graduationcap",
        "fork.knife",
        "moon"
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: selectedIconName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.green.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Custom focus")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("Name the thing you want to return to when Hoosh interrupts a scroll.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 0)

                if let onDelete {
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.red)
                            .frame(width: 34, height: 34)
                            .background(RoundedRectangle(cornerRadius: 8).fill(Color.red.opacity(0.08)))
                    }
                    .buttonStyle(.plain)
                }
            }

            TextField(
                "",
                text: $title,
                prompt: Text("e.g., Finish my essay draft")
                    .foregroundColor(DisconnectTheme.subtleInk)
            )
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(DisconnectTheme.ink)
                .tint(DisconnectTheme.green)
                .padding(14)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color.white))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(DisconnectTheme.border, lineWidth: 1))

            VStack(alignment: .leading, spacing: 10) {
                Text("Choose an icon")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 44), spacing: 10)], spacing: 10) {
                    ForEach(iconNames, id: \.self) { iconName in
                        Button {
                            selectedIconName = iconName
                        } label: {
                            Image(systemName: iconName)
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(selectedIconName == iconName ? Color.white : DisconnectTheme.ink)
                                .frame(width: 44, height: 44)
                                .background(
                                    RoundedRectangle(cornerRadius: 9)
                                        .fill(selectedIconName == iconName ? DisconnectTheme.green : DisconnectTheme.softBackground)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 9)
                                        .stroke(selectedIconName == iconName ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

struct ConfigureQuestionsView: View {
    @State private var showIntentions = false
    @Environment(\.dismiss) private var dismiss
    @State private var selectedQuestions: Set<String> = ["timing"]

    private let questions = [
        TriggerQuestion(id: "timing", text: ReflectionPrompts.timing),
        TriggerQuestion(id: "three", text: ReflectionPrompts.three)
    ]

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "STEP 4 OF 6", showsBackButton: true) {
                dismiss()
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Select your triggers")
                            .font(.system(size: 25, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.ink)

                        Text("We'll ask these questions to give you a moment of space before you open distracting apps.")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(6)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        Label("AI SUGGESTED", systemImage: "sparkles")
                            .font(.system(size: 13, weight: .heavy))
                            .tracking(1.0)
                            .foregroundStyle(DisconnectTheme.green)

                        ForEach(questions) { question in
                            TriggerQuestionRow(
                                question: question,
                                isSelected: selectedQuestions.contains(question.id)
                            ) {
                                if selectedQuestions.contains(question.id) {
                                    selectedQuestions.remove(question.id)
                                } else {
                                    selectedQuestions.insert(question.id)
                                }
                            }
                        }
                    }

                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 20)
            }

            BottomBar {
                Button {
                    saveQuestions()
                    showIntentions = true
                    } label: {
                    Text("Next Step")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(selectedQuestions.isEmpty)

            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(isPresented:$showIntentions) { IntentionSetupView() }
        .onAppear {
            let saved=OnboardingResponseStore.load()
            selectedQuestions=Set(questions.filter { saved.selectedQuestions.contains($0.text) }.map(\.id))
        }
        .onChange(of:selectedQuestions) { _ in saveQuestions() }
    }
    private func saveQuestions() {
        var responses=OnboardingResponseStore.load()
        responses.selectedQuestions = questions.filter { selectedQuestions.contains($0.id) }.map(\.text)
        responses.customQuestion = ""
        OnboardingResponseStore.save(responses)
    }

}

private struct TriggerQuestion: Identifiable {
    let id: String
    let text: String
}

private struct TriggerQuestionRow: View {
    let question: TriggerQuestion
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                    .font(.system(size: 21, weight: .semibold))
                    .foregroundStyle(isSelected ? DisconnectTheme.green : DisconnectTheme.mutedInk)
                    .frame(width: 26, alignment: .leading)

                Text(question.text)
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 14).fill(isSelected ? DisconnectTheme.green.opacity(0.09) : Color.white))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1.2)
            )
            .shadow(color: .black.opacity(isSelected ? 0 : 0.08), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("trigger."+question.id)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

struct IntentionSetupView: View {
    @State private var showCompletion = false
    @Environment(\.dismiss) private var dismiss
    @State private var primaryGoal = OnboardingResponseStore.hasSavedIntentions ? OnboardingResponseStore.load().primaryGoal : ""
    @State private var tinyTask = OnboardingResponseStore.hasSavedIntentions ? OnboardingResponseStore.load().tinyTask : ""
    @State private var aiFrictionStyle = OnboardingResponseStore.load().aiFrictionStyle
    @State private var aiTone = OnboardingResponseStore.load().aiTone
    @State private var persuasionStyle = OnboardingResponseStore.load().persuasionStyle

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "YOUR INTENTIONS", showsBackButton: true) {
                dismiss()
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    HStack {
                        Text("FINAL STEP")
                            .font(.system(size: 11, weight: .heavy))
                            .tracking(1.1)
                            .foregroundStyle(DisconnectTheme.green)

                        Spacer()

                        ProgressPills(activeIndex: 4)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Set your intentions.")
                            .font(.system(size: 25, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.ink)

                        Text("Answering these now helps you pause and reflect when the app intervenes during your distracting moments.")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(5)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(spacing: 22) {
                        IntentionCard(
                            iconName: "target",
                            question: "What is the primary goal you're working towards right now?",
                            placeholder: "e.g., Finishing my online certification course...",
                            text: $primaryGoal
                        )

                        IntentionCard(
                            iconName: "sparkles",
                            question: "What is a small task you can do in 5 minutes instead of scrolling?",
                            placeholder: "e.g., Drink water, stretch, or clear my desk...",
                            text: $tinyTask
                        )
                    }

                    AIFrictionStyleCard(selectedStyle: $aiFrictionStyle)

                    AIToneCard(selectedTone: $aiTone)

                    PersuasionStyleCard(selectedStyle: $persuasionStyle)

                    HStack(spacing: 10) {
                        Image(systemName: "text.bubble")
                            .font(.system(size: 14, weight: .medium))
                        Text("Your answers shape the AI friction prompts shown before protected apps open.")
                            .font(.system(size: 12, weight: .medium))
                            .italic()
                    }
                    .foregroundStyle(DisconnectTheme.mutedInk)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 10).fill(DisconnectTheme.softBackground))
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 20)
            }

            BottomBar {
                Button {
                    saveIntentions()
                    showCompletion = true
                } label: {
                    Text("Finish Setup")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(isPresented: $showCompletion) { SetupCompleteView() }
        .onChange(of:[primaryGoal, tinyTask]) { _ in saveIntentions() }
    }

    private func saveIntentions() {
        var responses = OnboardingResponseStore.load()
        responses.primaryGoal = primaryGoal.isEmpty ? OnboardingResponses.fallback.primaryGoal : primaryGoal
        responses.tinyTask = tinyTask.isEmpty ? OnboardingResponses.fallback.tinyTask : tinyTask
        responses.aiFrictionStyle = aiFrictionStyle
        responses.aiTone = aiTone
        responses.persuasionStyle = persuasionStyle
        OnboardingResponseStore.markIntentionsSaved()
        OnboardingResponseStore.save(responses)
    }
}

private struct PerAppDailyLimitCard: View {
    @State private var rules: [DailyAppRule] = []
    @State private var activeSessionIDs: Set<String> = []
    @State private var expandedRuleIDs: Set<String> = []
    @State private var loadError = ""
    @State private var hasUnsupportedSelection = false
    @State private var notificationStatus = ""
    @AppStorage(PerAppProtection.errorKey, store: PerAppProtection.defaults) private var monitoringError = ""
    @AppStorage(PerAppProtection.countKey, store: PerAppProtection.defaults) private var registeredCount = 0
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your app sessions")
                .font(DashboardFont.semibold(20))
                .foregroundStyle(DashboardPalette.primaryText)

            if rules.isEmpty {
                Text("No individual apps selected. Use Edit Protected Apps in Settings and choose individual apps inside the categories.")
                    .font(DashboardFont.medium(13))
                    .foregroundStyle(DashboardPalette.primaryText)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 16).fill(DashboardPalette.cardSurface))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(DashboardPalette.border, lineWidth: 1))
            }

            ForEach(rules) { rule in
                if let token = try? PerAppProtection.token(for: rule) {
                    AppSessionRuleCard(
                        rule: rule,
                        token: token,
                        isExpanded: expandedRuleIDs.contains(rule.id),
                        isSessionActive: activeSessionIDs.contains(rule.id),
                        loadError: loadError,
                        monitoringError: monitoringError,
                        registeredCount: registeredCount,
                        notificationStatus: notificationStatus,
                        hasUnsupportedSelection: hasUnsupportedSelection,
                        toggleExpanded: { toggleExpanded(rule.id) },
                        updateDailyAllowance: { update(rule, minutes: $0) },
                        updateSessionLength: { updateSession(rule, minutes: $0) },
                        endSession: { endSession(rule) },
                        retryMonitoring: retryMonitoring,
                        requestNotificationAuthorization: requestNotificationAuthorization
                    )
                }
            }

            if hasUnsupportedSelection {
                Text("Category and website selections do not get individual app limits. Select the apps themselves in Apple's picker.")
                    .font(DashboardFont.regular(11))
                    .foregroundStyle(DashboardPalette.secondaryText)
            }
        }
        .onAppear(perform: load)
        .onChange(of: scenePhase) { phase in if phase == .active { load() } }
        .onReceive(NotificationCenter.default.publisher(for: .disconnectSelectionChanged)) { _ in load() }
    }
    private func load() {
        do {
            let selection = try PerAppProtection.selection()
            rules = try DailyUsageMonitoring.prepareRules(selection: selection)
            activeSessionIDs = Set(rules.filter { PerAppProtection.allowance(for: $0.id) != nil }.map(\.id))
            hasUnsupportedSelection = !selection.categoryTokens.isEmpty || !selection.webDomainTokens.isEmpty
            expandedRuleIDs.formIntersection(Set(rules.map(\.id)))
            loadError = ""
        } catch {
            loadError = "Could not load your daily app limits. Your existing settings have been kept. Please retry."
        }
    }
    private func updateSession(_ rule: DailyAppRule, minutes: Int) {
        do {
            try DailyUsageMonitoring.setSessionMinutes(minutes, for: rule.id)
            ShieldStoreController().refreshShieldStateAfterInstallOrRun()
            load()
        } catch { loadError = "Could not save the session length. Please retry." }
    }
    private func update(_ rule: DailyAppRule, minutes: Int) {
        do {
            try DailyUsageMonitoring.setMinutes(minutes, for: rule.id)
            ShieldStoreController().refreshShieldStateAfterInstallOrRun()
            load()
        } catch {
            loadError = "Could not save the daily limit. Please retry."
        }
    }

    private func toggleExpanded(_ ruleID: String) {
        withAnimation(.easeInOut(duration: 0.2)) {
            if expandedRuleIDs.contains(ruleID) {
                expandedRuleIDs.remove(ruleID)
            } else {
                expandedRuleIDs.insert(ruleID)
            }
        }
    }

    private func endSession(_ rule: DailyAppRule) {
        do {
            try PerAppProtection.endAllowance(for: rule.id)
            load()
        } catch {
            loadError = "Could not end this session. Please retry."
        }
    }

    private func retryMonitoring() {
        ShieldStoreController().refreshShieldStateAfterInstallOrRun()
        load()
    }

    private func requestNotificationAuthorization() {
        Task {
            await BreakReminderScheduler.requestAuthorization()
            let settings = await UNUserNotificationCenter.current().notificationSettings()
            notificationStatus = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
                ? "Notifications are enabled. iOS controls banner delivery and Focus settings."
                : "Notifications are off. Enable them for Hoosh in iPhone Settings. Shields still work."
        }
    }
}

private struct AppSessionRuleCard: View {
    let rule: DailyAppRule
    let token: ApplicationToken
    let isExpanded: Bool
    let isSessionActive: Bool
    let loadError: String
    let monitoringError: String
    let registeredCount: Int
    let notificationStatus: String
    let hasUnsupportedSelection: Bool
    let toggleExpanded: () -> Void
    let updateDailyAllowance: (Int) -> Void
    let updateSessionLength: (Int) -> Void
    let endSession: () -> Void
    let retryMonitoring: () -> Void
    let requestNotificationAuthorization: () -> Void

    private let presetMinutes = [5, 10, 15, 30]

    var body: some View {
        VStack(spacing: 0) {
            Button(action: toggleExpanded) {
                HStack(spacing: 12) {
                    Label(token)
                        .labelStyle(.iconOnly)
                        .frame(width: 30, height: 30)

                    VStack(alignment: .leading, spacing: 3) {
                        if let name = rule.researchLabel,
                           !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Text(name)
                                .font(DashboardFont.semibold(15))
                        } else {
                            Label(token)
                                .labelStyle(.titleOnly)
                                .font(DashboardFont.semibold(15))
                        }

                        Text("\(rule.minutes) min daily · \(rule.sessionMinutes) min sessions")
                            .font(DashboardFont.regular(12))
                            .foregroundStyle(DashboardPalette.secondaryText)
                    }

                    Spacer(minLength: 8)

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(DashboardPalette.primaryText)
                }
                .foregroundStyle(DashboardPalette.primaryText)
                .padding(.horizontal, 16)
                .frame(minHeight: 60)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("App session settings")
            .accessibilityValue(isExpanded ? "Expanded" : "Collapsed")

            if isExpanded {
                Rectangle()
                    .fill(DashboardPalette.border)
                    .frame(height: 1)
                    .padding(.horizontal, 16)

                VStack(alignment: .leading, spacing: 14) {
                    settingTitle("Daily allowance", value: "\(rule.minutes) minutes")
                    presetControl(selectedMinutes: rule.minutes, options: presetMinutes, action: updateDailyAllowance)

                    DisclosureGroup {
                        Stepper(
                            "Daily minutes: \(rule.minutes)",
                            value: Binding(get: { rule.minutes }, set: updateDailyAllowance),
                            in: 5...240,
                            step: 5
                        )
                        .font(DashboardFont.regular(12))
                        .foregroundStyle(DashboardPalette.primaryText)
                        .padding(.top, 8)
                    } label: {
                        Text("Custom daily allowance")
                            .font(DashboardFont.medium(12))
                            .foregroundStyle(DashboardPalette.linkGreen)
                    }

                    dashboardDivider

                    settingTitle("Session length", value: "\(rule.sessionMinutes) minutes")
                    presetControl(
                        selectedMinutes: rule.sessionMinutes,
                        options: presetMinutes.filter { $0 <= rule.minutes },
                        action: updateSessionLength
                    )

                    DisclosureGroup {
                        Stepper(
                            "Session minutes: \(rule.sessionMinutes)",
                            value: Binding(get: { rule.sessionMinutes }, set: updateSessionLength),
                            in: 5...rule.minutes,
                            step: 5
                        )
                        .font(DashboardFont.regular(12))
                        .foregroundStyle(DashboardPalette.primaryText)
                        .padding(.top, 8)
                    } label: {
                        Text("Custom session length")
                            .font(DashboardFont.medium(12))
                            .foregroundStyle(DashboardPalette.linkGreen)
                    }

                    Text("Check-ins around \(AppSessionPolicy.nudgeMinutes(duration: rule.sessionMinutes).map(String.init).joined(separator: ", ")) active minutes. Your shield appears at \(rule.sessionMinutes) minutes.")
                        .font(DashboardFont.regular(10))
                        .foregroundStyle(DashboardPalette.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)

                    if isSessionActive {
                        ActiveSessionControls(endSession: endSession)
                    }

                    dashboardDivider

                    DisclosureGroup {
                        VStack(alignment: .leading, spacing: 10) {
                            ResearchAppLabelField(ruleID: rule.id, initialValue: rule.researchLabel ?? "")

                            if !loadError.isEmpty || !monitoringError.isEmpty {
                                Text(loadError.isEmpty ? monitoringError : loadError)
                                    .font(DashboardFont.regular(11))
                                    .foregroundStyle(.red)
                                Button("Retry app monitoring", action: retryMonitoring)
                                    .font(DashboardFont.medium(12))
                                    .frame(minHeight: 44)
                            } else if OnboardingResponseStore.hasCompletedOnboarding && registeredCount > 0 {
                                Text("OS monitoring registered for \(registeredCount) app(s).")
                                    .font(DashboardFont.regular(11))
                                    .foregroundStyle(DashboardPalette.secondaryText)
                            } else {
                                Text("Choose your limits, then finish setup to start monitoring.")
                                    .font(DashboardFont.regular(11))
                                    .foregroundStyle(DashboardPalette.secondaryText)
                            }

                            if hasUnsupportedSelection {
                                Text("Category and website selections do not get individual app limits. Select the apps themselves in Apple's picker.")
                                    .font(DashboardFont.regular(11))
                                    .foregroundStyle(DashboardPalette.secondaryText)
                            }

                            Button("Enable personalized nudge notifications", action: requestNotificationAuthorization)
                                .font(DashboardFont.medium(12))
                                .frame(minHeight: 44)

                            if !notificationStatus.isEmpty {
                                Text(notificationStatus)
                                    .font(DashboardFont.regular(11))
                                    .foregroundStyle(DashboardPalette.secondaryText)
                            }
                        }
                        .padding(.top, 10)
                    } label: {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("App setup & permissions")
                                .font(DashboardFont.medium(13))
                                .foregroundStyle(DashboardPalette.primaryText)
                            Text("Study name, monitoring and nudge notifications")
                                .font(DashboardFont.regular(10))
                                .foregroundStyle(DashboardPalette.secondaryText)
                        }
                    }

                    dashboardDivider

                    DisclosureGroup {
                        Text("Nudges appear at quarter-session usage milestones. Locking your phone does not run an app timer. Only active use during Hoosh sessions counts toward your daily allowance. Daily allowances renew at midnight. Protection is active every day; scheduled hours are not configured in this build.")
                            .font(DashboardFont.regular(11))
                            .foregroundStyle(DashboardPalette.secondaryText)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 8)
                    } label: {
                        Text("How sessions and nudges work")
                            .font(DashboardFont.medium(12))
                            .foregroundStyle(DashboardPalette.linkGreen)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 16)
            }
        }
        .background(RoundedRectangle(cornerRadius: 16).fill(DashboardPalette.cardSurface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(DashboardPalette.border, lineWidth: 1))
        .tint(DashboardPalette.linkGreen)
        .environment(\.colorScheme, .light)
        .accessibilityElement(children: .contain)
    }

    private func settingTitle(_ title: String, value: String) -> some View {
        HStack {
            Text(title)
                .font(DashboardFont.medium(13))
                .foregroundStyle(DashboardPalette.primaryText)
            Spacer()
            Text(value)
                .font(DashboardFont.medium(12))
                .foregroundStyle(DashboardPalette.linkGreen)
        }
    }

    private func presetControl(
        selectedMinutes: Int,
        options: [Int],
        action: @escaping (Int) -> Void
    ) -> some View {
        HStack(spacing: 0) {
            ForEach(options, id: \.self) { minutes in
                Button { action(minutes) } label: {
                    Text("\(minutes) min")
                        .font(DashboardFont.medium(10))
                        .foregroundStyle(DashboardPalette.primaryText)
                        .frame(maxWidth: .infinity, minHeight: 36)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(selectedMinutes == minutes ? DashboardPalette.green : Color.clear)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Set to \(minutes) minutes")
                .accessibilityAddTraits(selectedMinutes == minutes ? .isSelected : [])
            }
        }
        .padding(2)
        .background(RoundedRectangle(cornerRadius: 10).fill(DashboardPalette.presetTrack))
    }

    private var dashboardDivider: some View {
        Rectangle()
            .fill(DashboardPalette.border)
            .frame(height: 1)
    }
}

private struct ActiveSessionControls: View {
    let endSession: () -> Void
    @State private var showsDetails = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Button("End this session", action: endSession)
                    .font(DashboardFont.medium(12))
                    .frame(minHeight: 44)

                Spacer(minLength: 0)

                Button {
                    withAnimation { showsDetails.toggle() }
                } label: {
                    Image(systemName: showsDetails ? "chevron.down" : "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(DisconnectTheme.ink)
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("About ending this session")
                .accessibilityValue(showsDetails ? "Expanded" : "Collapsed")
            }

            if showsDetails {
                Text("End this session brings back the shield now. Leaving the app pauses usage, and reopening resumes it. Changes to session length apply to the next session.")
                    .font(DashboardFont.regular(11))
                    .foregroundStyle(DashboardPalette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

private struct BreakDurationCard: View {
    @Binding var selectedMinutes: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "timer")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.blue)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.blue.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Choose your break length")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("If you open anyway, Hoosh will pause you again after this many minutes.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 58), spacing: 8)], spacing: 8) {
                ForEach(OnboardingResponseStore.breakMinuteOptions, id: \.self) { minutes in
                    Button {
                        selectedMinutes = minutes
                    } label: {
                        Text("\(minutes)m")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(selectedMinutes == minutes ? Color.white : DisconnectTheme.ink)
                            .frame(maxWidth: .infinity)
                            .frame(height: 38)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(selectedMinutes == minutes ? DisconnectTheme.green : DisconnectTheme.softBackground)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(selectedMinutes == minutes ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

private struct AIFrictionStyleCard: View {
    @Binding var selectedStyle: String

    private let styles = [
        ("Balanced", "Short, practical nudges"),
        ("Reflective", "Questions tied to your feelings"),
        ("Direct", "Firm prompts tied to your goal")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "sparkles")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.green.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text("AI friction style")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("Hoosh adapts the prompt using your goal, feeling, and replacement task.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            VStack(spacing: 10) {
                ForEach(styles, id: \.0) { style, detail in
                    Button {
                        selectedStyle = style
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: selectedStyle == style ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(selectedStyle == style ? DisconnectTheme.green : DisconnectTheme.mutedInk)

                            VStack(alignment: .leading, spacing: 3) {
                                Text(style)
                                    .font(.system(size: 14, weight: .heavy))
                                    .foregroundStyle(DisconnectTheme.ink)

                                Text(detail)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(DisconnectTheme.mutedInk)
                            }

                            Spacer(minLength: 0)
                        }
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 10).fill(selectedStyle == style ? DisconnectTheme.green.opacity(0.08) : DisconnectTheme.softBackground))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(selectedStyle == style ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

private struct AIToneCard: View {
    @Binding var selectedTone: String

    private let tones = [
        ("Supportive", "Warm and encouraging"),
        ("Direct", "Clear and no-nonsense"),
        ("Playful", "Light, witty friction"),
        ("Intense", "High-pressure accountability")
    ]

    var body: some View {
        PreferenceChoiceCard(
            iconName: "slider.horizontal.3",
            title: "AI tone",
            subtitle: "Choose how strongly Hoosh should talk to you during a break.",
            options: tones,
            selectedValue: $selectedTone
        )
    }
}

private struct PersuasionStyleCard: View {
    @Binding var selectedStyle: String

    private let styles = [
        ("Future Self", "Remind me who I want to become"),
        ("Goal Cost", "Show what this scroll is costing"),
        ("Tiny Action", "Push me into the next small task"),
        ("Identity", "Speak to the person I said I am")
    ]

    var body: some View {
        PreferenceChoiceCard(
            iconName: "person.text.rectangle",
            title: "Persuasion style",
            subtitle: "Pick the kind of argument that actually gets you off the app.",
            options: styles,
            selectedValue: $selectedStyle
        )
    }
}

private struct PreferenceChoiceCard: View {
    let iconName: String
    let title: String
    let subtitle: String
    let options: [(String, String)]
    @Binding var selectedValue: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: iconName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.green.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text(title)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text(subtitle)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            VStack(spacing: 10) {
                ForEach(options, id: \.0) { value, detail in
                    Button {
                        selectedValue = value
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: selectedValue == value ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(selectedValue == value ? DisconnectTheme.green : DisconnectTheme.mutedInk)

                            VStack(alignment: .leading, spacing: 3) {
                                Text(value)
                                    .font(.system(size: 14, weight: .heavy))
                                    .foregroundStyle(DisconnectTheme.ink)

                                Text(detail)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(DisconnectTheme.mutedInk)
                            }

                            Spacer(minLength: 0)
                        }
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 10).fill(selectedValue == value ? DisconnectTheme.green.opacity(0.08) : DisconnectTheme.softBackground))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(selectedValue == value ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("preference."+title+"."+value)
                    .accessibilityAddTraits(selectedValue == value ? .isSelected : [])
                }
            }
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

private struct IntentionCard: View {
    let iconName: String
    let question: String
    let placeholder: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: iconName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.green.opacity(0.1)))

                Text(question)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }

            PlaceholderTextEditor(text: $text, placeholder: placeholder)
                .frame(height: 92)
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

struct SetupCompleteView: View {
    @State private var protectedSelection = AppSelectionStore.load()

    private var protectedSelectionCount: Int {
        protectedSelection.applicationTokens.count
    }

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "SETUP COMPLETE")

            ScrollView {
                VStack(spacing: 26) {
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(Color.white)
                                .frame(width: 88, height: 88)
                                .shadow(color: .black.opacity(0.16), radius: 9, x: 0, y: 5)
                                .overlay(Circle().stroke(DisconnectTheme.border, lineWidth: 4))

                            Image(systemName: "checkmark")
                                .font(.system(size: 34, weight: .heavy))
                                .foregroundStyle(DisconnectTheme.ink)
                        }

                        Text("You're All Set!")
                            .font(.system(size: 26, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.ink)

                        Text("Hoosh is now standing guard\nover your digital focus.")
                            .font(.system(size: 16, weight: .medium))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(4)
                    }
                    .padding(.top, 28)

                    NextStepsCard(hasProtectedSelection: protectedSelectionCount > 0)

                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text("Protected Selection")
                                .font(.system(size: 16, weight: .heavy))
                                .foregroundStyle(DisconnectTheme.ink)
                            Spacer()
                            Text("\(protectedSelectionCount) SELECTED")
                                .font(.system(size: 10, weight: .heavy))
                                .tracking(0.8)
                                .foregroundStyle(DisconnectTheme.mutedInk)
                        }

                        if protectedSelectionCount == 0 {
                            EmptyProtectedSelectionRow()
                        } else {
                            ForEach(Array(protectedSelection.applicationTokens), id: \.self) { token in
                                ProtectedApplicationRow(token: token)
                            }

                            if !protectedSelection.categoryTokens.isEmpty {
                                ProtectedCategorySummaryRow(count: protectedSelection.categoryTokens.count)
                            }

                            ForEach(Array(protectedSelection.webDomainTokens), id: \.self) { token in
                                ProtectedWebDomainRow(token: token)
                            }
                        }
                    }

                    Text("You can always change your settings or view your\nprogress in the main dashboard.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .multilineTextAlignment(.center)

                    NavigationLink(destination: DashboardView()) {
                        HStack(spacing: 12) {
                            Text("Close Hoosh")
                            Image(systemName: "arrow.right")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 28)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            let responses = OnboardingResponseStore.load()
            OnboardingResponseStore.markOnboardingCompleted()
            DatabaseService.shared.logEvent(
                "onboarding_completed",
                properties: [
                    "break_minutes": responses.bypassMinutes,
                    "focus_goal": responses.focusGoal,
                    "ai_tone": responses.aiTone,
                    "ai_friction_style": responses.aiFrictionStyle,
                    "protected_total": protectedSelectionCount
                ]
            )
            DatabaseService.shared.syncUserProfile(responses: responses, selection: protectedSelection)
            NotificationCenter.default.post(name: .disconnectOnboardingCompleted, object: nil)
            protectedSelection = AppSelectionStore.load()
            Task {
                await BreakReminderScheduler.requestAuthorization()
            }
            ShieldStoreController().refreshShieldStateAfterInstallOrRun()
        }
    }
}

private struct NextStepsCard: View {
    let hasProtectedSelection: Bool

    private var steps: [(String, String, String)] {
        [
            ("1", "Close Hoosh", "Tap the button below to minimize this app\nand return to your home screen."),
            (
                "2",
                "Try a Protected App",
                hasProtectedSelection
                    ? "Open one of your selected apps or websites\nto see how Hoosh intervenes."
                    : "Choose at least one app, website, or category\nso Hoosh has something to guard."
            ),
            ("3", "Reflect & Save Time", "Answer your personalized questions to\nintentionally choose your next move.")
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Label("YOUR NEXT STEPS", systemImage: "iphone")
                .font(.system(size: 11, weight: .heavy))
                .tracking(1.0)
                .foregroundStyle(DisconnectTheme.mutedInk)
                .padding(16)

            Rectangle()
                .fill(DisconnectTheme.border)
                .frame(height: 1)

            VStack(spacing: 0) {
                ForEach(steps.indices, id: \.self) { index in
                    HStack(alignment: .top, spacing: 16) {
                        Text(steps[index].0)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(DisconnectTheme.green)
                            .frame(width: 30, height: 30)
                            .background(Circle().fill(DisconnectTheme.green.opacity(0.13)))
                            .overlay(Circle().stroke(DisconnectTheme.green.opacity(0.35), lineWidth: 1))

                        VStack(alignment: .leading, spacing: 7) {
                            Text(steps[index].1)
                                .font(.system(size: 14, weight: .heavy))
                                .foregroundStyle(DisconnectTheme.ink)

                            Text(steps[index].2)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(DisconnectTheme.mutedInk)
                                .lineSpacing(4)
                        }

                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 22)
                    .padding(.vertical, 18)

                    if index < steps.count - 1 {
                        Rectangle()
                            .fill(DisconnectTheme.border)
                            .frame(height: 1)
                            .padding(.leading, 72)
                            .padding(.trailing, 20)
                    }
                }
            }
        }
        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

private struct ProtectedApplicationRow: View {
    let token: ApplicationToken

    var body: some View {
        ProtectedActivityRow {
            Label(token)
        }
    }
}

private struct ProtectedWebDomainRow: View {
    let token: WebDomainToken

    var body: some View {
        ProtectedActivityRow {
            Label(token)
        }
    }
}

private struct ProtectedCategorySummaryRow: View {
    let count: Int

    var body: some View {
        ProtectedSummaryRow(
            iconName: "square.grid.2x2",
            title: "\(count) categor\(count == 1 ? "y" : "ies")",
            detail: "Whole Screen Time categories protected"
        )
    }
}

private struct ProtectedActivityRow<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        HStack(spacing: 14) {
            content
                .labelStyle(ProtectedActivityLabelStyle())

            Spacer()

            Image(systemName: "sparkles")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(DisconnectTheme.ink)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .background(RoundedRectangle(cornerRadius: 14).fill(DisconnectTheme.softBackground))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
    }
}

private struct ProtectedActivityLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 14) {
            configuration.icon
                .frame(width: 42, height: 42)
                .background(RoundedRectangle(cornerRadius: 9).fill(Color.white))
                .clipShape(RoundedRectangle(cornerRadius: 9))
                .overlay(RoundedRectangle(cornerRadius: 9).stroke(DisconnectTheme.border, lineWidth: 1))
                .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)

            VStack(alignment: .leading, spacing: 5) {
                configuration.title
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                    .lineLimit(1)

                Text("Active Guard")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }
        }
    }
}

private struct ProtectedSummaryRow: View {
    let iconName: String
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: iconName)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(DisconnectTheme.mutedInk)
                .frame(width: 42, height: 42)
                .background(RoundedRectangle(cornerRadius: 9).fill(Color.white))
                .overlay(RoundedRectangle(cornerRadius: 9).stroke(DisconnectTheme.border, lineWidth: 1))
                .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)

            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)

                Text(detail)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }

            Spacer()

            Image(systemName: "sparkles")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(DisconnectTheme.ink)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .background(RoundedRectangle(cornerRadius: 14).fill(DisconnectTheme.softBackground))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
    }
}

private struct EmptyProtectedSelectionRow: View {
    var body: some View {
        ProtectedSummaryRow(
            iconName: "exclamationmark.shield",
            title: "No protected apps selected",
            detail: "Go back to app selection to choose one."
        )
    }
}

enum DashboardPalette {
    static let cream = Color(red: 1.0, green: 241 / 255, blue: 221 / 255)
    static let cardSurface = Color(red: 1.0, green: 250 / 255, blue: 241 / 255)
    static let green = Color(red: 44 / 255, green: 198 / 255, blue: 83 / 255)
    static let linkGreen = Color(red: 22 / 255, green: 136 / 255, blue: 67 / 255)
    static let primaryText = Color(red: 64 / 255, green: 41 / 255, blue: 0)
    static let secondaryText = Color(red: 130 / 255, green: 115 / 255, blue: 92 / 255)
    static let border = Color(red: 235 / 255, green: 216 / 255, blue: 181 / 255)
    static let presetTrack = Color(red: 241 / 255, green: 233 / 255, blue: 219 / 255)
    static let logoBackground = Color(red: 42 / 255, green: 42 / 255, blue: 42 / 255)
    static let activeNavigation = Color(red: 17 / 255, green: 24 / 255, blue: 39 / 255)
    static let inactiveNavigation = Color(red: 76 / 255, green: 92 / 255, blue: 122 / 255)
    static let navigationDivider = Color(red: 229 / 255, green: 231 / 255, blue: 235 / 255)
}

private struct DashboardHeaderBar: View {
    let title: String

    var body: some View {
        ZStack {
            Text(title)
                .font(DashboardFont.semibold(12))
                .tracking(1.5)
                .foregroundStyle(DashboardPalette.primaryText)

            HStack {
                Image("DashboardDinosaur")
                    .resizable()
                    .scaledToFill()
                    .frame(width: 44, height: 44)
                    .background(DashboardPalette.logoBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 11))
                    .accessibilityLabel("Hoosh dinosaur")

                Spacer()
            }
            .padding(.horizontal, 20)
        }
        .frame(height: 72)
        .frame(maxWidth: .infinity)
        .background(DashboardPalette.cream)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(DashboardPalette.border)
                .frame(height: 1)
        }
    }
}

struct DashboardView: View {
    @State private var selectedTab: DashboardSection = .stats
    @State private var showsPersonalization = false
    @StateObject private var followUpProductivityService = AppleProductivityContextService()

    var body: some View {
        VStack(spacing: 0) {
            if selectedTab == .stats {
                DashboardHeaderBar(title: selectedTab.title)
            } else if selectedTab == .history {
                HistoryDashboardHeaderBar()
            } else if selectedTab == .feedback {
                FeedbackDashboardHeaderBar()
            } else if selectedTab == .settings {
                SettingsDashboardHeaderBar()
            } else {
                DisconnectHeaderBar(title: selectedTab.title)
            }

            Group {
                switch selectedTab {
                case .stats:
                    DashboardStatsView()
                case .history:
                    DashboardHistoryView()
                case .feedback:
                    DashboardFeedbackView()
                case .settings:
                    DashboardSettingsView()
                }
            }

            HStack {
                DashboardTab(iconName: "house", label: "Stats", isActive: selectedTab == .stats) {
                    selectedTab = .stats
                }
                Spacer()
                DashboardTab(iconName: "clock.arrow.circlepath", label: "History", isActive: selectedTab == .history) {
                    selectedTab = .history
                }
                Spacer()
                DashboardTab(iconName: "quote.bubble", label: "Feedback", isActive: selectedTab == .feedback) {
                    selectedTab = .feedback
                }
                Spacer()
                DashboardTab(iconName: "gearshape", label: "Settings", isActive: selectedTab == .settings) {
                    selectedTab = .settings
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 8)
            .background {
                Color.white.ignoresSafeArea(edges: .bottom)
            }
            .overlay(alignment: .top) {
                Rectangle().fill(DashboardPalette.navigationDivider).frame(height: 1)
            }
        }
        .background(DashboardPalette.cream.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .onAppear { openRequestedPersonalization() }
        .onReceive(NotificationCenter.default.publisher(for: DayTwoSettingsTipStore.routeNotification)) { _ in
            openRequestedPersonalization()
        }
        .sheet(isPresented: $showsPersonalization) {
            NavigationStack {
                ScrollView {
                    VStack(spacing: 20) {
                        PersonalizationAnswersForm(followUpOnly: true)
                        AppleProductivityContextCard(service: followUpProductivityService)
                    }
                    .padding(20)
                }
                .onAppear { followUpProductivityService.refreshAuthorizationStatus() }
                .navigationTitle("Make Hoosh yours")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") { showsPersonalization = false }
                    }
                }
            }
        }
    }

    private func openRequestedPersonalization() {
        let defaults = ShieldPresentationStore.defaults
        guard let pendingOwner = defaults.string(forKey: DayTwoSettingsTipStore.pendingRoute) else { return }
        defaults.removeObject(forKey: DayTwoSettingsTipStore.pendingRoute)
        guard pendingOwner == defaults.string(forKey: NativeResearchQueue.userKey) else { return }
        defaults.set(true, forKey: DayTwoSettingsTipStore.openedKey)
        let center = UNUserNotificationCenter.current()
        center.removeDeliveredNotifications(withIdentifiers: [DayTwoSettingsTipStore.notificationID])
        center.removePendingNotificationRequests(withIdentifiers: [DayTwoSettingsTipStore.notificationID])
        NativeResearchQueue.enqueue("personalization_invitation_opened")
        showsPersonalization = true
    }
}

private enum DashboardSection {
    case stats
    case history
    case feedback
    case settings

    var title: String {
        switch self {
        case .stats:
            return "DASHBOARD"
        case .history:
            return "HISTORY"
        case .feedback:
            return "FEEDBACK"
        case .settings:
            return "SETTINGS"
        }
    }
}

private enum FeedbackScreenPalette {
    static let background = Color(red: 1.0, green: 241 / 255, blue: 221 / 255)
    static let cardSurface = Color(red: 1.0, green: 250 / 255, blue: 241 / 255)
    static let primaryText = Color(red: 64 / 255, green: 41 / 255, blue: 0)
    static let secondaryText = Color(red: 130 / 255, green: 115 / 255, blue: 92 / 255)
    static let border = Color(red: 235 / 255, green: 216 / 255, blue: 181 / 255)
    static let green = Color(red: 44 / 255, green: 198 / 255, blue: 83 / 255)
    static let selectedAccent = Color(red: 22 / 255, green: 136 / 255, blue: 67 / 255)
    static let selectedSurface = Color(red: 227 / 255, green: 244 / 255, blue: 220 / 255)
    static let toggleTrack = Color(red: 241 / 255, green: 233 / 255, blue: 219 / 255)
}

private struct FeedbackDashboardHeaderBar: View {
    var body: some View {
        Text("FEEDBACK")
            .font(DashboardFont.semibold(12))
            .tracking(1.6)
            .foregroundStyle(FeedbackScreenPalette.primaryText)
            .frame(height: 72)
            .frame(maxWidth: .infinity)
            .background(FeedbackScreenPalette.background)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(FeedbackScreenPalette.border)
                    .frame(height: 1)
            }
    }
}

private struct DashboardFeedbackView: View {
    @State private var responses = OnboardingResponseStore.load()
    @State private var selection = AppSelectionStore.load()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Tell us what actually worked.")
                        .font(DashboardFont.semibold(22))
                        .foregroundStyle(FeedbackScreenPalette.primaryText)

                    Text("Rate nudges, send feedback, or opt into a quick interview. This is where we learn what makes Hoosh stronger.")
                        .font(DashboardFont.regular(13))
                        .foregroundStyle(FeedbackScreenPalette.secondaryText)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }

                FeedbackLabCard(responses: responses, selection: selection)
            }
            .padding(.horizontal, 20)
            .padding(.top, 18)
            .padding(.bottom, 32)
        }
        .background(FeedbackScreenPalette.background)
        .scrollDismissesKeyboard(.interactively)
        .onAppear {
            responses = OnboardingResponseStore.load()
            selection = AppSelectionStore.load()
            DatabaseService.shared.logEvent("feedback_viewed")
        }
    }
}

private struct DashboardStatsView: View {
    @State private var metrics = DashboardMetrics.load()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                PerAppDailyLimitCard()
                WeeklyProgressCard(metrics: metrics)
                InsightsSection(metrics: metrics)
                MomentumCard(metrics: metrics)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(DashboardPalette.cream)
        .onAppear {
            metrics = DashboardMetrics.load()
        }
    }
}

private struct WeeklyProgressCard: View {
    let metrics: DashboardMetrics

    private var data: [DailySavedTime] {
        metrics.weeklySavedTime
    }

    private var maxMinutes: Int {
        max(data.map(\.minutes).max() ?? 0, 1)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("Weekly progress")
                    .font(DashboardFont.semibold(16))

                Spacer()

                Text("Last 7 days")
                    .font(DashboardFont.regular(10))
                    .foregroundStyle(DashboardPalette.secondaryText)
            }
            .foregroundStyle(DashboardPalette.primaryText)

            Text(DashboardMetrics.durationText(minutes: metrics.currentWeekSavedMinutes))
                .font(DashboardFont.semibold(28))
                .foregroundStyle(DashboardPalette.primaryText)

            Text("protected this week")
                .font(DashboardFont.regular(11))
                .foregroundStyle(DashboardPalette.secondaryText)
                .padding(.top, -8)

            Text("Saved time per day (minutes)")
                .font(DashboardFont.regular(10))
                .foregroundStyle(DashboardPalette.secondaryText)

            HStack(alignment: .bottom, spacing: 8) {
                ForEach(data) { item in
                    VStack(spacing: 8) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(DashboardPalette.green)
                            .frame(width: 22)
                            .frame(height: barHeight(for: item.minutes))
                        Text(item.label)
                            .font(DashboardFont.regular(9))
                            .foregroundStyle(DashboardPalette.secondaryText)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 66, alignment: .bottom)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(DashboardPalette.border)
                    .frame(height: 1)
                    .padding(.bottom, 22)
                    .allowsHitTesting(false)
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 16).fill(DashboardPalette.cardSurface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(DashboardPalette.border, lineWidth: 1))
    }

    private func barHeight(for minutes: Int) -> CGFloat {
        guard minutes > 0 else { return 4 }
        return max(4, CGFloat(minutes) / CGFloat(maxMinutes) * 40)
    }
}

private struct InsightsSection: View {
    let metrics: DashboardMetrics

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Insights")
                .font(DashboardFont.semibold(18))
                .foregroundStyle(DashboardPalette.primaryText)

            VStack(spacing: 0) {
                DashboardInsightRow(title: "Focus rate", value: "\(metrics.intentionalOpeningRate)%")
                DashboardInsightRow(title: "Top avoided", value: "\(metrics.topAvoidedCount)x")
                DashboardInsightRow(title: "Saved today", value: metrics.todaySavedText)
                DashboardInsightRow(
                    title: "This week",
                    value: DashboardMetrics.durationText(minutes: metrics.currentWeekSavedMinutes)
                )
                DashboardInsightRow(title: "Interventions", value: "\(metrics.totalInterventions)", showsDivider: false)
            }
            .padding(.horizontal, 14)
            .background(RoundedRectangle(cornerRadius: 16).fill(DashboardPalette.cardSurface))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(DashboardPalette.border, lineWidth: 1))
        }
    }
}

private struct DashboardInsightRow: View {
    let title: String
    let value: String
    var showsDivider = true

    var body: some View {
        HStack {
            Text(title)
                .font(DashboardFont.regular(12))
                .foregroundStyle(DashboardPalette.secondaryText)

            Spacer()

            Text(value)
                .font(DashboardFont.semibold(13))
                .foregroundStyle(DashboardPalette.primaryText)
        }
        .frame(minHeight: 34)
        .overlay(alignment: .bottom) {
            if showsDivider {
                Rectangle()
                    .fill(DashboardPalette.border)
                    .frame(height: 1)
            }
        }
    }
}

private struct InsightRow: View {
    let iconName: String
    let title: String
    let subtitle: String
    let value: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: iconName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(DisconnectTheme.green)
                .frame(width: 44, height: 44)
                .background(Circle().fill(DisconnectTheme.softBackground))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 14, weight: .heavy))
                Text(subtitle)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }

            Spacer()

            Text(value)
                .font(.system(size: 14, weight: .heavy))
        }
        .foregroundStyle(DisconnectTheme.ink)
        .padding(.horizontal, 18)
        .padding(.vertical, 16)
        .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.07), radius: 3, x: 0, y: 2)
    }
}

private struct MomentumCard: View {
    let metrics: DashboardMetrics

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Keep the momentum!")
                    .font(DashboardFont.semibold(15))
                    .foregroundStyle(DashboardPalette.cardSurface)
                Text("You’ve protected \(DashboardMetrics.durationText(minutes: metrics.currentWeekSavedMinutes)) this week.")
                    .font(DashboardFont.regular(11))
                    .foregroundStyle(DashboardPalette.cardSurface.opacity(0.8))
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)

            Image(systemName: "arrow.up.right")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(DashboardPalette.primaryText)
                .frame(width: 42, height: 42)
                .background(Circle().fill(DashboardPalette.green))
                .accessibilityHidden(true)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(DashboardPalette.primaryText))
    }
}

private struct DashboardTab: View {
    let iconName: String
    let label: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: iconName)
                    .font(.system(size: 21, weight: .semibold))
                Text(label)
                    .font(isActive ? DashboardFont.semibold(10) : DashboardFont.medium(10))
            }
            .foregroundStyle(isActive ? DashboardPalette.activeNavigation : DashboardPalette.inactiveNavigation)
            .frame(width: 62, height: 48)
        }
        .buttonStyle(.plain)
    }
}

private enum SettingsScreenPalette {
    static let background = Color(red: 1.0, green: 241 / 255, blue: 221 / 255)
    static let cardSurface = Color(red: 1.0, green: 250 / 255, blue: 241 / 255)
    static let primaryText = Color(red: 64 / 255, green: 41 / 255, blue: 0)
    static let secondaryText = Color(red: 130 / 255, green: 115 / 255, blue: 92 / 255)
    static let border = Color(red: 235 / 255, green: 216 / 255, blue: 181 / 255)
    static let green = Color(red: 44 / 255, green: 198 / 255, blue: 83 / 255)
    static let greenIcon = Color(red: 22 / 255, green: 136 / 255, blue: 67 / 255)
    static let selectedSurface = Color(red: 227 / 255, green: 244 / 255, blue: 220 / 255)
    static let destructive = Color(red: 196 / 255, green: 61 / 255, blue: 50 / 255)
    static let destructiveSurface = Color(red: 252 / 255, green: 237 / 255, blue: 231 / 255)
}

private struct SettingsDashboardHeaderBar: View {
    var body: some View {
        Text("SETTINGS")
            .font(DashboardFont.semibold(12))
            .tracking(1.6)
            .foregroundStyle(SettingsScreenPalette.primaryText)
            .frame(height: 72)
            .frame(maxWidth: .infinity)
            .background(SettingsScreenPalette.background)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(SettingsScreenPalette.border)
                    .frame(height: 1)
            }
    }
}

private struct CompactSettingsSection<Content:View>: View {
    let title:String
    let value:String
    @ViewBuilder let content:Content
    var body:some View {
        DisclosureGroup {
            content.padding(.top,8)
        } label: {
            VStack(alignment:.leading,spacing:3) {
                Text(title).font(DashboardFont.semibold(14)).foregroundStyle(SettingsScreenPalette.primaryText)
                Text(value).font(DashboardFont.regular(11)).foregroundStyle(SettingsScreenPalette.secondaryText)
            }.frame(minHeight:44,alignment:.leading)
        }
        .tint(SettingsScreenPalette.primaryText)
        .padding(14)
        .background(RoundedRectangle(cornerRadius:14).fill(SettingsScreenPalette.cardSurface))
        .overlay(RoundedRectangle(cornerRadius:14).stroke(SettingsScreenPalette.border,lineWidth:1))
    }
}

private struct SettingsPreferenceGroup: View {
    let iconName: String
    let title: String
    let subtitle: String
    let options: [(String, String)]
    @Binding var selectedValue: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: iconName)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(SettingsScreenPalette.greenIcon)
                    .frame(width: 34, height: 34)
                    .background(RoundedRectangle(cornerRadius: 8).fill(SettingsScreenPalette.selectedSurface))

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(DashboardFont.semibold(13))
                        .foregroundStyle(SettingsScreenPalette.primaryText)
                    Text(subtitle)
                        .font(DashboardFont.regular(11))
                        .foregroundStyle(SettingsScreenPalette.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            VStack(spacing: 8) {
                ForEach(options, id: \.0) { value, detail in
                    Button {
                        selectedValue = value
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: selectedValue == value ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(selectedValue == value ? SettingsScreenPalette.green : SettingsScreenPalette.secondaryText)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(value)
                                    .font(DashboardFont.semibold(13))
                                    .foregroundStyle(SettingsScreenPalette.primaryText)
                                Text(detail)
                                    .font(DashboardFont.regular(10))
                                    .foregroundStyle(SettingsScreenPalette.secondaryText)
                            }

                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 12)
                        .frame(minHeight: 48)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(selectedValue == value ? SettingsScreenPalette.selectedSurface : SettingsScreenPalette.cardSurface)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(selectedValue == value ? SettingsScreenPalette.green : SettingsScreenPalette.border, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("preference." + title + "." + value)
                    .accessibilityAddTraits(selectedValue == value ? .isSelected : [])
                }
            }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 12).fill(SettingsScreenPalette.background))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(SettingsScreenPalette.border, lineWidth: 1))
    }
}

private struct SettingsPrimaryActionStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DashboardFont.semibold(15))
            .foregroundStyle(SettingsScreenPalette.primaryText)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(RoundedRectangle(cornerRadius: 12).fill(SettingsScreenPalette.green))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

private struct DashboardSettingsView: View {
    @StateObject private var authorizationService = ScreenTimeAuthorizationService()
    @StateObject private var productivityService = AppleProductivityContextService()
    @State private var selection = AppSelectionStore.load()
    @State private var responses = OnboardingResponseStore.load()
    @State private var isPickerPresented = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Protection")
                    .font(DashboardFont.semibold(22))
                    .foregroundStyle(SettingsScreenPalette.primaryText)

                SettingsInfoRow(
                    iconName: authorizationService.isApproved ? "checkmark.shield" : "exclamationmark.shield",
                    title: "Screen Time Access",
                    detail: authorizationService.isApproved ? "Approved" : authorizationService.statusText
                )

                SettingsInfoRow(
                    iconName: "app.badge",
                    title: "Protected Selection",
                    detail: protectedSelectionSummary
                )

                CompactSettingsSection(title:"AI friction style",value:responses.aiFrictionStyle) {
                    SettingsPreferenceGroup(
                        iconName: "sparkles",
                        title: "AI friction style",
                        subtitle: "Hoosh adapts the prompt using your goal, feeling, and replacement task.",
                        options: [
                            ("Balanced", "Short, practical nudges"),
                            ("Reflective", "Questions tied to your feelings"),
                            ("Direct", "Firm prompts tied to your goal")
                        ],
                        selectedValue: frictionStyleBinding
                    )
                }
                CompactSettingsSection(title:"AI tone",value:responses.aiTone) {
                    SettingsPreferenceGroup(
                        iconName: "slider.horizontal.3",
                        title: "AI tone",
                        subtitle: "Choose how strongly Hoosh should talk to you during a break.",
                        options: [
                            ("Supportive", "Warm and encouraging"),
                            ("Direct", "Clear and no-nonsense"),
                            ("Playful", "Light, witty friction"),
                            ("Intense", "High-pressure accountability")
                        ],
                        selectedValue: aiToneBinding
                    )
                }
                CompactSettingsSection(title:"Persuasion style",value:responses.persuasionStyle) {
                    SettingsPreferenceGroup(
                        iconName: "person.text.rectangle",
                        title: "Persuasion style",
                        subtitle: "Pick the kind of argument that actually gets you off the app.",
                        options: [
                            ("Future Self", "Remind me who I want to become"),
                            ("Goal Cost", "Show what this scroll is costing"),
                            ("Tiny Action", "Push me into the next small task"),
                            ("Identity", "Speak to the person I said I am")
                        ],
                        selectedValue: persuasionStyleBinding
                    )
                }
                CompactSettingsSection(title: "Personalization answers", value: "Edit your answers") {
                    PersonalizationAnswersForm(followUpOnly: false, usesSettingsStyle: true)
                }

                AppleProductivityContextCard(service: productivityService, usesSettingsStyle: true)

                Button {
                    DatabaseService.shared.logEvent("edit_protected_apps_tapped")
                    Task {
                        await editProtectedApps()
                    }
                } label: {
                    Label("Edit Protected Apps", systemImage: "slider.horizontal.3")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(SettingsPrimaryActionStyle())

                Button {
                    DatabaseService.shared.logEvent("protection_turned_off")
                    try? PerAppProtection.stop()
                    ShieldStoreController().removeAllShields()
                    AppSelectionStore.clear()
                    selection = FamilyActivitySelection()
                    DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
                } label: {
                    Label("Turn Off Protection", systemImage: "shield.slash")
                        .font(DashboardFont.semibold(15))
                        .foregroundStyle(SettingsScreenPalette.destructive)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(RoundedRectangle(cornerRadius: 12).fill(SettingsScreenPalette.destructiveSurface))
                }
                .buttonStyle(.plain)


            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(SettingsScreenPalette.background)
        .environment(\.colorScheme,.light)
        .familyActivityPicker(isPresented: $isPickerPresented, selection: $selection)
        .onAppear {
            authorizationService.refreshStatus()
            selection = AppSelectionStore.load()
            responses = OnboardingResponseStore.load()
            DatabaseService.shared.logEvent("settings_viewed")
            DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
            productivityService.refreshAuthorizationStatus()
            Task {
                await productivityService.refreshContext()
            }
        }
        .onChange(of: selection) { newSelection in
            selection = newSelection
            AppSelectionStore.save(newSelection)
            ShieldStoreController().shieldSelectedApps()
            DatabaseService.shared.logProtectedSelectionChanged(newSelection)
        }
    }

    private var protectedSelectionSummary: String {
        let count=selection.applicationTokens.count
        return count == 0 ? "No individual apps selected yet" : "\(count) individual app\(count == 1 ? "" : "s") selected"
    }

    private var breakMinutesBinding: Binding<Int> {
        Binding(
            get: { responses.bypassMinutes },
            set: { newValue in
                responses = OnboardingResponseStore.load()
                responses.bypassMinutes = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
                DatabaseService.shared.logEvent("setting_changed", properties: ["setting": "break_minutes", "value": newValue])
                DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
            }
        )
    }

    private var frictionStyleBinding: Binding<String> {
        Binding(
            get: { responses.aiFrictionStyle },
            set: { newValue in
                responses = OnboardingResponseStore.load()
                responses.aiFrictionStyle = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
                DatabaseService.shared.logEvent("setting_changed", properties: ["setting": "ai_friction_style", "value": newValue])
                DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
            }
        )
    }

    private var aiToneBinding: Binding<String> {
        Binding(
            get: { responses.aiTone },
            set: { newValue in
                responses = OnboardingResponseStore.load()
                responses.aiTone = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
                DatabaseService.shared.logEvent("setting_changed", properties: ["setting": "ai_tone", "value": newValue])
                DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
            }
        )
    }

    private var persuasionStyleBinding: Binding<String> {
        Binding(
            get: { responses.persuasionStyle },
            set: { newValue in
                responses = OnboardingResponseStore.load()
                responses.persuasionStyle = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
                DatabaseService.shared.logEvent("setting_changed", properties: ["setting": "persuasion_style", "value": newValue])
                DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
            }
        )
    }

    @MainActor
    private func editProtectedApps() async {
        if !authorizationService.isApproved {
            await authorizationService.requestAuthorization()
        }

        if authorizationService.isApproved {
            isPickerPresented = true
        }
    }
}

private struct PersonalizationAnswersForm: View {
    let followUpOnly: Bool
    var usesSettingsStyle = false
    @State private var responses = OnboardingResponseStore.load()
    @State private var saved = false

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if followUpOnly {
                Text("Tell Hoosh what would make your nudges more helpful. You can edit your answers later in Settings.")
                    .font(usesSettingsStyle ? DashboardFont.regular(12) : .subheadline)
                    .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.secondaryText : DisconnectTheme.mutedInk)
            } else {
                CompactPromptEditor(title: "What would you rather return to when Hoosh interrupts a scroll?",
                                    placeholder: "Your focus", text: $responses.focusGoal, usesSettingsStyle: usesSettingsStyle)
                ForEach([ReflectionPrompts.timing, ReflectionPrompts.three], id: \.self) { prompt in
                    Toggle(prompt, isOn: promptSelection(prompt))
                        .font(usesSettingsStyle ? DashboardFont.regular(12) : .body)
                        .tint(usesSettingsStyle ? SettingsScreenPalette.green : DisconnectTheme.green)
                }
                CompactPromptEditor(title: "What is the primary goal you're working towards right now?",
                                    placeholder: "Your goal", text: $responses.primaryGoal, usesSettingsStyle: usesSettingsStyle)
                CompactPromptEditor(title: "What is a small task you can do in 5 minutes instead of scrolling?",
                                    placeholder: "A small task", text: $responses.tinyTask, usesSettingsStyle: usesSettingsStyle)
            }
            CompactPromptEditor(title: "How will you feel if you stay focused and avoid doomscrolling today?",
                                placeholder: "How you hope to feel", text: $responses.focusFeeling, usesSettingsStyle: usesSettingsStyle)
            CompactPromptEditor(title: "What feeling or situation usually makes you open the app?",
                                placeholder: "What tends to pull you in", text: $responses.scrollTemptation, usesSettingsStyle: usesSettingsStyle)
            CompactPromptEditor(title: "What does scrolling usually cost you afterward?",
                                placeholder: "What you give up", text: $responses.scrollCost, usesSettingsStyle: usesSettingsStyle)
            CompactPromptEditor(title: "Who or what should Hoosh remind you you are doing this for?",
                                placeholder: "Who or what matters to you", text: $responses.accountabilityAnchor, usesSettingsStyle: usesSettingsStyle)
            if usesSettingsStyle {
                Button {
                    save()
                } label: {
                    Text("Save answers").frame(maxWidth: .infinity)
                }
                .buttonStyle(SettingsPrimaryActionStyle())
            } else {
                Button {
                    save()
                } label: {
                    Text("Save answers").frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            if saved {
                Text("Answers saved.")
                    .font(usesSettingsStyle ? DashboardFont.regular(11) : .caption)
                    .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.greenIcon : DisconnectTheme.ink)
            }
        }
        .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)
        .onAppear {
            responses = OnboardingResponseStore.load()
            saved = false
        }
    }

    private func promptSelection(_ prompt: String) -> Binding<Bool> {
        Binding {
            responses.selectedQuestions.contains(prompt)
        } set: { selected in
            responses.selectedQuestions.removeAll { $0 == prompt }
            if selected { responses.selectedQuestions.append(prompt) }
            saved = false
        }
    }

    private func save() {
        // Merge just the questionnaire fields so a Settings edit underneath a sheet is preserved.
        var current = OnboardingResponseStore.load()
        if !followUpOnly {
            current.focusGoal = responses.focusGoal
            current.primaryGoal = responses.primaryGoal
            current.tinyTask = responses.tinyTask
            current.selectedQuestions = responses.selectedQuestions
        }
        current.focusFeeling = responses.focusFeeling
        current.scrollTemptation = responses.scrollTemptation
        current.scrollCost = responses.scrollCost
        current.accountabilityAnchor = responses.accountabilityAnchor
        OnboardingResponseStore.save(current)
        ShieldStoreController().shieldSelectedApps()
        DatabaseService.shared.syncUserProfile(responses: current)
        saved = true
    }
}

private struct AppleProductivityContextCard: View {
    @ObservedObject var service: AppleProductivityContextService
    var usesSettingsStyle = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "calendar.badge.clock")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.greenIcon : DisconnectTheme.green)
                    .frame(width: 38, height: 38)
                    .background(
                        RoundedRectangle(cornerRadius: 9)
                            .fill(usesSettingsStyle ? SettingsScreenPalette.selectedSurface : DisconnectTheme.green.opacity(0.1))
                    )

                VStack(alignment: .leading, spacing: 5) {
                    Text("Productivity context")
                        .font(usesSettingsStyle ? DashboardFont.semibold(14) : .system(size: 14, weight: .heavy))
                        .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)

                    Text("Use Apple Calendar and Reminders to make nudges point back to the next real task.")
                        .font(usesSettingsStyle ? DashboardFont.regular(11) : .system(size: 12, weight: .medium))
                        .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.secondaryText : DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                ProductivityAccessRow(
                    iconName: "calendar",
                    title: "Apple Calendar",
                    status: statusText(service.snapshot.calendarAccess),
                    actionTitle: actionTitle(service.snapshot.calendarAccess),
                    isBusy: service.isRefreshing,
                    usesSettingsStyle: usesSettingsStyle
                ) {
                    Task {
                        await service.requestCalendarAccess()
                    }
                }

                ProductivityAccessRow(
                    iconName: "checklist",
                    title: "Apple Reminders",
                    status: statusText(service.snapshot.remindersAccess),
                    actionTitle: actionTitle(service.snapshot.remindersAccess),
                    isBusy: service.isRefreshing,
                    usesSettingsStyle: usesSettingsStyle
                ) {
                    Task {
                        await service.requestReminderAccess()
                    }
                }

                Text("Connect Apple Reminders for tasks you want to act on. Saved lists and other items without due dates can also appear in nudges.")
                    .font(usesSettingsStyle ? DashboardFont.regular(11) : .footnote)
                    .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.secondaryText : DisconnectTheme.mutedInk)
                    .fixedSize(horizontal: false, vertical: true)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Next nudge context")
                    .font(usesSettingsStyle ? DashboardFont.semibold(12) : .system(size: 12, weight: .heavy))
                    .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)

                VStack(alignment: .leading, spacing: 4) {
                    if service.snapshot.actionLine.isEmpty {
                        Text(service.snapshot.summaryLine)
                    } else {
                        if !service.snapshot.contextKind.isEmpty && !service.snapshot.contextTitle.isEmpty {
                            Text("\(service.snapshot.contextKind.capitalized): \(service.snapshot.contextTitle)")
                        }
                        Text("Action: \(service.snapshot.actionLine)")
                    }
                }
                .font(usesSettingsStyle ? DashboardFont.medium(12) : .system(size: 13, weight: .semibold))
                .foregroundStyle(
                    service.snapshot.hasUsefulContext
                        ? (usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)
                        : (usesSettingsStyle ? SettingsScreenPalette.secondaryText : DisconnectTheme.mutedInk)
                )
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 10).fill(usesSettingsStyle ? SettingsScreenPalette.background : DisconnectTheme.softBackground))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(usesSettingsStyle ? SettingsScreenPalette.border : DisconnectTheme.border, lineWidth: 1))
            }

            Button {
                Task {
                    await service.refreshContext()
                }
            } label: {
                HStack(spacing: 10) {
                    if service.isRefreshing {
                        ProgressView()
                            .tint(usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)
                    } else {
                        Image(systemName: "arrow.clockwise")
                    }
                    Text(service.isRefreshing ? "Refreshing..." : "Refresh Context")
                }
                .font(usesSettingsStyle ? DashboardFont.semibold(13) : .system(size: 14, weight: .bold))
                .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(RoundedRectangle(cornerRadius: 10).fill(usesSettingsStyle ? SettingsScreenPalette.cardSurface : DisconnectTheme.softBackground))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(usesSettingsStyle ? SettingsScreenPalette.border : DisconnectTheme.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .disabled(service.isRefreshing)

            if let errorMessage = service.errorMessage {
                Text(errorMessage)
                    .font(usesSettingsStyle ? DashboardFont.medium(11) : .system(size: 12, weight: .semibold))
                    .foregroundStyle(.red)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(usesSettingsStyle ? 16 : 20)
        .background(RoundedRectangle(cornerRadius: usesSettingsStyle ? 16 : 14).fill(usesSettingsStyle ? SettingsScreenPalette.cardSurface : Color.white))
        .overlay(
            RoundedRectangle(cornerRadius: usesSettingsStyle ? 16 : 14)
                .stroke(usesSettingsStyle ? SettingsScreenPalette.border : DisconnectTheme.border, lineWidth: 1)
        )
        .shadow(color: usesSettingsStyle ? .clear : .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }

    private func statusText(_ state: ProductivityContextSnapshot.AccessState) -> String {
        switch state {
        case .authorized:
            return "Connected"
        case .partial:
            return "Limited access"
        case .denied:
            return "Denied in Settings"
        case .restricted:
            return "Restricted"
        case .notDetermined:
            return "Not connected"
        case .unknown:
            return "Unknown"
        }
    }

    private func actionTitle(_ state: ProductivityContextSnapshot.AccessState) -> String {
        state == .authorized ? "Connected" : "Connect"
    }
}

private struct ProductivityAccessRow: View {
    let iconName: String
    let title: String
    let status: String
    let actionTitle: String
    let isBusy: Bool
    var usesSettingsStyle = false
    let action: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.greenIcon : DisconnectTheme.green)
                .frame(width: 34, height: 34)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(usesSettingsStyle ? SettingsScreenPalette.selectedSurface : DisconnectTheme.green.opacity(0.1))
                )

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(usesSettingsStyle ? DashboardFont.semibold(12) : .system(size: 13, weight: .heavy))
                    .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)
                Text(status)
                    .font(usesSettingsStyle ? DashboardFont.regular(10) : .system(size: 12, weight: .medium))
                    .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.secondaryText : DisconnectTheme.mutedInk)
            }

            Spacer()

            Button(action: action) {
                Text(actionTitle)
                    .font(usesSettingsStyle ? DashboardFont.medium(11) : .system(size: 12, weight: .bold))
                    .foregroundStyle(
                        usesSettingsStyle
                            ? SettingsScreenPalette.primaryText
                            : (actionTitle == "Connected" ? DisconnectTheme.green : DisconnectTheme.ink)
                    )
                    .padding(.horizontal, 12)
                    .frame(height: 34)
                    .background(RoundedRectangle(cornerRadius: 8).fill(usesSettingsStyle ? SettingsScreenPalette.cardSurface : Color.white))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(
                                usesSettingsStyle
                                    ? SettingsScreenPalette.border
                                    : (actionTitle == "Connected" ? DisconnectTheme.green : DisconnectTheme.border),
                                lineWidth: 1
                            )
                    )
            }
            .buttonStyle(.plain)
            .disabled(actionTitle == "Connected" || isBusy)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10).fill(usesSettingsStyle ? SettingsScreenPalette.background : DisconnectTheme.softBackground))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(usesSettingsStyle ? SettingsScreenPalette.border : DisconnectTheme.border, lineWidth: 1))
    }
}

private struct FeedbackLabCard: View {
    let responses: OnboardingResponses
    let selection: FamilyActivitySelection

    @State private var rating = 4
    @State private var whatWorked = ""
    @State private var whatCouldBeBetter = ""
    @State private var researchConsent = false
    @State private var name = ""
    @State private var contact = ""
    @State private var userType = "Student"
    @State private var biggestDistraction = ""
    @State private var researchNotes = ""
    @State private var feedbackStatus: FeedbackSubmissionState = .idle
    @State private var researchStatus: FeedbackSubmissionState = .idle

    private let userTypes = ["Student", "Founder", "Creator", "Professional"]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "ellipsis.message")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(FeedbackScreenPalette.selectedAccent)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(FeedbackScreenPalette.selectedSurface))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Feedback lab")
                        .font(DashboardFont.semibold(15))
                        .foregroundStyle(FeedbackScreenPalette.primaryText)

                    Text("Optional. Help us sharpen the nudges and find people for follow-up interviews.")
                        .font(DashboardFont.regular(12))
                        .foregroundStyle(FeedbackScreenPalette.secondaryText)
                        .lineSpacing(3)
                }
            }

            VStack(alignment: .leading, spacing: 12) {
                Text("How useful was your last nudge?")
                    .font(DashboardFont.medium(12))
                    .foregroundStyle(FeedbackScreenPalette.primaryText)

                HStack(spacing: 8) {
                    ForEach(1...5, id: \.self) { value in
                        Button {
                            rating = value
                        } label: {
                            Image(systemName: value <= rating ? "star.fill" : "star")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(value <= rating ? FeedbackScreenPalette.selectedAccent : FeedbackScreenPalette.secondaryText)
                                .frame(maxWidth: .infinity)
                                .frame(height: 42)
                                .background(RoundedRectangle(cornerRadius: 8).fill(value <= rating ? FeedbackScreenPalette.selectedSurface : FeedbackScreenPalette.cardSurface))
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(value <= rating ? FeedbackScreenPalette.green : FeedbackScreenPalette.border, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(value) stars")
                        .accessibilityAddTraits(value <= rating ? .isSelected : [])
                    }
                }

                Group {
                    FeedbackTextEditor(text: $whatWorked, placeholder: "What worked?")
                        .frame(minHeight: 84, idealHeight: 84)
                    FeedbackTextEditor(text: $whatCouldBeBetter, placeholder: "What could be better?")
                        .frame(minHeight: 84, idealHeight: 84)
                }
                .disabled(feedbackStatus.isSubmitting)

                if feedbackMessage.count > 2000 {
                    Text("Keep your feedback under 2,000 characters across both fields.")
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                Button {
                    submitFeedback()
                } label: {
                    statusLabel(title: "Send Feedback", systemImage: "paperplane.fill", status: feedbackStatus)
                }
                .buttonStyle(FeedbackSubmitButtonStyle())
                .disabled(!canSubmitFeedback || feedbackStatus.isSubmitting)
                .opacity(canSubmitFeedback ? 1 : 0.55)
            }

            Divider().overlay(FeedbackScreenPalette.border)

            Toggle(isOn: $researchConsent.animation(.easeInOut(duration: 0.2))) {
                Text("I am open to a quick follow-up interview")
                    .font(DashboardFont.medium(13))
                    .foregroundStyle(FeedbackScreenPalette.primaryText)
            }
            .toggleStyle(FeedbackConsentToggleStyle())

            if researchConsent {
                VStack(alignment: .leading, spacing: 12) {
                    FeedbackTextField(title: "Name", placeholder: "Your name", text: $name)
                    FeedbackTextField(title: "Contact", placeholder: "Email or phone", text: $contact)
                    FeedbackTextField(title: "Biggest distraction", placeholder: "Instagram, TikTok, late-night scrolling...", text: $biggestDistraction)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Which best describes you?")
                            .font(DashboardFont.medium(12))
                            .foregroundStyle(FeedbackScreenPalette.primaryText)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(userTypes, id: \.self) { type in
                                    Button {
                                        userType = type
                                    } label: {
                                        Text(type)
                                            .font(DashboardFont.medium(12))
                                            .foregroundStyle(FeedbackScreenPalette.primaryText)
                                            .padding(.horizontal, 14)
                                            .frame(height: 36)
                                            .background(RoundedRectangle(cornerRadius: 8).fill(userType == type ? FeedbackScreenPalette.selectedSurface : FeedbackScreenPalette.cardSurface))
                                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(userType == type ? FeedbackScreenPalette.green : FeedbackScreenPalette.border, lineWidth: 1))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    FeedbackTextEditor(
                        text: $researchNotes,
                        placeholder: "Anything we should ask you about? Optional."
                    )
                    .frame(minHeight: 74, idealHeight: 74)

                    Button {
                        submitResearchOptIn()
                    } label: {
                        statusLabel(title: "Join Interview List", systemImage: "person.crop.circle.badge.checkmark", status: researchStatus)
                    }
                    .buttonStyle(FeedbackSubmitButtonStyle())
                    .disabled(!canSubmitResearch || researchStatus.isSubmitting)
                    .opacity(canSubmitResearch ? 1 : 0.55)
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            if let message = statusMessage {
                Text(message)
                    .font(DashboardFont.medium(12))
                    .foregroundStyle(statusMessageColor)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 16).fill(FeedbackScreenPalette.cardSurface))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(FeedbackScreenPalette.border, lineWidth: 1))
    }

    private var feedbackMessage: String {
        let answers = [
            ("What worked?", whatWorked),
            ("What could be better?", whatCouldBeBetter)
        ]
        return answers.compactMap { question, answer in
            let text = answer.trimmingCharacters(in: .whitespacesAndNewlines)
            return text.isEmpty ? nil : question + "\n" + text
        }.joined(separator: "\n\n")
    }

    private var canSubmitFeedback: Bool {
        !feedbackMessage.isEmpty && feedbackMessage.count <= 2000
    }

    private var canSubmitResearch: Bool {
        !contact.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var statusMessage: String? {
        switch (feedbackStatus, researchStatus) {
        case (.failure(let message), _), (_, .failure(let message)):
            return message
        case (.submitting, _), (_, .submitting):
            return nil
        case (.success, _), (_, .success):
            return "Saved. Thank you for helping shape Hoosh."
        default:
            return nil
        }
    }

    private var statusMessageColor: Color {
        if case .failure = feedbackStatus { return .red }
        if case .failure = researchStatus { return .red }
        return FeedbackScreenPalette.selectedAccent
    }

    private func statusLabel(title: String, systemImage: String, status: FeedbackSubmissionState) -> some View {
        HStack(spacing: 10) {
            if status.isSubmitting {
                ProgressView()
                    .tint(FeedbackScreenPalette.primaryText)
            } else {
                Image(systemName: systemImage)
            }
            Text(status.isSubmitting ? "Sending..." : title)
        }
        .font(DashboardFont.semibold(15))
        .foregroundStyle(FeedbackScreenPalette.primaryText)
        .frame(maxWidth: .infinity)
    }

    private func submitFeedback() {
        feedbackStatus = .submitting
        DatabaseService.shared.submitFeedback(
            rating: rating,
            message: feedbackMessage,
            context: "settings_feedback_lab",
            responses: responses
        ) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    whatWorked = ""
                    whatCouldBeBetter = ""
                    feedbackStatus = .success
                case .failure(let error):
                    feedbackStatus = .failure("Could not save feedback: \(error.localizedDescription)")
                }
            }
        }
    }

    private func submitResearchOptIn() {
        researchStatus = .submitting
        DatabaseService.shared.submitResearchOptIn(
            name: name,
            contact: contact,
            userType: userType,
            biggestDistraction: biggestDistraction,
            notes: researchNotes,
            responses: responses,
            selection: selection
        ) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    name = ""
                    contact = ""
                    biggestDistraction = ""
                    researchNotes = ""
                    researchConsent = false
                    researchStatus = .success
                case .failure(let error):
                    researchStatus = .failure("Could not save interview opt-in: \(error.localizedDescription)")
                }
            }
        }
    }
}

private enum FeedbackSubmissionState {
    case idle
    case submitting
    case success
    case failure(String)

    var isSubmitting: Bool {
        if case .submitting = self { return true }
        return false
    }
}

private struct FeedbackSubmitButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(FeedbackScreenPalette.green)
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

private struct FeedbackConsentToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button {
            configuration.isOn.toggle()
        } label: {
            HStack(spacing: 12) {
                configuration.label

                Spacer(minLength: 12)

                ZStack {
                    Capsule()
                        .fill(configuration.isOn ? FeedbackScreenPalette.green : FeedbackScreenPalette.toggleTrack)
                        .overlay(
                            Capsule()
                                .stroke(FeedbackScreenPalette.border, lineWidth: configuration.isOn ? 0 : 1)
                        )

                    Circle()
                        .fill(FeedbackScreenPalette.cardSurface)
                        .frame(width: 24, height: 24)
                        .offset(x: configuration.isOn ? 14 : -14)
                }
                .frame(width: 58, height: 30)
                .animation(.easeInOut(duration: 0.2), value: configuration.isOn)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityRepresentation {
            Toggle("I am open to a quick follow-up interview", isOn: configuration.$isOn)
        }
    }
}

private struct FeedbackTextEditor: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        ZStack(alignment: .topLeading) {
            TextEditor(text: $text)
                .accessibilityLabel(placeholder)
                .font(DashboardFont.regular(14))
                .foregroundStyle(FeedbackScreenPalette.primaryText)
                .scrollContentBackground(.hidden)
                .padding(8)

            if text.isEmpty {
                Text(placeholder)
                    .font(DashboardFont.regular(14))
                    .foregroundStyle(FeedbackScreenPalette.secondaryText)
                    .lineSpacing(4)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 16)
                    .allowsHitTesting(false)
            }
        }
        .background(RoundedRectangle(cornerRadius: 10).fill(FeedbackScreenPalette.background))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(FeedbackScreenPalette.border, lineWidth: 1))
    }
}

private struct FeedbackTextField: View {
    let title: String
    let placeholder: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(DashboardFont.medium(12))
                .foregroundStyle(FeedbackScreenPalette.primaryText)

            TextField(placeholder, text: $text)
                .font(DashboardFont.regular(14))
                .foregroundStyle(FeedbackScreenPalette.primaryText)
                .textInputAutocapitalization(.words)
                .padding(.horizontal, 12)
                .frame(height: 48)
                .background(RoundedRectangle(cornerRadius: 10).fill(FeedbackScreenPalette.background))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(FeedbackScreenPalette.border, lineWidth: 1))
        }
    }
}

private struct CompactPromptEditor: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var usesSettingsStyle = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(usesSettingsStyle ? DashboardFont.medium(12) : .system(size: 12, weight: .heavy))
                .foregroundStyle(usesSettingsStyle ? SettingsScreenPalette.primaryText : DisconnectTheme.ink)

            if usesSettingsStyle {
                SettingsPromptTextEditor(text: $text, placeholder: placeholder)
                    .frame(minHeight: 72, idealHeight: 72)
            } else {
                PlaceholderTextEditor(text: $text, placeholder: placeholder)
                    .frame(height: 72)
            }
        }
    }
}

private struct SettingsPromptTextEditor: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        ZStack(alignment: .topLeading) {
            TextEditor(text: $text)
                .accessibilityLabel(placeholder)
                .font(DashboardFont.regular(13))
                .foregroundStyle(SettingsScreenPalette.primaryText)
                .scrollContentBackground(.hidden)
                .padding(8)

            if text.isEmpty {
                Text(placeholder)
                    .font(DashboardFont.regular(13))
                    .foregroundStyle(SettingsScreenPalette.secondaryText)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 16)
                    .allowsHitTesting(false)
            }
        }
        .background(RoundedRectangle(cornerRadius: 10).fill(SettingsScreenPalette.background))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(SettingsScreenPalette.border, lineWidth: 1))
    }
}

private struct SettingsInfoRow: View {
    let iconName: String
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: iconName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(SettingsScreenPalette.greenIcon)
                .frame(width: 32, height: 32)
                .background(RoundedRectangle(cornerRadius: 8).fill(SettingsScreenPalette.selectedSurface))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(DashboardFont.semibold(13))
                    .foregroundStyle(SettingsScreenPalette.primaryText)
                Text(detail)
                    .font(DashboardFont.regular(10))
                    .foregroundStyle(SettingsScreenPalette.secondaryText)
            }

            Spacer()
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 14).fill(SettingsScreenPalette.cardSurface))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(SettingsScreenPalette.border, lineWidth: 1))
    }
}

private struct InsightsDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var metrics = DashboardMetrics.load()

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "INSIGHTS", showsBackButton: true) {
                dismiss()
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Your focus patterns")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    InsightRow(iconName: "target", title: "Focus Rate", subtitle: "Closed instead of opening", value: "\(metrics.intentionalOpeningRate)%")
                    InsightRow(iconName: "iphone", title: "Top Avoided", subtitle: metrics.topAvoidedAppName, value: "\(metrics.topAvoidedCount)x")
                    InsightRow(iconName: "medal", title: "Saved Today", subtitle: "From real shield decisions", value: metrics.todaySavedText)
                    InsightRow(iconName: "clock", title: "This Week", subtitle: "Last 7 days protected", value: DashboardMetrics.durationText(minutes: metrics.currentWeekSavedMinutes))
                    InsightRow(iconName: "flame", title: "Interventions", subtitle: "Total shield responses", value: "\(metrics.totalInterventions)")

                    InsightCallout(text: "These insights are based on real Hoosh shield choices. Apple Screen Time duration totals can be added with a DeviceActivity report extension.")
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 24)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            metrics = DashboardMetrics.load()
        }
    }
}

private struct InsightCallout: View {
    let text: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: "arrow.right")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(DisconnectTheme.green)

            Text(text)
                .font(.system(size: 13, weight: .medium))
                .italic()
                .foregroundStyle(DisconnectTheme.mutedInk)
                .lineSpacing(2)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 18)
        .background(RoundedRectangle(cornerRadius: 14).fill(DisconnectTheme.softBackground))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
    }
}

private struct PlaceholderTextEditor: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        ZStack(alignment: .topLeading) {
            TextEditor(text: $text)
                .accessibilityLabel(placeholder)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(DisconnectTheme.ink)
                .scrollContentBackground(.hidden)
                .padding(8)

            if text.isEmpty {
                Text(placeholder)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(DisconnectTheme.subtleInk)
                    .lineSpacing(4)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 16)
                    .allowsHitTesting(false)
            }
        }
        .background(RoundedRectangle(cornerRadius: 6).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(DisconnectTheme.border, lineWidth: 1))
    }
}

private struct BottomBar<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(spacing: 0) {
            content
        }
        .padding(.horizontal, 24)
        .padding(.top, 18)
        .padding(.bottom, 18)
        .background(Color.white)
        .overlay(alignment: .top) {
            Rectangle().fill(DisconnectTheme.border).frame(height: 1)
        }
    }
}



#Preview("Welcome") {
    ContentView()
}

#Preview("Did You Know") {
    NavigationStack {
        DidYouKnowView()
    }
}
