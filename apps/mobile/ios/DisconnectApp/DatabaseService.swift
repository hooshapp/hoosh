import Foundation
import FamilyControls

/// Supabase uses the same Auth accounts as the new app. Apple selection tokens
/// and calendar/reminder titles remain on-device. No Firebase fallback writes.
class DatabaseService {
    static let shared = DatabaseService()
    static let statusKey = "disconnect.supabaseSyncStatus"
    static let successKey = "disconnect.supabaseLastSync"
    private var defaults: UserDefaults { ShieldPresentationStore.defaults }
    var anonymousInstallID: String {
        let key = "anonymousInstallID"
        if let existing = defaults.string(forKey:key) { return existing }
        let value = UUID().uuidString; defaults.set(value,forKey:key); return value
    }
    private func status(_ text: String) { defaults.set(text,forKey:Self.statusKey) }
    private func plan() throws -> [[String:Any]] {
        try PerAppProtection.rules(for:PerAppProtection.selection()).map {
            ["localRuleID":$0.id,"appLabel":$0.researchLabel ?? "","appLabelSource":"participant_entered","dailyMinutes":$0.minutes,"sessionMinutes":$0.sessionMinutes]
        }
    }
    func saveEnrollment(uploadEvents:Bool=true) async throws {
        guard let id = await NativeSupabase.shared.identity()?.0 else { throw NativeBackendError.signedOut }
        guard let participant = await NativeSupabase.shared.participant() else { throw NativeBackendError.studyDetailsRequired }
        if SimulatorUITestSupport.consumeEnrollmentFailure() { throw URLError(.notConnectedToInternet) }
        let body = try JSONSerialization.data(withJSONObject:["user_id":id.uuidString,"participant_name":participant.name,"contact_email":participant.email,"telemetry_gap_detected":defaults.bool(forKey:"disconnect.researchQueueFull")])
        _ = try await NativeSupabase.shared.rest(table:"legacy_swift_participants",owner:id,method:"POST",body:body,
            query:[.init(name:"on_conflict",value:"user_id")],prefer:"resolution=merge-duplicates,return=minimal")
        let data = try await NativeSupabase.shared.rest(table:"legacy_swift_participants",owner:id,method:"GET",
            query:[.init(name:"user_id",value:"eq."+id.uuidString),.init(name:"select",value:"participant_name,contact_email")])
        guard let rows = try JSONSerialization.jsonObject(with:data) as? [[String:String]], rows.count == 1,
              rows[0]["participant_name"] == participant.name, rows[0]["contact_email"] == participant.email else { throw URLError(.cannotParseResponse) }
        defaults.set(id.uuidString,forKey:StudyEnrollmentGate.verifiedOwnerKey)
        defaults.set(true,forKey:"disconnect.study.enrollmentVerified")
        if uploadEvents { try await flushEvents(for:id) }
    }
    func syncNow() async throws {
        do {
            try await performSync()
        } catch {
            status(error.localizedDescription)
            throw error
        }
    }
    private func performSync() async throws {
        guard let (id, _) = await NativeSupabase.shared.identity() else { throw NativeBackendError.signedOut }
        let workspace = AccountWorkspace(defaults:defaults,domain:ShieldPresentationStore.group)
        guard workspace.completed(for:id.uuidString) else { throw NativeBackendError.setupRequired }
        NativeResearchQueue.setUser(id)
        try await saveEnrollment()
        PerAppProtection.recordActiveSessionSamples()
        StudyConfigurationHistory.capture(reason:"sync_snapshot")
        try await syncConfigurationHistory(for:id)
        status("Syncing your preferences…")
        let responses = OnboardingResponseStore.load()
        let preferences = try JSONSerialization.jsonObject(with:JSONEncoder().encode(responses))
        let currentPlan = try plan()
        let body = try JSONSerialization.data(withJSONObject:["user_id":id.uuidString,"preferences":preferences,"plan":currentPlan,"updated_at":ISO8601DateFormatter().string(from:Date())])
        _ = try await NativeSupabase.shared.rest(table:"legacy_swift_profiles",owner:id,method:"POST",body:body,
            query:[.init(name:"on_conflict",value:"user_id")],prefer:"resolution=merge-duplicates,return=minimal")
        // Verify the owner's actual saved row rather than treating a write attempt as sync.
        let read = try await NativeSupabase.shared.rest(table:"legacy_swift_profiles",owner:id,method:"GET",
            query:[.init(name:"user_id",value:"eq."+id.uuidString),.init(name:"select",value:"user_id,preferences,plan")])
        guard let rows = try JSONSerialization.jsonObject(with:read) as? [[String:Any]], rows.count == 1,
              (rows[0]["user_id"] as? String)?.lowercased() == id.uuidString.lowercased(),
              let restored = rows[0]["preferences"] as? NSDictionary,
              restored.isEqual(to:preferences as? [AnyHashable:Any] ?? [:]),
              let restoredPlan = rows[0]["plan"] as? NSArray, restoredPlan.isEqual(to:currentPlan) else { throw URLError(.cannotParseResponse) }
        try await flushEvents(for:id)
        try await verifySavedProgress(for:id)
        defaults.set(Date(),forKey:Self.successKey)
        status("Synced and read back successfully.")
    }
    func flushConfigurationOnly() async throws {
        guard let id=await NativeSupabase.shared.identity()?.0,
              defaults.string(forKey:AccountWorkspace.ownerKey)==id.uuidString else { return }
        try await syncConfigurationHistory(for:id)
    }
    private func syncConfigurationHistory(for id: UUID) async throws {
        let pending=StudyConfigurationHistory.pending(for:id)
        for item in pending {
            let data=try JSONEncoder().encode(item.1)
            _=try await NativeSupabase.shared.rest(table:"legacy_swift_configuration_history",owner:id,method:"POST",body:data,
                query:[.init(name:"on_conflict",value:"id")],prefer:"resolution=ignore-duplicates,return=minimal")
            guard await NativeSupabase.shared.identity()?.0==id else { throw NativeBackendError.staleSession }
            try? FileManager.default.removeItem(at:item.0)
        }
    }
    private func verifySavedProgress(for id: UUID) async throws {
        var events: [StoredStudyEvent] = [], cursor: UUID?
        while true {
            var query: [URLQueryItem] = [.init(name:"user_id",value:"eq."+id.uuidString),
                .init(name:"select",value:"id,event_name,occurred_at,properties"),
                .init(name:"order",value:"id.asc"),.init(name:"limit",value:"500")]
            if let cursor { query.append(.init(name:"id",value:"gt."+cursor.uuidString)) }
            let data = try await NativeSupabase.shared.rest(table:"legacy_swift_events",owner:id,method:"GET",query:query)
            let page = try NudgeResponseDecoder.decode([StoredStudyEvent].self,from:data)
            events.append(contentsOf:page)
            if page.count < 500 { break }
            guard events.count < 10000, let next = page.last?.id, next != cursor else { throw URLError(.dataLengthExceedsMaximum) }
            cursor = next
        }
        guard await NativeSupabase.shared.identity()?.0 == id,
              defaults.string(forKey:AccountWorkspace.ownerKey) == id.uuidString else { throw NativeBackendError.staleSession }
        var progress = VerifiedStudyProgress(events:events)
        progress.feedbackEntries=try await verifiedFeedbackCount(for:id)
        guard await NativeSupabase.shared.identity()?.0==id,
              defaults.string(forKey:AccountWorkspace.ownerKey)==id.uuidString else { throw NativeBackendError.staleSession }
        try HistoryTurnOffStore.save(events:events,owner:id)
        defaults.set(try JSONEncoder().encode(progress),forKey:VerifiedStudyProgress.storageKey)
    }
    func refreshHistory() async throws {
        guard let id=await NativeSupabase.shared.identity()?.0,
              defaults.string(forKey:AccountWorkspace.ownerKey)==id.uuidString else { throw NativeBackendError.signedOut }
        try await flushEvents(for:id)
        let now=Date()
        let start=min(HistoryPeriod.week.window(now:now).currentStart,HistoryPeriod.month.window(now:now).currentStart)
        var events:[StoredStudyEvent]=[],cursor:UUID?
        while true {
            var query:[URLQueryItem]=[.init(name:"user_id",value:"eq."+id.uuidString),
                .init(name:"select",value:"id,event_name,occurred_at,properties"),
                .init(name:"event_name",value:"in.(shield_quit_chosen,nudge_end_session)"),
                .init(name:"occurred_at",value:"gte."+ISO8601DateFormatter().string(from:start)),
                .init(name:"order",value:"id.asc"),.init(name:"limit",value:"500")]
            if let cursor { query.append(.init(name:"id",value:"gt."+cursor.uuidString)) }
            let data=try await NativeSupabase.shared.rest(table:"legacy_swift_events",owner:id,method:"GET",query:query)
            let rows=try NudgeResponseDecoder.decode([StoredStudyEvent].self,from:data)
            events.append(contentsOf:rows)
            if rows.count<500 { break }
            guard events.count<10000,let next=rows.last?.id,next != cursor else { throw URLError(.dataLengthExceedsMaximum) }
            cursor=next
        }
        guard await NativeSupabase.shared.identity()?.0==id,
              defaults.string(forKey:AccountWorkspace.ownerKey)==id.uuidString else { throw NativeBackendError.staleSession }
        try HistoryTurnOffStore.save(events:events,owner:id,coverageStart:start)
    }
    private func verifiedFeedbackCount(for id: UUID) async throws -> Int {
        struct Row: Decodable { var id: UUID }
        var count=0,cursor:UUID?
        while true {
            var query:[URLQueryItem]=[.init(name:"user_id",value:"eq."+id.uuidString),.init(name:"select",value:"id"),.init(name:"order",value:"id.asc"),.init(name:"limit",value:"500")]
            if let cursor { query.append(.init(name:"id",value:"gt."+cursor.uuidString)) }
            let data=try await NativeSupabase.shared.rest(table:"legacy_swift_feedback",owner:id,method:"GET",query:query)
            let page=try JSONDecoder().decode([Row].self,from:data)
            count += page.count
            if page.count<500 { return count }
            guard count<10000,let next=page.last?.id,next != cursor else { throw URLError(.dataLengthExceedsMaximum) }
            cursor=next
        }
    }
    func flushEvents(for id: UUID) async throws {
        let pending = NativeResearchQueue.pending(for:id)
        for start in stride(from:0,to:pending.count,by:50) {
            let batch = Array(pending[start..<min(start+50,pending.count)])
            let data = try JSONEncoder().encode(batch.map(\.1))
            _ = try await NativeSupabase.shared.rest(table:"legacy_swift_events",owner:id,method:"POST",body:data,
                query:[.init(name:"on_conflict",value:"id")],prefer:"resolution=ignore-duplicates,return=minimal")
            guard await NativeSupabase.shared.identity()?.0 == id else { throw NativeBackendError.staleSession }
            for item in batch { try? FileManager.default.removeItem(at:item.0) }
        }
    }
    func syncUserProfile(responses: OnboardingResponses, selection: FamilyActivitySelection? = nil) {
        Task {
            do { try await syncNow() }
            catch { status(error.localizedDescription) }
        }
    }
    func logEvent(_ name: String, properties: [String:Any] = [:]) {
        let safeKeys: Set<String> = ["rating","context","protectedAppCount","protectedCategoryCount","protectedWebDomainCount","totalSelected","has_calendar_item","has_reminder_item"]
        var values: [String:String] = [:]
        for (key,value) in properties where safeKeys.contains(key) && !(value is String) { values[key] = String(describing:value) }
        NativeResearchQueue.enqueue(name,properties:values)
    }
    func logProtectedSelectionChanged(_ selection: FamilyActivitySelection) {
        logEvent("protected_selection_changed",properties:["protectedAppCount":selection.applicationTokens.count])
        syncUserProfile(responses:OnboardingResponseStore.load(),selection:selection)
    }
    func submitFeedback(rating: Int, message: String, context: String, responses: OnboardingResponses,
                        completion: @escaping (Result<Void,Error>) -> Void) {
        Task {
            do {
                guard let id = await NativeSupabase.shared.identity()?.0 else { throw NativeBackendError.signedOut }
                guard (1...5).contains(rating), message.count <= 2000, context.count <= 100 else { throw CocoaError(.validationMissingMandatoryProperty) }
                let feedbackID=UUID().uuidString
                let text=message.trimmingCharacters(in:.whitespacesAndNewlines)
                let body = try JSONSerialization.data(withJSONObject:["id":feedbackID,"user_id":id.uuidString,"rating":rating,"message":text,"context":context])
                let returned = try await NativeSupabase.shared.rest(table:"legacy_swift_feedback",owner:id,method:"POST",body:body,prefer:"return=representation")
                guard let rows=try JSONSerialization.jsonObject(with:returned) as? [[String:Any]],rows.count==1,
                      (rows[0]["id"] as? String)?.lowercased()==feedbackID.lowercased(),
                      rows[0]["rating"] as? Int==rating,rows[0]["message"] as? String==text else { throw URLError(.cannotParseResponse) }
                await MainActor.run { completion(.success(())) }
                try? await syncNow()
            } catch { await MainActor.run { completion(.failure(error)) } }
        }
    }
    func submitResearchOptIn(name: String, contact: String, userType: String, biggestDistraction: String,
                             notes: String, responses: OnboardingResponses, selection: FamilyActivitySelection,
                             completion: @escaping (Result<Void,Error>) -> Void) {
        Task {
            do {
                guard let id = await NativeSupabase.shared.identity()?.0 else { throw NativeBackendError.signedOut }
                let contact=contact.trimmingCharacters(in:.whitespacesAndNewlines)
                guard !contact.isEmpty else { throw CocoaError(.validationMissingMandatoryProperty) }
                let answers = ["name":name,"contact":contact,"userType":userType,"biggestDistraction":biggestDistraction,"notes":notes,"interviewConsent":"true"]
                let recordID=UUID().uuidString
                let body = try JSONSerialization.data(withJSONObject:["id":recordID,"user_id":id.uuidString,"answers":answers])
                let returned=try await NativeSupabase.shared.rest(table:"legacy_swift_research",owner:id,method:"POST",body:body,prefer:"return=representation")
                guard let rows=try JSONSerialization.jsonObject(with:returned) as? [[String:Any]],rows.count==1,
                      (rows[0]["id"] as? String)?.lowercased()==recordID.lowercased(),
                      let saved=rows[0]["answers"] as? [String:String],saved==answers else { throw URLError(.cannotParseResponse) }
                await MainActor.run { completion(.success(())) }
            } catch { await MainActor.run { completion(.failure(error)) } }
        }
    }
    // Compatibility for inactive imported demo views; no implicit account creation.
    func saveUserPreferences(userId: String, email: String, goal: String, genre: String, tone: String) {
        syncUserProfile(responses:OnboardingResponseStore.load())
    }
    func fetchUserPreferences(userId: String, completion: @escaping (User?) -> Void) { completion(nil) }
}
