import Foundation
@main struct DeviceClockChecks {
  static func main() throws {
    let first = try ProtectionDeviceClock.sample()
    let second = try ProtectionDeviceClock.sample()
    guard first.boot == second.boot, second.elapsed >= first.elapsed,
          abs(second.wall - first.wall) < 1000 else { fatalError("unstable host clock sample") }
    print("PASS: native host continuous clock and boot identity; no signals exported. Physical iPhone availability remains unverified.")
  }
}
