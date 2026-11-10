import Foundation
import Security

enum NativeBackendError: LocalizedError {
    case configuration, signedOut, staleSession, setupRequired, studyDetailsRequired, enrollmentUnavailable, keychain, http(Int)
    var errorDescription: String? {
        switch self {
        case .configuration: return "Supabase is not configured in this build. Your settings remain saved on this phone."
        case .signedOut, .staleSession: return "Start or resume your study profile to sync this phone."
        case .enrollmentUnavailable: return "Study enrollment is not enabled on the server yet. Please ask the researcher to enable it."
        case .studyDetailsRequired: return "Add your name and email to complete your study registration."
        case .setupRequired: return "Finish onboarding before syncing this account."
        case .keychain: return "Your account session could not be saved securely. Please retry."
        case .http(let code):
            if code == 400 || code == 401 { return "Sign-in or session verification failed. Check your account details and retry." }
            if code == 403 { return "This account does not have database access. Your local protection still works." }
            if code == 404 { return "The Swift database tables are not available yet. Your local settings are safe." }
            if code == 429 { return "Too many requests. Please wait before trying again." }
            return "Cloud sync could not finish (HTTP \(code)). Please retry."
        }
    }
}
struct NativeSupabaseConfiguration {
    let url: URL
    let key: String
    static func load() throws -> Self {
        guard let file = Bundle.main.url(forResource: "NativeSupabaseConfig", withExtension: "plist"),
              let data = try? Data(contentsOf: file),
              let values = try? PropertyListSerialization.propertyList(from: data, format: nil) as? [String:String],
              let base = values["url"], let url = URL(string: base), url.scheme == "https", url.user == nil, url.password == nil,
              let key = values["publishableKey"], key.hasPrefix("sb_publishable_") else { throw NativeBackendError.configuration }
        return Self(url: url, key: key)
    }
}
private enum NativeSessionKeychain {
    static let service = "com.AnishaDasgupta.DisconnectApp.supabase"
    // This marker lives in the host app container and disappears on Delete App.
    private static let installationID: UUID = {
        let key = "disconnect.auth.installationID"
        let defaults = UserDefaults.standard
        if let existing = defaults.string(forKey: key).flatMap(UUID.init(uuidString:)) { return existing }
        let id = UUID()
        defaults.set(id.uuidString, forKey: key)
        return id
    }()

    static var query: [String:Any] { [kSecClass as String:kSecClassGenericPassword, kSecAttrService as String:service, kSecAttrAccount as String:"session"] }
    static func load() -> NativeSupabaseSession? {
        var value: CFTypeRef?
        var request = query; request[kSecReturnData as String] = true; request[kSecMatchLimit as String] = kSecMatchLimitOne
        guard SecItemCopyMatching(request as CFDictionary, &value) == errSecSuccess, let data = value as? Data else { return nil }
        guard let session = try? JSONDecoder().decode(NativeSupabaseSession.self, from: data),
              session.canRestore(on: installationID, legacyOwner: ShieldPresentationStore.defaults.string(forKey: AccountWorkspace.ownerKey)) else {
            clear()
            return nil
        }
        // Upgrade older sessions only when the original local workspace still exists.
        if session.installationID == nil { try? save(session) }
        return session
    }
    static func save(_ session: NativeSupabaseSession) throws {
        var stored = session
        stored.installationID = installationID
        let data = try JSONEncoder().encode(stored)
        let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String:data] as CFDictionary)
        if status == errSecSuccess { return }
        guard status == errSecItemNotFound else { throw NativeBackendError.keychain }
        var item = query
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { throw NativeBackendError.keychain }
    }
    static func clear() { SecItemDelete(query as CFDictionary) }
}

