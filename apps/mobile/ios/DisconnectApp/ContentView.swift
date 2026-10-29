import SwiftUI
import FamilyControls
import DeviceActivity
import ManagedSettings

struct ContentView: View {
    @State private var hasCompletedOnboarding = OnboardingResponseStore.hasCompletedOnboarding

    var body: some View {
        NavigationStack {
            if hasCompletedOnboarding {
                DashboardView()
            } else {
                WelcomeOnboardingView()
            }
        }
        .tint(DisconnectTheme.green)
        .onReceive(NotificationCenter.default.publisher(for: .disconnectOnboardingCompleted)) { _ in
            hasCompletedOnboarding = true
        }
    }
}

extension Notification.Name {
    static let disconnectOnboardingCompleted = Notification.Name("disconnectOnboardingCompleted")
}

private struct WelcomeOnboardingView: View {
    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "DISCONNECT", showsLogo: true)

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

                            Text("The Disconnect Method")
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
        .frame(height: 72)
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
    @Environment(\.dismiss) private var dismiss
    @State private var selectedGoalIDs: Set<String> = ["gym"]
    @State private var customGoals: [CustomFocusGoal] = []
    @State private var selectedCustomGoalIDs: Set<UUID> = []
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

                            Text("What would you rather return to when Disconnect interrupts a scroll?")
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

                    NavigationLink(destination: ConfigureQuestionsView()) {
                        HStack(spacing: 12) {
                            Text("Get Started")
                            Image(systemName: "arrow.right")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .simultaneousGesture(TapGesture().onEnded {
                        var responses = OnboardingResponseStore.load()
                        responses.focusGoal = selectedFocusTitles.isEmpty ? OnboardingResponses.fallback.focusGoal : selectedFocusTitles.joined(separator: ", ")
                        responses.focusGoalIconName = selectedFocusIconName
                        OnboardingResponseStore.save(responses)
                    })
                }
                .padding(.horizontal, 24)
                .padding(.top, 28)
                .padding(.bottom, 20)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
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

private struct CustomFocusGoal: Identifiable {
    let id = UUID()
    var title: String
    var iconName: String

    var displayTitle: String {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedTitle.isEmpty ? "Custom Focus" : trimmedTitle
    }
}

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

                    Text("Name the thing you want to return to when Disconnect interrupts a scroll.")
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
    @Environment(\.dismiss) private var dismiss
    @State private var selectedQuestions: Set<String> = ["timing"]
    @State private var customQuestion = ""

    private let questions = [
        TriggerQuestion(id: "timing", text: "Is this a good time to scroll, or are you avoiding something?"),
        TriggerQuestion(id: "three", text: "What are three things you could do in the next 10 minutes instead?"),
        TriggerQuestion(id: "future", text: "How will you feel about this session in an hour from now?"),
        TriggerQuestion(id: "reason", text: "Did you open this app for a specific reason or just out of habit?")
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

                    VStack(alignment: .leading, spacing: 16) {
                        Label("YOUR VOICE", systemImage: "pencil")
                            .font(.system(size: 13, weight: .heavy))
                            .tracking(1.0)
                            .foregroundStyle(DisconnectTheme.blue)

                        VStack(alignment: .leading, spacing: 14) {
                            HStack(spacing: 12) {
                                Image(systemName: "lightbulb")
                                    .font(.system(size: 19, weight: .semibold))
                                    .foregroundStyle(DisconnectTheme.blue)
                                    .frame(width: 38, height: 38)
                                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.blue.opacity(0.1)))

                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Create your own question")
                                        .font(.system(size: 14, weight: .heavy))
                                        .foregroundStyle(DisconnectTheme.ink)

                                    Text("Think of a prompt that will genuinely stop you in your tracks.")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundStyle(DisconnectTheme.mutedInk)
                                        .lineSpacing(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }

                            PlaceholderTextEditor(
                                text: $customQuestion,
                                placeholder: "e.g., Are you sure you're not just tired?"
                            )
                            .frame(height: 98)
                        }
                        .padding(18)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(DisconnectTheme.border, style: StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                        )
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 20)
            }

            BottomBar {
                NavigationLink(destination: IntentionSetupView()) {
                    Text("Next Step")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .simultaneousGesture(TapGesture().onEnded {
                    var responses = OnboardingResponseStore.load()
                    responses.selectedQuestions = questions
                        .filter { selectedQuestions.contains($0.id) }
                        .map(\.text)
                    responses.customQuestion = customQuestion
                    OnboardingResponseStore.save(responses)
                })
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
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
    }
}

