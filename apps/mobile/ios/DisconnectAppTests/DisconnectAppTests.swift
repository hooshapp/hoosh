import Testing
import Foundation
@testable import DisconnectApp

struct DisconnectAppTests {
    @Test func enrollmentValidatesContact() throws {
        let person=try StudyParticipant(name:" QA Participant ",email:" qa@example.invalid ")
        #expect(person.name=="QA Participant")
        #expect(throws: StudyParticipant.ValidationError.self) { try StudyParticipant(name:"QA",email:"bad") }
    }
    @Test func freshAccountCannotInheritLegacyCompletion() throws {
        let domain="qa.workspace."+UUID().uuidString
        let defaults=UserDefaults(suiteName:domain)!
        defer { defaults.removePersistentDomain(forName:domain) }
        defaults.set(true,forKey:"onboardingCompleted")
        let workspace=AccountWorkspace(defaults:defaults,domain:domain)
        try workspace.activate("QA-A")
        #expect(!workspace.completed(for:"QA-A"))
        defaults.set(true,forKey:"onboardingCompleted")
        try workspace.activate("QA-A")
        #expect(workspace.completed(for:"QA-A"))
        try workspace.activate("QA-B")
        #expect(!workspace.completed(for:"QA-B"))
    }
    @Test func groupedRemindersAndBalancedSources() {
        let now=Date()
        let context=LocalProductivityNudge.selectReminders([
            .init(title:"Laundry",dueAt:now.addingTimeInterval(-60)),
            .init(title:"Read",dueAt:now.addingTimeInterval(-30))],now:now)!
        #expect(context.messages(now:now).first=="Overdue: Laundry, Read. Get started on these.")
        var next=false
        let one=BalancedNudgeSelection.choose(questionnaire:["Pause and choose."],context:context.messages(now:now),recent:[],nextContext:&next)
        let two=BalancedNudgeSelection.choose(questionnaire:["Pause and choose."],context:context.messages(now:now),recent:[],nextContext:&next)
        #expect(one.source=="questionnaire" && two.source=="productivity_context")
    }
    @Test func minuteThresholdsAreQuarterSessionUsage() {
        #expect(AppSessionPolicy.nudgeMinutes(duration:30)==[8,15,23])
        #expect(AppSessionPolicy.nudgeMinutes(duration:5)==[2,3,4])
    }
}
