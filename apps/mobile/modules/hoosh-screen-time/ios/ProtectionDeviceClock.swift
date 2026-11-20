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
    var size = 0
    guard sysctlbyname("kern.bootsessionuuid", nil, &size, nil, 0) == 0, size > 0, size <= 128 else {
      throw ProtectionStoreError.unavailable
    }
    var bytes = [UInt8](repeating: 0, count: size)
    let result = bytes.withUnsafeMutableBytes { sysctlbyname("kern.bootsessionuuid", $0.baseAddress, &size, nil, 0) }
    guard result == 0, size <= bytes.count,
          let uuid = UUID(uuidString: String(decoding: bytes.prefix(size).prefix(while: { $0 != 0 }), as: UTF8.self)) else {
      throw ProtectionStoreError.unavailable
    }
    return uuid.uuidString.lowercased()
  }
}
