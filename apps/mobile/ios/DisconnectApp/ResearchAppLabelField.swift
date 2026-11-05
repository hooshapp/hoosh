import SwiftUI

struct ResearchAppLabelField: View {
    let ruleID: String
    @State private var label: String
    @State private var saved: String
    @State private var error = ""
    @FocusState private var focused: Bool
    init(ruleID: String,initialValue: String) {
        self.ruleID=ruleID;_label=State(initialValue:initialValue);_saved=State(initialValue:initialValue)
    }
    var body: some View {
        VStack(alignment:.leading,spacing:4) {
            TextField("App name for the study (e.g. Instagram)",text:$label)
                .modifier(DisconnectInputStyle())
                .focused($focused).submitLabel(.done)
                .onSubmit(save).onChange(of:focused) { active in if !active { save() } }.onDisappear(perform:save)
            Text("Use the app name shown above so the researcher can identify it. Apple’s private app token stays on your phone.")
                .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            if !error.isEmpty { Text(error).font(.caption).foregroundStyle(.red) }
        }
    }
    private func save() {
        let value=String(label.trimmingCharacters(in:.whitespacesAndNewlines).prefix(80))
        guard value != saved else { return }
        do {
            try DailyUsageMonitoring.setResearchLabel(value,for:ruleID)
            label=value;saved=value;error=""
            DatabaseService.shared.syncUserProfile(responses:OnboardingResponseStore.load())
        } catch { self.error="Could not save the app name. Please retry." }
    }
}