struct IntentionSetupView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var primaryGoal = ""
    @State private var focusFeeling = ""
    @State private var tinyTask = ""
    @State private var scrollTemptation = ""
    @State private var scrollCost = ""
    @State private var accountabilityAnchor = ""
    @State private var bypassMinutes = OnboardingResponseStore.load().bypassMinutes
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
                            iconName: "heart",
                            question: "How will you feel if you stay focused and avoid doomscrolling today?",
                            placeholder: "e.g., I'll feel more productive and less anxious...",
                            text: $focusFeeling
                        )

                        IntentionCard(
                            iconName: "sparkles",
                            question: "What is a small task you can do in 5 minutes instead of scrolling?",
                            placeholder: "e.g., Drink water, stretch, or clear my desk...",
                            text: $tinyTask
                        )

                        IntentionCard(
                            iconName: "bolt.heart",
                            question: "What feeling or situation usually makes you open the app?",
                            placeholder: "e.g., I open it when I feel stuck, bored, lonely, or overwhelmed...",
                            text: $scrollTemptation
                        )

                        IntentionCard(
                            iconName: "arrow.down.forward",
                            question: "What does scrolling usually cost you afterward?",
                            placeholder: "e.g., I lose momentum, avoid my draft, and feel more behind...",
                            text: $scrollCost
                        )

                        IntentionCard(
                            iconName: "person.crop.circle.badge.checkmark",
                            question: "Who or what should Disconnect remind you you are doing this for?",
                            placeholder: "e.g., Future me, my draft, my health, my family...",
                            text: $accountabilityAnchor
                        )
                    }

                    BreakDurationCard(selectedMinutes: $bypassMinutes)

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
                NavigationLink(destination: ProductivityConnectOnboardingView()) {
                    Text("Continue")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .simultaneousGesture(TapGesture().onEnded {
                    saveIntentions()
                })

                Text("One optional connection step remains.")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
                    .padding(.top, 8)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
    }

    private func saveIntentions() {
        var responses = OnboardingResponseStore.load()
        responses.primaryGoal = primaryGoal.isEmpty ? OnboardingResponses.fallback.primaryGoal : primaryGoal
        responses.focusFeeling = focusFeeling.isEmpty ? OnboardingResponses.fallback.focusFeeling : focusFeeling
        responses.tinyTask = tinyTask.isEmpty ? OnboardingResponses.fallback.tinyTask : tinyTask
        responses.scrollTemptation = scrollTemptation.isEmpty ? OnboardingResponses.fallback.scrollTemptation : scrollTemptation
        responses.scrollCost = scrollCost.isEmpty ? OnboardingResponses.fallback.scrollCost : scrollCost
        responses.accountabilityAnchor = accountabilityAnchor.isEmpty ? OnboardingResponses.fallback.accountabilityAnchor : accountabilityAnchor
        responses.bypassMinutes = bypassMinutes
        responses.aiFrictionStyle = aiFrictionStyle
        responses.aiTone = aiTone
        responses.persuasionStyle = persuasionStyle
        OnboardingResponseStore.save(responses)
    }
}

