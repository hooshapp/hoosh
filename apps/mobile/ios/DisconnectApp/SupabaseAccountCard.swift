import SwiftUI

struct SupabaseAccountCard: View {
    var isEntry = false
    @State private var email = ""
    @State private var password = ""
    @State private var account: String?
    @State private var busy = false
    @State private var participant: StudyParticipant?
    @State private var message = ""
    @State private var lastVerifiedSync: Date?
    @State private var savedProgress: VerifiedStudyProgress?
    @AppStorage(DatabaseService.statusKey, store: ShieldPresentationStore.defaults) private var syncStatus = ""

    var body: some View {
        VStack(alignment:.leading,spacing:12) {
            Label(isEntry ? "Your Hoosh account" : "Your account & data",systemImage:"person.crop.circle")
                .font(.system(size:17,weight:.heavy)).foregroundStyle(DisconnectTheme.ink)
            if let account {
                Label(participant == nil ? "Signed in" : "Study profile saved on this phone",systemImage:"checkmark.circle.fill").font(.subheadline)
                if let participant { Text(participant.name).font(.subheadline) }
                Text(account).font(.subheadline).textSelection(.enabled)
                Text("This phone's preferences and session events sync to your existing account. App selection tokens stay on this phone.")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
                Button(busy ? "Syncing…" : "Sync this phone's data") { sync() }.disabled(busy).frame(minHeight:44)
                if participant == nil {
                Button("Sign out") {
                    busy = true
                    Task {
                        await NativeSupabase.shared.signOut()
                        self.account = nil; email = ""; password = ""; message = "Signed out. Local protection remains active."
                        busy = false
                    }
                }.disabled(busy).frame(minHeight:44)
                } else {
                    Text("Your study profile resumes automatically on this phone. Contact the researcher before changing devices.")
                        .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
                }
            } else {
                Text("Sign in with the account you use in the newer app. Then complete your questionnaire and choose your daily allowances and session lengths.")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
                TextField("Account email",text:$email)
                    .textContentType(.username).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                    .modifier(DisconnectInputStyle()).disabled(busy)
                SecureField("Password",text:$password).textContentType(.password).modifier(DisconnectInputStyle()).disabled(busy)
                Button(busy ? "Signing in…" : "Sign in") {
                    busy = true; message = ""
                    Task {
                        defer { password = ""; busy = false }
                        do {
                            try await NativeSupabase.shared.signIn(email:email,password:password)
                            await reloadIdentity()
                            message = "Signed in. Opening your setup…"
                        } catch {
                            message = error.localizedDescription
                            ShieldPresentationStore.defaults.set(message,forKey:"disconnect.auth.lastError")
                        }
                    }
                }.disabled(busy || email.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty || password.isEmpty).frame(minHeight:44)
                Text("Use the newer app to create or recover your account. No new account is created here.")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            }
            if !message.isEmpty { Text(message).font(.caption).fixedSize(horizontal:false,vertical:true) }
            if account != nil && !syncStatus.isEmpty { Text(syncStatus).font(.caption).foregroundStyle(DisconnectTheme.mutedInk) }
            if account != nil, let lastVerifiedSync {
                Text("Last verified sync: \(lastVerifiedSync.formatted(date:.abbreviated,time:.shortened))")
                    .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            }
            if account != nil, let savedProgress {
                VStack(alignment:.leading,spacing:4) {
                    Text("Verified in the database").font(.system(size:13,weight:.bold))
                    Text("Selected-app usage: \(savedProgress.selectedAppMinutes) min")
                    Text("Sessions: \(savedProgress.sessionsStarted) started · \(savedProgress.sessionsEnded) ended")
                    Text("Nudge requests: \(savedProgress.nudgeRequests)")
                    Text("Shield choices: \(savedProgress.shieldQuitChoices) quit · \(savedProgress.shieldContinueChoices) continue")
                    Text("End session from a nudge: \(savedProgress.nudgeEndChoices)")
                    if let count=savedProgress.feedbackEntries { Text("Feedback entries saved: \(count)") }
                }.font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            }
            Text("Session events recorded offline wait on this phone until Hoosh is opened and sync succeeds.")
                .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
        }
        .padding(20).background(RoundedRectangle(cornerRadius:14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius:14).stroke(DisconnectTheme.border,lineWidth:1))
        .task { await reloadIdentity(); reloadSyncDate() }
        .onChange(of:syncStatus) { _ in reloadSyncDate() }
    }
    private func reloadSyncDate() {
        lastVerifiedSync = ShieldPresentationStore.defaults.object(forKey:DatabaseService.successKey) as? Date
        savedProgress = VerifiedStudyProgress.load()
    }
    private func reloadIdentity() async {
        participant = await NativeSupabase.shared.participant()
        if let value = await NativeSupabase.shared.identity() { account = value.1 ?? "Signed-in account" }
        else { account = nil }
    }
    private func sync() {
        busy = true; message = ""
        Task {
            defer { busy = false }
            do { try await DatabaseService.shared.syncNow(); message = "Preferences saved and read back successfully." }
            catch { message = error.localizedDescription }
        }
    }
}
