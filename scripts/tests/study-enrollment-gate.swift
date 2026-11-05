import Foundation
@main struct EnrollmentGateChecks {
 static func main() {
  let domain="qa.enrollment-gate."+UUID().uuidString
  let defaults=UserDefaults(suiteName:domain)!
  defer { defaults.removePersistentDomain(forName:domain) }
  precondition(!StudyEnrollmentGate.isVerified(owner:"A",defaults:defaults))
  defaults.set(true,forKey:"disconnect.study.enrollmentVerified")
  precondition(!StudyEnrollmentGate.isVerified(owner:"A",defaults:defaults),"A bare installation flag is not proof for an account")
  defaults.set("A",forKey:StudyEnrollmentGate.verifiedOwnerKey)
  precondition(StudyEnrollmentGate.isVerified(owner:"A",defaults:defaults))
  precondition(!StudyEnrollmentGate.isVerified(owner:"B",defaults:defaults),"Another user's proof cannot unlock registration")
  defaults.set(false,forKey:"disconnect.study.enrollmentVerified")
  precondition(!StudyEnrollmentGate.isVerified(owner:"A",defaults:defaults))
  print("PASS: first-time registration gate, matching-account server proof and cross-account isolation")
 }
}