private struct ProductivityConnectOnboardingView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var productivityService = AppleProductivityContextService()

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: "CONNECT PLAN", showsBackButton: true) {
                dismiss()
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    HStack {
                        Text("OPTIONAL")
                            .font(.system(size: 11, weight: .heavy))
                            .tracking(1.1)
                            .foregroundStyle(DisconnectTheme.green)

                        Spacer()

                        ProgressPills(activeIndex: 4)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Make nudges point somewhere real.")
                            .font(.system(size: 25, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.ink)
                            .fixedSize(horizontal: false, vertical: true)

                        Text("Disconnect can look at your next Apple Calendar event or Reminder, then turn a scroll interruption into a specific next step.")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(DisconnectTheme.mutedInk)
                            .lineSpacing(5)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(spacing: 14) {
                        OnboardingProductivityRow(
                            iconName: "calendar",
                            title: "Apple Calendar",
                            detail: "Example nudge: prepare for Biology review.",
                            state: productivityService.snapshot.calendarAccess
                        ) {
                            Task {
                                await productivityService.requestCalendarAccess()
                            }
                        }

                        OnboardingProductivityRow(
                            iconName: "checklist",
                            title: "Apple Reminders",
                            detail: "Example nudge: start your scholarship draft.",
                            state: productivityService.snapshot.remindersAccess
                        ) {
                            Task {
                                await productivityService.requestReminderAccess()
                            }
                        }
                    }

                    InsightCallout(text: "This is optional. Event and reminder titles stay on your phone and are used only to make the next nudge more specific.")
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 20)
            }

            BottomBar {
                NavigationLink(destination: SetupCompleteView()) {
                    Text("Finish Setup")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())

                NavigationLink(destination: SetupCompleteView()) {
                    Text("Skip for now")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 10)
                }
                .buttonStyle(.plain)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            productivityService.refreshAuthorizationStatus()
        }
    }
}

private struct OnboardingProductivityRow: View {
    let iconName: String
    let title: String
    let detail: String
    let state: ProductivityContextSnapshot.AccessState
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: iconName)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 44, height: 44)
                    .background(RoundedRectangle(cornerRadius: 10).fill(DisconnectTheme.green.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text(title)
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text(state == .authorized ? "Connected" : detail)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(state == .authorized ? DisconnectTheme.green : DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                }

                Spacer(minLength: 0)

                Image(systemName: state == .authorized ? "checkmark.circle.fill" : "plus.circle")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(state == .authorized ? DisconnectTheme.green : DisconnectTheme.mutedInk)
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(state == .authorized ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1.2))
            .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
        .disabled(state == .authorized)
    }
}

private struct BreakDurationCard: View {
    @Binding var selectedMinutes: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
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

                    Text("If you open anyway, Disconnect will pause you again after this many minutes.")
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
        .padding(20)
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

                    Text("Disconnect adapts the prompt using your goal, feeling, and replacement task.")
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
            subtitle: "Choose how strongly Disconnect should talk to you during a break.",
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
        protectedSelection.applicationTokens.count + protectedSelection.categoryTokens.count + protectedSelection.webDomainTokens.count
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

