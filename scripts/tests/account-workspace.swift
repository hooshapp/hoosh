import Foundation

@main struct AccountWorkspaceChecks {
    static func main() throws {
        let domain = "disconnect.tests.workspace." + UUID().uuidString
        let defaults = UserDefaults(suiteName:domain)!
        defer { defaults.removePersistentDomain(forName:domain) }
        let store = AccountWorkspace(defaults:defaults,domain:domain)
        try store.activate("A")
        precondition(!store.completed(for:"A"), "Fresh install must complete setup after sign-in")
        defaults.set(true,forKey:"onboardingCompleted")
        defaults.set(Data("A-private-answers".utf8),forKey:"onboardingResponses")
        defaults.set(Data("A-local-Apple-selection".utf8),forKey:"familyActivitySelection")
        defaults.set(5,forKey:"disconnect.sessionProgress.a")
        defaults.set("signedIn",forKey:"disconnect.auth.status")
        defaults.set("A",forKey:"disconnect.supabaseResearchUser")
        defaults.set("installation",forKey:"anonymousInstallID")
        try store.activate("A")
        precondition(store.completed(for:"A"))
        try store.activate("B")
        precondition(!store.completed(for:"B") && !store.completed(for:"A"))
        precondition(defaults.data(forKey:"onboardingResponses") == nil)
        precondition(defaults.data(forKey:"familyActivitySelection") == nil)
        precondition(defaults.integer(forKey:"disconnect.sessionProgress.a") == 0)
        precondition(defaults.string(forKey:"disconnect.auth.status") == "signedIn", "Auth diagnostics are not archived as user data")
        precondition(defaults.string(forKey:"anonymousInstallID") == "installation")
        defaults.set(Data("B-private-answers".utf8),forKey:"onboardingResponses")
        defaults.set("B",forKey:"disconnect.supabaseResearchUser")
        try store.activate("A")
        precondition(store.completed(for:"A"))
        precondition(defaults.data(forKey:"onboardingResponses") == Data("A-private-answers".utf8))
        precondition(defaults.data(forKey:"familyActivitySelection") == Data("A-local-Apple-selection".utf8))
        precondition(defaults.integer(forKey:"disconnect.sessionProgress.a") == 5)
        precondition(defaults.string(forKey:"disconnect.supabaseResearchUser") == "B", "Workspace restore must never silently reassign event ownership")
        try store.activate("B")
        precondition(defaults.data(forKey:"onboardingResponses") == Data("B-private-answers".utf8))
        defaults.set(Data([0,1,2]),forKey:AccountWorkspace.archivePrefix+"C")
        do { try store.validate("C"); fatalError("Corrupt archive accepted") } catch { }
        do { try store.activate("C"); fatalError("Corrupt archive activated") } catch { }
        precondition(store.owner == "B" && defaults.data(forKey:"onboardingResponses") == Data("B-private-answers".utf8), "Failed restore must not clear live data")
        defaults.removePersistentDomain(forName:domain)
        defaults.set(true,forKey:"onboardingCompleted")
        defaults.set(Data("legacy-plan".utf8),forKey:"disconnect.dailyAppRules.v1")
        try store.activate("legacy-owner")
        precondition(!store.completed(for:"legacy-owner"), "Unowned legacy completion must not skip a new participant questionnaire")
        precondition(defaults.data(forKey:"disconnect.dailyAppRules.v1") == Data("legacy-plan".utf8), "Keep legacy draft plan while requiring onboarding")
        print("PASS: fresh-install setup gate, legacy completion rejection, account isolation/restoration, retained local selection/usage, independent research ownership, corrupt-archive recovery")
    }
}
