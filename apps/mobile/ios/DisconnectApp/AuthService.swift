import Foundation
import FirebaseAuth

class AuthService {
    
    /// This function attempts to sign the user in. If the account doesn't exist,
    /// it automatically creates a new account for them.
    func signInOrUp(email: String, password: String, completion: @escaping (String?, Error?) -> Void) {
        
        Auth.auth().signIn(withEmail: email, password: password) { result, error in
            if let error = error {
                // If sign in fails, the user likely doesn't have an account yet.
                // Attempt to create a new account.
                Auth.auth().createUser(withEmail: email, password: password) { result, error in
                    if let error = error {
                        print("❌ Signup failed: \(error.localizedDescription)")
                        completion(nil, error)
                    } else {
                        print("✅ New account created.")
                        completion(result?.user.uid, nil)
                    }
                }
            } else {
                // Sign in was successful.
                print("✅ User signed in successfully.")
                completion(result?.user.uid, nil)
            }
        }
    }
}
