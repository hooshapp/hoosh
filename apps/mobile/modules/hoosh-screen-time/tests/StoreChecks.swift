import Foundation
import Darwin

@main struct StoreChecks {
  static func main() throws {
    let args = CommandLine.arguments
    if args.count > 2 {
      let root = URL(fileURLWithPath: args[2])
      if args[1] == "crash" {
        let store = SharedProtectionStore(directory: root, beforeRename: { _exit(73) })
        let old = try store.read()!
        try store.update(expectedRevision: old.revision) { $0.owners[0].coverage = "observed" }
        fatalError("did not crash")
      }
      if args[1] == "increment" {
        let store = SharedProtectionStore(directory: root)
        for _ in 0..<40 {
          while true {
            let old = try store.read()!
            do {
              try store.update(expectedRevision: old.revision) { _ in }
              break
            } catch ProtectionStoreError.conflict { continue }
          }
        }
        return
      }
    }
    let root = FileManager.default.temporaryDirectory.appendingPathComponent("hoosh-store-checks-\(UUID())")
    defer { try? FileManager.default.removeItem(at: root) }
    let store = SharedProtectionStore(directory: root)
    let a = ProtectionOwner(namespace: "project-a", userID: UUID())
    let b = ProtectionOwner(namespace: "project-a", userID: UUID())
    try expect(try store.read() == nil, "missing must stay missing")
    let first = try store.update(expectedRevision: nil) { state in
      state.owners = [ProtectionOwnerRecord(owner: a)]
      state.installedOwner = a
    }
    expect(first.revision == 1, "first atomic revision")
    try fails(.conflict) { try store.update(expectedRevision: nil) { _ in } }
    let leases = ProtectionOwnerLeases()
    let tokenA = leases.begin(a)
    try leases.require(a, token: tokenA)
    let otherProject = ProtectionOwner(namespace: "project-b", userID: a.userID)
    try fails(.staleLease) { try leases.require(otherProject, token: tokenA) }
    try expect(try store.read() == first, "login cannot claim installation")
    let tokenB = leases.begin(b)
    try fails(.staleLease) { try leases.require(a, token: tokenA) }
    leases.end(tokenA)
    try leases.require(b, token: tokenB)
    leases.destroy()
    try fails(.staleLease) { try leases.require(b, token: tokenB) }
    try expect(try store.read() == first, "destroy/signout retains disk owner and records")
    let fault = SharedProtectionStore(directory: root, beforeRename: { throw ProtectionStoreError.unavailable })
    try fails(.unavailable) { try fault.update(expectedRevision: 1) { $0.owners[0].coverage = "observed" } }
    try expect(try store.read() == first, "failed pre-rename write preserves old state")
    let child = process("crash", root)
    try child.run(); child.waitUntilExit()
    expect(child.terminationStatus == 73, "interrupted write exits at boundary")
    try expect(try store.read() == first, "process death preserves old state")
    let leftovers = try FileManager.default.contentsOfDirectory(atPath: root.path)
    expect(!leftovers.contains(where: { $0.hasPrefix("pending-") }), "abandoned temporary files cleaned under lock")
    let writers = (0..<4).map { _ in process("increment", root) }
    for writer in writers { try writer.run() }
    for writer in writers { writer.waitUntilExit(); expect(writer.terminationStatus == 0, "writer exits successfully") }
    try expect(try store.read()?.revision == 161, "four processes lose no successful writes")
    let path = root.appendingPathComponent("state-v1.json")
    let valid = try Data(contentsOf: path)
    try Data("{\"version\":2}".utf8).write(to: path)
    try fails(.newerVersion) { try store.read() }
    try fails(.newerVersion) { try store.update(expectedRevision: nil) { _ in } }
    try Data("broken".utf8).write(to: path)
    try fails(.corrupt) { try store.read() }
    try fails(.corrupt) { try store.update(expectedRevision: nil) { _ in } }
    try expect(try Data(contentsOf: path) == Data("broken".utf8), "corruption never overwritten")
    try Data(repeating: 0, count: SharedProtectionStore.maximumBytes + 1).write(to: path)
    try fails(.oversized) { try store.read() }
    try valid.write(to: path)
    let current = try store.read()!
    try fails(.invalidRecord) {
      try store.update(expectedRevision: current.revision) { $0.owners.append($0.owners[0]) }
    }
    try expect(try store.read() == current, "invalid edit preserves state")
    print("PASS: missing/readback, CAS, A/B leases, retention, failed/crashed writes, 4-process contention, newer/corrupt/oversize rejection, invalid edits")
  }
  static func process(_ mode: String, _ directory: URL) -> Process {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: CommandLine.arguments[0])
    process.arguments = [mode, directory.path]
    return process
  }
  static func expect(_ condition: @autoclosure () throws -> Bool, _ message: String) rethrows {
    if try !condition() { fatalError(message) }
  }
  static func fails<T>(_ expected: ProtectionStoreError, _ action: () throws -> T) throws {
    do { _ = try action(); fatalError("expected \(expected)") }
    catch let actual as ProtectionStoreError { expect(actual == expected, "expected \(expected), got \(actual)") }
  }
}
