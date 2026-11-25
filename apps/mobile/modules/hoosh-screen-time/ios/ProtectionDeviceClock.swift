import Foundation
import Darwin

/// Clock and boot signals are native timer inputs only: never send them to JS,
/// telemetry, rewards or a backend. Unsupported/denied boot identity fails closed.
enum ProtectionDeviceClock {
  static func sample() throws -> ProtectionClock {
    let boot = try bootIdentity()
    var info = mach_timebase_info_data_t()
    guard mach_timebase_info(&info) == KERN_SUCCESS, info.denom > 0 else { throw ProtectionStoreError.unavailable }
    let elapsed = Double(mach_continuous_time()) * Double(info.numer) / Double(info.denom) / 1000000
    guard elapsed.isFinite, elapsed >= 0, elapsed < Double(Int64.max - 86400000) else { throw ProtectionStoreError.unavailable }
    let wall = Date().timeIntervalSince1970 * 1000
    guard wall.isFinite, wall >= 0, wall <= 4102444800000 else { throw ProtectionStoreError.unavailable }
    let value = ProtectionClock(wall: Int64(wall), elapsed: Int64(elapsed), boot: boot)
    try value.validate()
    return value
  }
  private static func bootIdentity() throws -> String {
    // Public Darwin boot-time MIB works in the iOS app sandbox; the boot-session
    // UUID sysctl is not available there. A wall-clock correction can change this
    // marker and conservatively invalidate an allowance; it never extends one.
    var boot = timeval()
    var size = MemoryLayout<timeval>.size
    var mib: [Int32] = [CTL_KERN, KERN_BOOTTIME]
    guard sysctl(&mib, u_int(mib.count), &boot, &size, nil, 0) == 0,
          size == MemoryLayout<timeval>.size, boot.tv_sec > 0,
          boot.tv_usec >= 0, boot.tv_usec < 1000000 else { throw ProtectionStoreError.unavailable }
    return "darwin-boot:\(boot.tv_sec):\(boot.tv_usec)"
  }
}
