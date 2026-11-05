import Foundation

/// A durable cache of the owner's server-confirmed choices plus unsynced choices.
/// No usage report data, calendar titles, credentials or Apple tokens are stored here.
enum HistoryTurnOffStore {
    private struct Cache:Codable { var owner:UUID;var events:[HistoryTurnOff];var updatedAt:Date;var coverageStart:Date }
    private static let key="disconnect.historyTurnOffs.v1"
    static let names:Set<String>=["shield_quit_chosen","nudge_end_session"]
    static func save(events:[StoredStudyEvent],owner:UUID,coverageStart:Date = .distantPast) throws {
        let choices=events.filter { names.contains($0.event_name) }.map {
            HistoryTurnOff(id:$0.id,date:$0.occurred_at,sessionID:$0.event_name=="nudge_end_session" ? $0.properties.session_id : nil)
        }
        let cache=Cache(owner:owner,events:choices,updatedAt:Date(),coverageStart:coverageStart)
        ShieldPresentationStore.defaults.set(try JSONEncoder().encode(cache),forKey:key)
    }
    static func load() -> (events:[HistoryTurnOff],verifiedAt:Date?,coverageStart:Date?) {
        let defaults=ShieldPresentationStore.defaults
        guard let raw=defaults.string(forKey:AccountWorkspace.ownerKey),let owner=UUID(uuidString:raw),
              defaults.string(forKey:NativeResearchQueue.userKey)==raw else { return ([],nil,nil) }
        let cache=defaults.data(forKey:key).flatMap { try? JSONDecoder().decode(Cache.self,from:$0) }
        let own=cache?.owner==owner ? cache : nil
        let formatter=ISO8601DateFormatter()
        let pending=NativeResearchQueue.pending(for:owner).compactMap { entry -> HistoryTurnOff? in
            let event=entry.1
            guard names.contains(event.event_name),let date=formatter.date(from:event.occurred_at) else { return nil }
            return HistoryTurnOff(id:event.id,date:date,sessionID:event.event_name=="nudge_end_session" ? event.properties["session_id"] : nil)
        }
        return ((own?.events ?? [])+pending,own?.updatedAt,own?.coverageStart)
    }
}