                        Text("Disconnect is now standing guard\nover your digital focus.")
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
                            Text("Close Disconnect")
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
            ("1", "Close Disconnect", "Tap the button below to minimize this app\nand return to your home screen."),
            (
                "2",
                "Try a Protected App",
                hasProtectedSelection
                    ? "Open one of your selected apps or websites\nto see how Disconnect intervenes."
                    : "Choose at least one app, website, or category\nso Disconnect has something to guard."
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

struct DashboardView: View {
    @State private var selectedTab: DashboardSection = .stats

    var body: some View {
        VStack(spacing: 0) {
            DisconnectHeaderBar(title: selectedTab.title, showsLogo: selectedTab == .stats)

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
            .padding(.horizontal, 30)
            .padding(.top, 12)
            .padding(.bottom, 14)
            .background(Color.white)
            .overlay(alignment: .top) {
                Rectangle().fill(DisconnectTheme.border).frame(height: 1)
            }
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
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

private struct DashboardFeedbackView: View {
    @State private var responses = OnboardingResponseStore.load()
    @State private var selection = AppSelectionStore.load()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Tell us what actually worked.")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("Rate nudges, send feedback, or opt into a quick interview. This is where we learn what makes Disconnect stronger.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }

                FeedbackLabCard(responses: responses, selection: selection)
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            .padding(.bottom, 24)
        }
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
            VStack(spacing: 22) {
                VictoryCard(metrics: metrics)
                ScreenTimeUsageCard()
                WeeklyProgressCard(data: metrics.weeklySavedTime)
                InsightsSection(metrics: metrics)
                MomentumCard(metrics: metrics)
            }
            .padding(.horizontal, 24)
            .padding(.top, 18)
            .padding(.bottom, 24)
        }
        .onAppear {
            metrics = DashboardMetrics.load()
        }
    }
}

private struct ScreenTimeUsageCard: View {
    @State private var context: DeviceActivityReport.Context = .totalActivity
    @State private var filter = ScreenTimeUsageCard.makeFilter()
    @State private var hasProtectedSelection = ScreenTimeUsageCard.hasProtectedSelection()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "hourglass")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.blue)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.blue.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Actual Screen Time")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("Today on protected apps")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                }

                Spacer(minLength: 0)
            }

            if hasProtectedSelection {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Waiting for Screen Time data")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("This fills in after iOS returns activity for your protected apps. Until then, your saved-time stats below still come from real shield choices.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .fixedSize(horizontal: false, vertical: true)

                    DeviceActivityReport(context, filter: filter)
                        .frame(maxWidth: .infinity, minHeight: 70, alignment: .leading)
                        .background(Color.white)
                        .allowsHitTesting(false)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    Text("No protected apps selected")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("Choose apps in Settings to show real Screen Time here.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                }
                .frame(maxWidth: .infinity, minHeight: 86, alignment: .leading)
            }

            Text("Screen Time is reported by Apple's DeviceActivity extension.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(DisconnectTheme.mutedInk)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        .onAppear {
            filter = Self.makeFilter()
            hasProtectedSelection = Self.hasProtectedSelection()
        }
    }

    private static func makeFilter() -> DeviceActivityFilter {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        let end = Date()
        let selection = AppSelectionStore.load()

        return DeviceActivityFilter(
            segment: .daily(during: DateInterval(start: start, end: end)),
            users: .all,
            devices: .init([.iPhone, .iPad]),
            applications: selection.applicationTokens,
            categories: selection.categoryTokens,
            webDomains: selection.webDomainTokens
        )
    }

    private static func hasProtectedSelection() -> Bool {
        let selection = AppSelectionStore.load()
        return !selection.applicationTokens.isEmpty
            || !selection.categoryTokens.isEmpty
            || !selection.webDomainTokens.isEmpty
    }
}

extension DeviceActivityReport.Context {
    static let totalActivity = Self("Total Activity")
}

private struct VictoryCard: View {
    let metrics: DashboardMetrics

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Image(systemName: "shield.checkered")
                    .font(.system(size: 13, weight: .bold))
                Text("TODAY'S VICTORY")
                    .font(.system(size: 12, weight: .heavy))
                    .tracking(1)
            }
            .foregroundStyle(DisconnectTheme.green)

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(metrics.todaySavedText)
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                Text("Saved")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }

            Text(metrics.reclaimedWakingHoursText)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(DisconnectTheme.mutedInk)
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)

            Text(metrics.yesterdayDeltaText)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(DisconnectTheme.ink)
                .padding(.top, 12)
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 15).fill(DisconnectTheme.green.opacity(0.09)))
        .overlay(RoundedRectangle(cornerRadius: 15).stroke(DisconnectTheme.green.opacity(0.2), lineWidth: 1))
    }
}

private struct WeeklyProgressCard: View {
    let data: [DailySavedTime]

    private var maxMinutes: Int {
        max(data.map(\.minutes).max() ?? 0, 1)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Weekly Progress")
                        .font(.system(size: 16, weight: .heavy))
                    Text("Saved time per day (minutes)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                }

                Spacer()

                Text("Last 7 Days")
                    .font(.system(size: 12, weight: .medium))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(DisconnectTheme.border, lineWidth: 1))
            }
            .foregroundStyle(DisconnectTheme.ink)

            HStack(alignment: .bottom, spacing: 13) {
                ForEach(data) { item in
                    VStack(spacing: 8) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(DisconnectTheme.green)
                            .frame(height: barHeight(for: item.minutes))
                        Text(item.label)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(DisconnectTheme.ink)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 200, alignment: .bottom)
        }
        .padding(24)
        .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }

    private func barHeight(for minutes: Int) -> CGFloat {
        guard minutes > 0 else { return 16 }
        return max(16, CGFloat(minutes) / CGFloat(maxMinutes) * 190)
    }
}

private struct InsightsSection: View {
    let metrics: DashboardMetrics

