import Foundation

struct StoredStudyEvent: Decodable {
    struct Properties: Decodable {
        let session_id: String?
        let used_minutes: String?
        let extra: String?
        enum CodingKeys: String,CodingKey { case session_id,used_minutes,extra }
        init(from decoder: Decoder) throws {
            let values = try decoder.container(keyedBy:CodingKeys.self)
            func text(_ key: CodingKeys) -> String? {
                if let value = try? values.decode(String.self,forKey:key) { return value }
                if let value = try? values.decode(Int.self,forKey:key) { return String(value) }
                if let value = try? values.decode(Bool.self,forKey:key) { return String(value) }
                return nil
            }
            session_id = text(.session_id); used_minutes = text(.used_minutes); extra = text(.extra)
        }
    }
    let id: UUID
    let event_name: String
    let occurred_at: Date
    let properties: Properties
}

/// Built only from authenticated rows read BACK from Supabase, never local ledgers.
struct VerifiedStudyProgress: Codable {
    static let storageKey = "disconnect.verifiedCloudProgress.v1"
    var selectedAppMinutes = 0
    var sessionsStarted = 0
    var sessionsEnded = 0
    var extraSessions = 0
    var nudgeRequests = 0
    var shieldQuitChoices = 0
    var shieldContinueChoices = 0
    var nudgeEndChoices = 0
    var disconnectVisits = 0
    var eventsRead = 0
    var feedbackEntries: Int? = nil
    var firstActivityAt: Date?
    var lastActivityAt: Date?
    var verifiedAt = Date()

    init(events: [StoredStudyEvent]) {
        var seen = Set<UUID>(), minutesBySession: [String:Int] = [:]
        let samples: Set<String> = ["session_checkpoint","session_snapshot","session_ended","session_expired"]
        for event in events where seen.insert(event.id).inserted {
            eventsRead += 1
            firstActivityAt = min(firstActivityAt ?? event.occurred_at,event.occurred_at)
            lastActivityAt = max(lastActivityAt ?? event.occurred_at,event.occurred_at)
            switch event.event_name {
            case "session_started":
                sessionsStarted += 1
                if event.properties.extra == "true" { extraSessions += 1 }
            case "session_ended": sessionsEnded += 1
            case "nudge_requested": nudgeRequests += 1
            case "shield_quit_chosen": shieldQuitChoices += 1
            case "shield_continue_chosen": shieldContinueChoices += 1
            case "nudge_end_session": nudgeEndChoices += 1
            case "app_visit_started": disconnectVisits += 1
            default: break
            }
            if samples.contains(event.event_name), let session = event.properties.session_id, !session.isEmpty,
               let raw = event.properties.used_minutes,
               raw.range(of:"^[0-9]{1,3}$",options:.regularExpression) != nil, let minutes = Int(raw) {
                minutesBySession[session] = max(minutesBySession[session] ?? 0,min(240,minutes))
            }
        }
        selectedAppMinutes = minutesBySession.values.reduce(0,+)
    }
    static func load() -> Self? {
        guard let data = ShieldPresentationStore.defaults.data(forKey:storageKey) else { return nil }
        return try? JSONDecoder().decode(Self.self,from:data)
    }
}
