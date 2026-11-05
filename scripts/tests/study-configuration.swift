import Foundation
// Standalone test compiles the real onboarding model; no on-device capture here.
enum StudyConfigurationHistory { static func capture(reason: String) {}; static func scheduleCapture(reason: String) {} }
@main struct ConfigurationRecordChecks {
    static func main() throws {
        var answers=OnboardingResponses.fallback
        answers.primaryGoal="Read more books"
        answers.customQuestion="A deliberately long personal answer remains complete in research storage."
        let snapshot=StudyConfigurationSnapshot(preferences:answers,
            plan:[StudyPlanEntry(localRuleID:"synthetic-rule",appLabel:"Instagram",dailyMinutes:30,sessionMinutes:15)],onboardingCompleted:true)
        let encoder=JSONEncoder();encoder.outputFormatting=[.sortedKeys]
        let owner=UUID()
        let record=StudyConfigurationRecord(user_id:owner,reason:"daily_limit_changed",snapshot:try encoder.encode(snapshot))
        let body=try encoder.encode(record)
        let json=try JSONSerialization.jsonObject(with:body) as! [String:Any]
        precondition(json["snapshot"] is [String:Any],"Cloud snapshot must be an object, not an opaque base64 Data blob")
        let restored=try JSONDecoder().decode(StudyConfigurationRecord.self,from:body)
        precondition(restored.id==record.id && restored.user_id==owner,"Offline retries keep stable identity and owner")
        let decoded=try JSONDecoder().decode(StudyConfigurationSnapshot.self,from:restored.snapshot)
        precondition(decoded.preferences.customQuestion==answers.customQuestion)
        precondition(decoded.plan[0].appLabel=="Instagram" && decoded.plan[0].dailyMinutes==30 && decoded.plan[0].sessionMinutes==15)
        precondition(!String(data:body,encoding:.utf8)!.contains("tokenData"),"Apple token data never belongs in researcher snapshots")
        var calendar=Calendar(identifier:.gregorian);calendar.timeZone=TimeZone(identifier:"America/New_York")!
        let date=calendar.date(from:DateComponents(year:2026,month:11,day:4))!
        precondition(StudyConfigurationDay.string(at:date,calendar:calendar)=="2026-11-04")
        print("PASS: typed named app plans, complete questionnaire text, JSON-object upload, offline retry identity, local dates and token-free configuration snapshots")
    }
}