    var body: some View {
        VStack(spacing: 14) {
            HStack {
                Text("INSIGHTS")
                    .font(.system(size: 13, weight: .heavy))
                    .tracking(1)
                    .foregroundStyle(DisconnectTheme.mutedInk)
                Spacer()
                NavigationLink(destination: InsightsDetailView()) {
                    Text("View All ↗")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.green)
                }
            }

            InsightRow(iconName: "target", title: "Focus Rate", subtitle: "Closed instead of opening", value: "\(metrics.intentionalOpeningRate)%")
            InsightRow(iconName: "iphone", title: "Top Avoided", subtitle: metrics.topAvoidedAppName, value: "\(metrics.topAvoidedCount)x")
            InsightRow(iconName: "medal", title: "Interventions", subtitle: "Real shield decisions", value: "\(metrics.totalInterventions)")
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
            Image(systemName: "arrow.up.right")
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(DisconnectTheme.ink)
                .frame(width: 50, height: 50)
                .background(Circle().fill(DisconnectTheme.green))

            VStack(alignment: .leading, spacing: 4) {
                Text("Keep the momentum!")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                Text(metrics.weeklyMomentumText)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.green.opacity(0.09)))
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
                    .font(.system(size: 10, weight: isActive ? .heavy : .medium))
            }
            .foregroundStyle(isActive ? DisconnectTheme.ink : DisconnectTheme.mutedInk)
            .frame(width: 62, height: 48)
        }
        .buttonStyle(.plain)
    }
}

private struct DashboardHistoryView: View {
    @State private var sessions = InterventionHistoryStore.load()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Recent interventions")
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)

                if sessions.isEmpty {
                    InsightCallout(text: "Your real interventions will appear here after you respond to a Disconnect shield.")
                } else {
                    ForEach(sessions) { session in
                        HistorySessionRow(session: session)
                    }

                    InsightCallout(text: "History now comes from real shield decisions. Full Screen Time duration reports can be added later with a DeviceActivity report extension.")
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            .padding(.bottom, 24)
        }
        .onAppear {
            sessions = InterventionHistoryStore.load()
        }
    }
}

