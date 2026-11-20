import Foundation
#if os(iOS)
import FamilyControls
@main struct OSAdapterChecks {
  static func main() throws {
    let start: Int64 = 1795204800000
    let envelope = ProtectionMonitorEnvelope(reasonID: "weekly_test", startsAt: start,
      endsAt: start + 900000, businessStartsAt: start + 600000, warningSeconds: 300)
    let monitor = ProtectionOSMonitor(name: "hoosh.shared.test", envelope: envelope)
    let schedule = try monitor.schedule()
    guard !schedule.repeats, schedule.warningTime?.second == 300,
          schedule.intervalStart.timeZone?.secondsFromGMT() == 0,
          schedule.intervalEnd.timeZone?.secondsFromGMT() == 0 else { fatalError("incorrect SDK envelope") }
    do { try ProtectionOSAdapter.stage([monitor], preserving: []); fatalError("stage bypassed gate") }
    catch ProtectionTransactionError.activationGated {}
    do { try ProtectionOSAdapter.retire([monitor.name]); fatalError("retire bypassed gate") }
    catch ProtectionTransactionError.activationGated {}
    do { try ProtectionOSAdapter.writeBlockedApps([]); fatalError("shield write bypassed gate") }
    catch ProtectionTransactionError.activationGated {}
    let invalid = ProtectionOSMonitor(name: "other.app", envelope: envelope)
    do { _ = try invalid.schedule(); fatalError("unscoped name accepted") }
    catch ProtectionTransactionError.invalid {}
    let fractional = ProtectionOSMonitor(name: "hoosh.shared.fractional", envelope: .init(reasonID: "test",
      startsAt: start + 1, endsAt: start + 900001, businessStartsAt: start + 1, warningSeconds: nil))
    do { _ = try fractional.schedule(); fatalError("deadline silently rounded") }
    catch ProtectionTransactionError.invalid {}
    print("PASS: real simulator SDK schedule construction and all mutation gates. No OS monitors/shields were changed; no device enforcement proof.")
  }
}
#endif
