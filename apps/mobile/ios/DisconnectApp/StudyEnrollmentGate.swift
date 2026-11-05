import Foundation

/// Registration proof belongs to an account, not merely to this installation.
enum StudyEnrollmentGate {
    static let verifiedOwnerKey="disconnect.study.enrollmentVerifiedOwner"
    static func isVerified(owner:String,defaults:UserDefaults) -> Bool {
        defaults.bool(forKey:"disconnect.study.enrollmentVerified") && defaults.string(forKey:verifiedOwnerKey)==owner
    }
}