private struct HistorySessionRow: View {
    let session: InterventionHistoryEvent

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: session.savedMinutes == 0 ? "arrow.uturn.right" : "checkmark")
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(session.savedMinutes == 0 ? DisconnectTheme.subtleInk : DisconnectTheme.green)
                .frame(width: 42, height: 42)
                .background(Circle().fill(DisconnectTheme.softBackground))

            VStack(alignment: .leading, spacing: 5) {
                Text(session.appName)
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                Text(session.decision.label)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
                Text(historyDateFormatter.localizedString(for: session.date, relativeTo: Date()))
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(DisconnectTheme.subtleInk)
            }

            Spacer()

            Text("\(session.savedMinutes)m")
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(session.savedMinutes == 0 ? DisconnectTheme.subtleInk : DisconnectTheme.green)
        }
        .padding(18)
        .background(RoundedRectangle(cornerRadius: 10).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }

    private var historyDateFormatter: RelativeDateTimeFormatter {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter
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
            VStack(alignment: .leading, spacing: 18) {
                Text("Protection")
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)

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

                SettingsInfoRow(
                    iconName: "timer",
                    title: "Break Length",
                    detail: "\(responses.bypassMinutes) minutes, with friction returning after the break"
                )

                BreakDurationCard(selectedMinutes: breakMinutesBinding)

                AIFrictionStyleCard(selectedStyle: frictionStyleBinding)

                AIToneCard(selectedTone: aiToneBinding)

                PersuasionStyleCard(selectedStyle: persuasionStyleBinding)

                PersonalizedFrictionProfileCard(
                    scrollTemptation: scrollTemptationBinding,
                    scrollCost: scrollCostBinding,
                    accountabilityAnchor: accountabilityAnchorBinding
                )

                AppleProductivityContextCard(service: productivityService)

                Button {
                    DatabaseService.shared.logEvent("edit_protected_apps_tapped")
                    Task {
                        await editProtectedApps()
                    }
                } label: {
                    Label("Edit Protected Apps", systemImage: "slider.horizontal.3")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())

                Button {
                    DatabaseService.shared.logEvent("protection_turned_off")
                    ShieldStoreController().removeAllShields()
                    AppSelectionStore.clear()
                    selection = FamilyActivitySelection()
                    DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
                } label: {
                    Label("Turn Off Protection", systemImage: "shield.slash")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.red.opacity(0.08)))
                }
                .buttonStyle(.plain)

                Text("Dashboard stats now use real Disconnect shield decisions. Full Apple Screen Time duration totals require a DeviceActivity report extension.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 6)
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            .padding(.bottom, 24)
        }
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
        let appCount = selection.applicationTokens.count
        let categoryCount = selection.categoryTokens.count
        let webCount = selection.webDomainTokens.count
        let total = appCount + categoryCount + webCount
        return total == 0 ? "No apps, websites, or categories selected yet" : "\(total) app\(total == 1 ? "" : "s"), website\(total == 1 ? "" : "s"), or categor\(total == 1 ? "y" : "ies") selected"
    }

    private var breakMinutesBinding: Binding<Int> {
        Binding(
            get: { responses.bypassMinutes },
            set: { newValue in
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
                responses.persuasionStyle = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
                DatabaseService.shared.logEvent("setting_changed", properties: ["setting": "persuasion_style", "value": newValue])
                DatabaseService.shared.syncUserProfile(responses: responses, selection: selection)
            }
        )
    }

    private var scrollTemptationBinding: Binding<String> {
        Binding(
            get: { responses.scrollTemptation },
            set: { newValue in
                responses.scrollTemptation = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
            }
        )
    }

    private var scrollCostBinding: Binding<String> {
        Binding(
            get: { responses.scrollCost },
            set: { newValue in
                responses.scrollCost = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
            }
        )
    }

    private var accountabilityAnchorBinding: Binding<String> {
        Binding(
            get: { responses.accountabilityAnchor },
            set: { newValue in
                responses.accountabilityAnchor = newValue
                OnboardingResponseStore.save(responses)
                ShieldStoreController().shieldSelectedApps()
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

private struct PersonalizedFrictionProfileCard: View {
    @Binding var scrollTemptation: String
    @Binding var scrollCost: String
    @Binding var accountabilityAnchor: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.green.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Personal friction profile")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("These answers give Disconnect sharper context for the last push and reminder messages.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            CompactPromptEditor(
                title: "What pulls you into the app?",
                placeholder: "Boredom, avoidance, stress, needing a quick escape...",
                text: $scrollTemptation
            )

            CompactPromptEditor(
                title: "What does it cost afterward?",
                placeholder: "Lost momentum, feeling behind, not finishing the thing...",
                text: $scrollCost
            )

            CompactPromptEditor(
                title: "Who or what is this for?",
                placeholder: "Future me, my draft, my health, my family...",
                text: $accountabilityAnchor
            )
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

private struct AppleProductivityContextCard: View {
    @ObservedObject var service: AppleProductivityContextService

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "calendar.badge.clock")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.green)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.green.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Productivity context")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("Use Apple Calendar and Reminders to make nudges point back to the next real task.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                }
            }

            VStack(spacing: 10) {
                ProductivityAccessRow(
                    iconName: "calendar",
                    title: "Apple Calendar",
                    status: statusText(service.snapshot.calendarAccess),
                    actionTitle: actionTitle(service.snapshot.calendarAccess),
                    isBusy: service.isRefreshing
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
                    isBusy: service.isRefreshing
                ) {
                    Task {
                        await service.requestReminderAccess()
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Next nudge context")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)

                Text(contextPreview)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(service.snapshot.hasUsefulContext ? DisconnectTheme.ink : DisconnectTheme.mutedInk)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 10).fill(DisconnectTheme.softBackground))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(DisconnectTheme.border, lineWidth: 1))
            }

            Button {
                Task {
                    await service.refreshContext()
                }
            } label: {
                HStack(spacing: 10) {
                    if service.isRefreshing {
                        ProgressView()
                            .tint(DisconnectTheme.ink)
                    } else {
                        Image(systemName: "arrow.clockwise")
                    }
                    Text(service.isRefreshing ? "Refreshing..." : "Refresh Context")
                }
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(DisconnectTheme.ink)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(RoundedRectangle(cornerRadius: 10).fill(DisconnectTheme.softBackground))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(DisconnectTheme.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .disabled(service.isRefreshing)

            if let errorMessage = service.errorMessage {
                Text(errorMessage)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.red)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }

    private var contextPreview: String {
        if !service.snapshot.contextKind.isEmpty, !service.snapshot.contextTitle.isEmpty, !service.snapshot.actionLine.isEmpty {
            return "\(service.snapshot.contextKind.capitalized): \(service.snapshot.contextTitle)\nAction: \(service.snapshot.actionLine)"
        }
        if !service.snapshot.actionLine.isEmpty {
            return "Action: \(service.snapshot.actionLine)"
        }
        return service.snapshot.summaryLine
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
    let action: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(DisconnectTheme.green)
                .frame(width: 34, height: 34)
                .background(Circle().fill(DisconnectTheme.green.opacity(0.1)))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                Text(status)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }

            Spacer()

            Button(action: action) {
                Text(actionTitle)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(actionTitle == "Connected" ? DisconnectTheme.green : DisconnectTheme.ink)
                    .padding(.horizontal, 12)
                    .frame(height: 34)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(actionTitle == "Connected" ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .disabled(actionTitle == "Connected" || isBusy)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10).fill(DisconnectTheme.softBackground))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(DisconnectTheme.border, lineWidth: 1))
    }
}

