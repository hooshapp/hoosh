import Foundation
import CryptoKit

/// Alarm candidates only. The ledger retains exact wall/continuous deadlines;
/// SDK second alignment never extends the private grant or session deadline.
enum ProtectionExpiryPlanner {
  static func monitors(runtime: ProtectionRuntimeRecord, owner: ProtectionOwner,
                       ledger: ProtectionSessionLedger?, clock: ProtectionClock) throws -> [(name: String, envelope: ProtectionMonitorEnvelope)] {
    try clock.validate()
    guard runtime.enabled, let ledger else { return [] }
    let reasons = Set(runtime.activeSnapshots.map(\.reasonID))
    let deadlines = Set(ledger.grants.compactMap { grant -> Int64? in
      guard grant.revision == runtime.revision, reasons.contains(grant.reasonID),
        grant.boot == clock.boot, grant.wallEnd > clock.wall, grant.elapsedEnd > clock.elapsed,
        ledger.sessions.contains(where: { $0.app == grant.app && $0.live(clock) }) else { return nil }
      return grant.wallEnd
    })
    guard deadlines.count <= 512 else { throw SessionFailure.capacity }
    return try deadlines.sorted().map { deadline in
      guard deadline <= 4102444800000 else { throw SessionFailure.invalid }
      let end = ((deadline + 999) / 1000) * 1000
      let start = end - 900000
      guard start >= 0 else { throw SessionFailure.invalid }
      let suffix = SHA256.hash(data: Data("expiry:\(deadline)".utf8)).prefix(16).map { String(format: "%02x", $0) }.joined()
      return (ProtectionRuntimePlanner.prefix(owner) + "r\(runtime.revision).expiry." + suffix,
        ProtectionMonitorEnvelope(reasonID: "session_expiry", startsAt: start, endsAt: end,
          businessStartsAt: start, warningSeconds: nil))
    }
  }
}
