import Foundation
@main struct VerifiedProgressChecks {
    static func main() throws {
        func event(_ name: String, _ props: [String:Any] = [:], id: UUID = UUID()) -> [String:Any] {
            ["id":id.uuidString,"event_name":name,"occurred_at":"2026-11-04T15:24:50.123456+00:00","properties":props]
        }
        let repeated = event("nudge_requested")
        let fixture = [event("session_started",["extra":"false"]),
            event("session_checkpoint",["session_id":"a","used_minutes":"2"]),
            event("session_snapshot",["session_id":"a","used_minutes":"2"]),
            event("session_ended",["session_id":"a","used_minutes":"5"]),
            event("session_started",["extra":true]),event("session_ended",["session_id":"b","used_minutes":5]),
            repeated,repeated,event("shield_quit_chosen"),event("shield_continue_chosen"),event("nudge_end_session"),event("app_visit_started"),
            event("session_snapshot",["session_id":"bad","used_minutes":"-9"])]
        let decoded = try NudgeResponseDecoder.decode([StoredStudyEvent].self,from:JSONSerialization.data(withJSONObject:fixture))
        let progress = VerifiedStudyProgress(events:decoded)
        precondition(progress.selectedAppMinutes == 10,"Cumulative checkpoints must not add to final session duration")
        precondition(progress.sessionsStarted == 2 && progress.sessionsEnded == 2 && progress.extraSessions == 1)
        precondition(progress.nudgeRequests == 1,"Repeated stable event IDs must count once")
        precondition(progress.shieldQuitChoices == 1 && progress.shieldContinueChoices == 1 && progress.nudgeEndChoices == 1)
        precondition(progress.disconnectVisits == 1 && progress.eventsRead == fixture.count-1)
        precondition(progress.firstActivityAt != nil && progress.lastActivityAt != nil)
        let empty = VerifiedStudyProgress(events:[])
        precondition(empty.selectedAppMinutes == 0 && empty.firstActivityAt == nil)
        let persisted = try JSONDecoder().decode(VerifiedStudyProgress.self,from:JSONEncoder().encode(progress))
        precondition(persisted.selectedAppMinutes == 10)
        print("PASS: cloud-row decoding including Postgres timestamps, checkpoint/event deduplication, actual choices, extra time, empty state and sanitized summary persistence")
    }
}