private struct FeedbackLabCard: View {
    let responses: OnboardingResponses
    let selection: FamilyActivitySelection

    @State private var rating = 4
    @State private var feedbackText = ""
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
                Image(systemName: "quote.bubble")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DisconnectTheme.blue)
                    .frame(width: 38, height: 38)
                    .background(RoundedRectangle(cornerRadius: 9).fill(DisconnectTheme.blue.opacity(0.1)))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Feedback lab")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DisconnectTheme.ink)

                    Text("Optional. Help us sharpen the nudges and find people for follow-up interviews.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DisconnectTheme.mutedInk)
                        .lineSpacing(3)
                }
            }

            VStack(alignment: .leading, spacing: 12) {
                Text("How useful was your last nudge?")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)

                HStack(spacing: 8) {
                    ForEach(1...5, id: \.self) { value in
                        Button {
                            rating = value
                        } label: {
                            Image(systemName: value <= rating ? "star.fill" : "star")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(value <= rating ? DisconnectTheme.green : DisconnectTheme.subtleInk)
                                .frame(maxWidth: .infinity)
                                .frame(height: 42)
                                .background(RoundedRectangle(cornerRadius: 8).fill(value <= rating ? DisconnectTheme.green.opacity(0.1) : Color.white))
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(value <= rating ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }

                PlaceholderTextEditor(
                    text: $feedbackText,
                    placeholder: "What felt helpful, annoying, too soft, or worth improving?"
                )
                .frame(height: 92)

                Button {
                    submitFeedback()
                } label: {
                    statusLabel(title: "Send Feedback", systemImage: "paperplane.fill", status: feedbackStatus)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(!canSubmitFeedback || feedbackStatus.isSubmitting)
                .opacity(canSubmitFeedback ? 1 : 0.55)
            }

            Divider()

            Toggle(isOn: $researchConsent.animation(.easeInOut(duration: 0.2))) {
                Text("I am open to a quick follow-up interview")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(DisconnectTheme.ink)
            }
            .tint(DisconnectTheme.green)

            if researchConsent {
                VStack(alignment: .leading, spacing: 12) {
                    FeedbackTextField(title: "Name", placeholder: "Your name", text: $name)
                    FeedbackTextField(title: "Contact", placeholder: "Email or phone", text: $contact)
                    FeedbackTextField(title: "Biggest distraction", placeholder: "Instagram, TikTok, late-night scrolling...", text: $biggestDistraction)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Which best describes you?")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(DisconnectTheme.ink)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(userTypes, id: \.self) { type in
                                    Button {
                                        userType = type
                                    } label: {
                                        Text(type)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(userType == type ? Color.white : DisconnectTheme.ink)
                                            .padding(.horizontal, 14)
                                            .frame(height: 36)
                                            .background(RoundedRectangle(cornerRadius: 8).fill(userType == type ? DisconnectTheme.green : Color.white))
                                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(userType == type ? DisconnectTheme.green : DisconnectTheme.border, lineWidth: 1))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    PlaceholderTextEditor(
                        text: $researchNotes,
                        placeholder: "Anything we should ask you about? Optional."
                    )
                    .frame(height: 74)

                    Button {
                        submitResearchOptIn()
                    } label: {
                        statusLabel(title: "Join Interview List", systemImage: "person.crop.circle.badge.checkmark", status: researchStatus)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(!canSubmitResearch || researchStatus.isSubmitting)
                    .opacity(canSubmitResearch ? 1 : 0.55)
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            if let message = statusMessage {
                Text(message)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(statusMessageColor)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }

    private var canSubmitFeedback: Bool {
        !feedbackText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var canSubmitResearch: Bool {
        !contact.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var statusMessage: String? {
        switch (feedbackStatus, researchStatus) {
        case (.success, _), (_, .success):
            return "Saved. Thank you for helping shape Disconnect."
        case (.failure(let message), _), (_, .failure(let message)):
            return message
        default:
            return nil
        }
    }

    private var statusMessageColor: Color {
        if case .failure = feedbackStatus { return .red }
        if case .failure = researchStatus { return .red }
        return DisconnectTheme.green
    }

    private func statusLabel(title: String, systemImage: String, status: FeedbackSubmissionState) -> some View {
        HStack(spacing: 10) {
            if status.isSubmitting {
                ProgressView()
                    .tint(DisconnectTheme.ink)
            } else {
                Image(systemName: systemImage)
            }
            Text(status.isSubmitting ? "Sending..." : title)
        }
        .frame(maxWidth: .infinity)
    }

    private func submitFeedback() {
        feedbackStatus = .submitting
        DatabaseService.shared.submitFeedback(
            rating: rating,
            message: feedbackText,
            context: "settings_feedback_lab",
            responses: responses
        ) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    feedbackText = ""
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

private struct FeedbackTextField: View {
    let title: String
    let placeholder: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(DisconnectTheme.ink)

            TextField(placeholder, text: $text)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(DisconnectTheme.ink)
                .textInputAutocapitalization(.words)
                .padding(.horizontal, 12)
                .frame(height: 48)
                .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(DisconnectTheme.border, lineWidth: 1))
        }
    }
}

private struct CompactPromptEditor: View {
    let title: String
    let placeholder: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(DisconnectTheme.ink)

            PlaceholderTextEditor(text: $text, placeholder: placeholder)
                .frame(height: 72)
        }
    }
}

private struct SettingsInfoRow: View {
    let iconName: String
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: iconName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(DisconnectTheme.green)
                .frame(width: 42, height: 42)
                .background(Circle().fill(DisconnectTheme.green.opacity(0.1)))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(DisconnectTheme.ink)
                Text(detail)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(DisconnectTheme.mutedInk)
            }

            Spacer()
        }
        .padding(18)
        .background(RoundedRectangle(cornerRadius: 10).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(DisconnectTheme.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
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

                    InsightCallout(text: "These insights are based on real Disconnect shield choices. Apple Screen Time duration totals can be added with a DeviceActivity report extension.")
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

enum DisconnectTheme {
    static let green = Color(red: 0.13, green: 0.79, blue: 0.33)
    static let blue = Color(red: 0.16, green: 0.49, blue: 1.0)
    static let orange = Color(red: 1.0, green: 0.52, blue: 0.13)
    static let pink = Color(red: 1.0, green: 0.18, blue: 0.47)
    static let ink = Color(red: 0.09, green: 0.11, blue: 0.14)
    static let mutedInk = Color(red: 0.29, green: 0.33, blue: 0.42)
    static let subtleInk = Color(red: 0.55, green: 0.59, blue: 0.66)
    static let border = Color(red: 0.88, green: 0.9, blue: 0.93)
    static let softBackground = Color(red: 0.985, green: 0.987, blue: 0.992)
}

#Preview("Welcome") {
    ContentView()
}

#Preview("Did You Know") {
    NavigationStack {
        DidYouKnowView()
    }
}
