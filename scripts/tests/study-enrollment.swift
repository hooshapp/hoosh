import Foundation

@main struct StudyEnrollmentChecks {
    static func main() throws {
        let participant = try StudyParticipant(name:"  Pilot participant  ",email:"  person@example.com  ")
        precondition(participant.name == "Pilot participant" && participant.email == "person@example.com")
        _ = try StudyParticipant(name:"A",email:"name+study@example.co.uk")
        for email in ["", "missing-at", "a@@example.com", "a b@example.com", "a@example.com\nBcc:test@example.com", "<a@example.com>"] {
            do { _ = try StudyParticipant(name:"A",email:email); fatalError("Invalid contact accepted") } catch { }
        }
        for name in [" ", "A\nB",String(repeating:"A",count:101)] {
            do { _ = try StudyParticipant(name:name,email:"a@example.com"); fatalError("Invalid name accepted") } catch { }
        }
        let id = "00000000-0000-4000-8000-000000000001"
        let payload: [String:Any] = ["access_token":"synthetic-access","refresh_token":"synthetic-refresh","expires_in":3600,
            "user":["id":id,"email":NSNull(),"is_anonymous":true,"user_metadata":["participant_name":participant.name,"study_email":participant.email]]]
        let wire = try JSONDecoder().decode(NativeWireSession.self,from:JSONSerialization.data(withJSONObject:payload))
        let session = wire.session
        precondition(session.isStudyParticipant == true && session.email == nil)
        precondition(session.participantName == participant.name && session.participantEmail == participant.email)
        precondition(session.expiresAt.timeIntervalSinceNow > 3500)
        let saved = try JSONDecoder().decode(NativeSupabaseSession.self,from:JSONEncoder().encode(session))
        precondition(saved.userID == session.userID && saved.participantEmail == session.participantEmail)
        let old: [String:Any] = ["accessToken":"synthetic-access","refreshToken":"synthetic-refresh","userID":id,"email":"a@example.com","expiresAt":0]
        let migrated = try JSONDecoder().decode(NativeSupabaseSession.self,from:JSONSerialization.data(withJSONObject:old))
        precondition(migrated.isStudyParticipant == nil && migrated.email == "a@example.com", "Existing saved password accounts remain readable")
        print("PASS: name/email enrollment validation, anonymous session decoding, no verified-email assumption, secure-session persistence model and old-session compatibility")
    }
}
