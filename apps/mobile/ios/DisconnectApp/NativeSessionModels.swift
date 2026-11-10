import Foundation

struct NativeSupabaseSession: Codable {
    var accessToken: String
    var refreshToken: String
    var userID: UUID
    var email: String?
    var expiresAt: Date
    var isStudyParticipant: Bool? = nil
    var participantName: String? = nil
    var participantEmail: String? = nil
    var installationID: UUID? = nil

    func canRestore(on installation: UUID, legacyOwner: String?) -> Bool {
        if let installationID { return installationID == installation }
        return legacyOwner == userID.uuidString
    }
}
struct NativeWireSession: Decodable {
    struct User: Decodable {
        struct Metadata: Decodable { var participant_name: String?; var study_email: String? }
        var id: UUID
        var email: String?
        var is_anonymous: Bool?
        var user_metadata: Metadata?
    }
    var access_token: String
    var refresh_token: String
    var expires_in: Double
    var user: User
    var session: NativeSupabaseSession {
        .init(accessToken: access_token, refreshToken: refresh_token, userID: user.id, email: user.email,
              expiresAt: Date().addingTimeInterval(expires_in), isStudyParticipant:user.is_anonymous,
              participantName:user.user_metadata?.participant_name, participantEmail:user.user_metadata?.study_email)
    }
}
