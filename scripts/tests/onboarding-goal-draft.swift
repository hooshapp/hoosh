import Foundation
@main struct GoalDraftChecks {
 static func main() throws {
    let domain="qa.goal-draft."+UUID().uuidString
    let defaults=UserDefaults(suiteName:domain)!
    defer { defaults.removePersistentDomain(forName:domain) }
    precondition(OnboardingGoalDraftStore.load(defaults:defaults)==nil)
    let custom=StudyCustomFocusGoal(title:" Finish thesis ",iconName:"pencil")
    let draft=OnboardingGoalDraft(presetIDs:["read","study"],customGoals:[custom],selectedCustomIDs:[custom.id])
    OnboardingGoalDraftStore.save(draft,defaults:defaults)
    let restored=OnboardingGoalDraftStore.load(defaults:defaults)!
    precondition(restored==draft && restored.customGoals[0].id==custom.id)
    precondition(restored.customGoals[0].displayTitle=="Finish thesis")
    defaults.set(Data([0,1,2]),forKey:OnboardingGoalDraftStore.key)
    precondition(OnboardingGoalDraftStore.load(defaults:defaults)==nil)
    precondition(defaults.data(forKey:OnboardingGoalDraftStore.key)==Data([0,1,2]),"Do not destroy a corrupt draft during a failed read")
    print("PASS: fresh draft, preset/custom selections, stable custom goal identity, typed text restoration and non-destructive corrupt-data handling")
 }
}