/// The host owns credentials. Screen Time extensions never receive a bearer token.
actor NativeSupabase {
    static let shared = NativeSupabase()
    private var session = NativeSessionKeychain.load()
    private var generation = 0
    private var refreshTask: Task<NativeSupabaseSession, Error>?
    func identity() -> (UUID, String?)? { session.map { ($0.userID, $0.participantEmail ?? $0.email) } }
    func participant() -> StudyParticipant? {
        guard let current = session,
              let name = current.participantName, let email = current.participantEmail else { return nil }
        return try? StudyParticipant(name:name,email:email)
    }

    private static func request(configuration: NativeSupabaseConfiguration, path: String, query: [URLQueryItem] = [],
                                method: String, body: Data? = nil, bearer: String? = nil, prefer: String? = nil) async throws -> Data {
        var components = URLComponents(url: configuration.url.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        components.queryItems = query.isEmpty ? nil : query
        var request = URLRequest(url: components.url!)
        request.httpMethod = method; request.httpBody = body; request.timeoutInterval = 15
        request.setValue(configuration.key, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let bearer { request.setValue("Bearer " + bearer, forHTTPHeaderField: "Authorization") }
        if let prefer { request.setValue(prefer, forHTTPHeaderField: "Prefer") }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        guard (200..<300).contains(http.statusCode) else {
            if path == "auth/v1/signup", let body = try? JSONSerialization.jsonObject(with:data) as? [String:Any],
               body["error_code"] as? String == "anonymous_provider_disabled" || body["code"] as? String == "anonymous_provider_disabled" {
                throw NativeBackendError.enrollmentUnavailable
            }
            throw NativeBackendError.http(http.statusCode)
        }
        return data
    }
    func enroll(_ participant: StudyParticipant) async throws {
        // A saved device session resumes the same participant. A typed email is
        // never used to retrieve or impersonate another participant's records.
        if session != nil {
            let current=try await authorizedSession(),expected=generation
            let data=try await Self.request(configuration:NativeSupabaseConfiguration.load(),path:"auth/v1/user",method:"PUT",
                body:JSONSerialization.data(withJSONObject:["data":["participant_name":participant.name,"study_email":participant.email]]),bearer:current.accessToken)
            guard let user=try JSONSerialization.jsonObject(with:data) as? [String:Any],
                  let raw=user["id"] as? String,UUID(uuidString:raw)==current.userID,
                  generation==expected,session?.userID==current.userID else { throw NativeBackendError.staleSession }
            var updated=current
            updated.participantName=participant.name;updated.participantEmail=participant.email
            try NativeSessionKeychain.save(updated);session=updated
            await MainActor.run { NotificationCenter.default.post(name:.disconnectAccountChanged,object:nil) }
            return
        }
        generation += 1
        let expected = generation
        let data = try await Self.request(configuration:NativeSupabaseConfiguration.load(),path:"auth/v1/signup",method:"POST",
            body:JSONSerialization.data(withJSONObject:["data":["participant_name":participant.name,"study_email":participant.email]]))
        var value = try JSONDecoder().decode(NativeWireSession.self,from:data).session
        guard expected == generation, value.isStudyParticipant == true else { throw NativeBackendError.staleSession }
        value.participantName = participant.name; value.participantEmail = participant.email
        try NativeSessionKeychain.save(value)
        session = value
        ShieldPresentationStore.defaults.removeObject(forKey:"disconnect.auth.lastError")
        ShieldPresentationStore.defaults.set("enrolled",forKey:"disconnect.auth.status")
        await MainActor.run { NotificationCenter.default.post(name:.disconnectAccountChanged,object:nil) }
    }
    func signIn(email: String, password: String) async throws {
        generation += 1
        let expected = generation
        refreshTask?.cancel(); refreshTask = nil
        let data = try await Self.request(configuration: NativeSupabaseConfiguration.load(), path: "auth/v1/token",
            query: [.init(name:"grant_type",value:"password")], method:"POST",
            body: JSONSerialization.data(withJSONObject: ["email":email.trimmingCharacters(in:.whitespacesAndNewlines),"password":password]))
        let value = try JSONDecoder().decode(NativeWireSession.self, from: data).session
        guard expected == generation else { throw NativeBackendError.staleSession }
        try NativeSessionKeychain.save(value)
        session = value
        ShieldPresentationStore.defaults.removeObject(forKey:"disconnect.auth.lastError")
        ShieldPresentationStore.defaults.set("signedIn",forKey:"disconnect.auth.status")
        await MainActor.run { NotificationCenter.default.post(name:.disconnectAccountChanged,object:nil) }
    }
    func signOut() async {
        generation += 1
        let old = session
        session = nil; refreshTask?.cancel(); refreshTask = nil
        NativeSessionKeychain.clear(); NativeResearchQueue.setUser(nil)
        ShieldPresentationStore.defaults.set("signedOut",forKey:"disconnect.auth.status")
        await MainActor.run { NotificationCenter.default.post(name:.disconnectAccountChanged,object:nil) }
        if let old, let configuration = try? NativeSupabaseConfiguration.load() {
            _ = try? await Self.request(configuration: configuration, path:"auth/v1/logout",
                query:[.init(name:"scope",value:"local")], method:"POST", bearer:old.accessToken)
        }
    }
    private func authorizedSession() async throws -> NativeSupabaseSession {
        guard let current = session else { throw NativeBackendError.signedOut }
        if current.expiresAt.timeIntervalSinceNow > 60 { return current }
        let expected = generation
        let task: Task<NativeSupabaseSession, Error>
        if let pending = refreshTask { task = pending }
        else {
            let configuration = try NativeSupabaseConfiguration.load()
            task = Task {
                let data = try await Self.request(configuration: configuration, path:"auth/v1/token",
                    query:[.init(name:"grant_type",value:"refresh_token")], method:"POST",
                    body:JSONSerialization.data(withJSONObject:["refresh_token":current.refreshToken]))
                return try JSONDecoder().decode(NativeWireSession.self,from:data).session
            }
            refreshTask = task
        }
        do {
            var value = try await task.value
            if value.userID == current.userID {
                value.participantName = value.participantName ?? current.participantName
                value.participantEmail = value.participantEmail ?? current.participantEmail
            }
            guard generation == expected, value.userID == current.userID, session?.userID == current.userID else { throw NativeBackendError.staleSession }
            try NativeSessionKeychain.save(value); session = value; refreshTask = nil
            return value
        } catch {
            if generation == expected { refreshTask = nil }
            throw error
        }
    }
    func rest(table: String, owner: UUID, method: String, body: Data? = nil, query: [URLQueryItem] = [], prefer: String? = nil) async throws -> Data {
        guard ["legacy_swift_profiles","legacy_swift_events","legacy_swift_feedback","legacy_swift_research","legacy_swift_participants","legacy_swift_configuration_history"].contains(table) else { throw NativeBackendError.configuration }
        let value = try await authorizedSession(), expected = generation
        guard value.userID == owner else { throw NativeBackendError.staleSession }
        let result = try await Self.request(configuration: NativeSupabaseConfiguration.load(), path:"rest/v1/"+table,
            query:query, method:method, body:body, bearer:value.accessToken, prefer:prefer)
        guard expected == generation, value.userID == session?.userID else { throw NativeBackendError.staleSession }
        return result
    }
}
