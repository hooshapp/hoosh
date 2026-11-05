import SwiftUI

extension Notification.Name {
    static let disconnectAccountChanged = Notification.Name("disconnectAccountChanged")
}

@MainActor final class NativeAppFlow: ObservableObject {
    enum Phase { case restoring, signedOut, onboarding, dashboard, failed }
    @Published private(set) var phase: Phase = .restoring
    @Published private(set) var errorMessage = ""
    @Published private(set) var needsStudyDetails = false
    @Published private(set) var loadingMessage = "Restoring your account…"
    @Published private(set) var navigationID = "restoring"
    private var refreshing = false
    private var workspace: AccountWorkspace {
        AccountWorkspace(defaults:ShieldPresentationStore.defaults,domain:ShieldPresentationStore.group)
    }
    func refresh() async {
        guard !refreshing else { return }
        refreshing = true
        defer { refreshing = false }
        guard let (id, _) = await NativeSupabase.shared.identity() else {
            NativeResearchQueue.setUser(nil)
            needsStudyDetails=false
            phase = .signedOut; navigationID = "signedOut"
            ShieldPresentationStore.defaults.set("signedOut",forKey:"disconnect.auth.status")
            ShieldPresentationStore.defaults.set("signedOut",forKey:"disconnect.auth.route")
            return
        }
        guard await NativeSupabase.shared.participant() != nil else {
            NativeResearchQueue.setUser(nil)
            needsStudyDetails=true
            phase = .signedOut;navigationID=id.uuidString+":studyDetails"
            return
        }
        needsStudyDetails=false
        do {
            let user = id.uuidString
            try workspace.validate(user)
            if workspace.owner == nil {
                for key in ["familyActivitySelection", "userCheckpoint"] where ShieldPresentationStore.defaults.data(forKey:key) == nil {
                    if let value = UserDefaults.standard.data(forKey:key) { ShieldPresentationStore.defaults.set(value,forKey:key) }
                }
            }
            if let previous = workspace.owner, previous != user {
                // Stop old callbacks/grants before changing any account-owned state.
                try PerAppProtection.stop()
                ShieldStoreController().removeAllShields()
            }
            try workspace.activate(user)
            NativeResearchQueue.setUser(id)
            let defaults=ShieldPresentationStore.defaults
            // Every account needs a matching server-confirmed receipt for this
            // registration gate. A legacy installation-wide flag cannot unlock it.
            if !StudyEnrollmentGate.isVerified(owner:user,defaults:defaults) {
                loadingMessage="Confirming your study registration…"
                phase = .restoring;navigationID=user+":confirmingEnrollment"
                do {
                    try await DatabaseService.shared.saveEnrollment(uploadEvents:false)
                } catch {
                    errorMessage="We couldn’t confirm your study registration in the database. Your details are saved on this phone. Connect to the internet and tap Retry account setup."
                    defaults.set(error.localizedDescription,forKey:DatabaseService.statusKey)
                    defaults.set("enrollmentPending",forKey:"disconnect.auth.route")
                    phase = .failed;navigationID=user+":enrollmentPending"
                    return
                }
            }
            guard await NativeSupabase.shared.identity()?.0==id else { return }
            StudyAppVisitTracker.shared.becameActive()
            Task {
                do { try await DatabaseService.shared.saveEnrollment() }
                catch { ShieldPresentationStore.defaults.set(error.localizedDescription,forKey:DatabaseService.statusKey) }
            }
            let completed = workspace.completed(for:user)
            navigationID = user + (completed ? ":dashboard" : ":onboarding")
            phase = completed ? .dashboard : .onboarding
            ShieldPresentationStore.defaults.set(completed ? "dashboard" : "onboarding",forKey:"disconnect.auth.route")
            if completed {
                DayTwoSettingsTipStore.startIfNeeded()
                ShieldStoreController().refreshShieldStateAfterInstallOrRun()
                // Sync is optional to using protection offline. It must not hold up routing.
                Task {
                    do { try await DatabaseService.shared.syncNow() }
                    catch { ShieldPresentationStore.defaults.set(error.localizedDescription,forKey:DatabaseService.statusKey) }
                }
                Task { await AppleProductivityContextService().refreshContext() }
            }
        } catch {
            errorMessage = "Your account settings could not be restored. They have been kept on this phone. Please retry."
            phase = .failed
            navigationID = "restoreFailed"
        }
    }
}
