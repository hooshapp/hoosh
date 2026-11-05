import Foundation
class AuthService {
    // Existing imported call sites remain source compatible. This signs in only;
    // invalid credentials never trigger silent account creation.
    func signInOrUp(email: String, password: String, completion: @escaping (String?,Error?) -> Void) {
        Task {
            do {
                try await NativeSupabase.shared.signIn(email:email,password:password)
                let id = await NativeSupabase.shared.identity()?.0.uuidString
                await MainActor.run { completion(id,nil) }
            } catch { await MainActor.run { completion(nil,error) } }
        }
    }
}
