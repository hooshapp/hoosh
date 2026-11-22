import Foundation
@main struct RewardJournalChecks {
  static func main() throws {
    let owner = ProtectionOwner(namespace: "fixture", userID: UUID())
    let other = ProtectionOwner(namespace: "fixture", userID: UUID())
    let root = FileManager.default.temporaryDirectory.appendingPathComponent("hoosh-rewards-\(UUID())")
    defer { try? FileManager.default.removeItem(at: root) }
    let store = SharedProtectionStore(directory: root)
    try store.update(expectedRevision: nil) { state in
      state.installedOwner = owner; state.owners = [.init(owner: owner), .init(owner: other)]
    }
    guard try store.rewardsRead(owner: owner) == nil else { fatalError("missing became evidence") }
    var journal = ProtectionRewardJournal(timezone: "UTC")
    let at: Int64 = 1795262400000
    func grant(_ i: Int) -> ProtectionGrantResult {
      .init(session: .init(id: UUID(), app: Data([1]), wallEnd: at + 300000,
        elapsedEnd: 300000, boot: "fixture", seconds: 300), startedNewSession: true, sessionIndex: i, exhausted: i > 2)
    }
    for i in 1...260 {
      try journal.append(grant: grant(i), revision: 1,
        clock: .init(wall: at + Int64(i), elapsed: Int64(i), boot: "fixture"), timezone: "UTC")
    }
    guard journal.events.count == 256, journal.discarded == 4, journal.events.first?.sequence == 5 else { fatalError("overflow not bounded") }
    let first = try journal.batch(), second = try journal.batch()
    guard NSDictionary(dictionary: first).isEqual(to: second), journal.issued == 36 else { fatalError("retry IDs changed") }
    let wire = try JSONSerialization.data(withJSONObject: first)
    let text = String(decoding: wire, as: UTF8.self)
    guard !text.contains("fixture"), !text.contains("revision"), !text.contains("app"), !text.contains("quit"), !text.contains("day_closed") else { fatalError("unapproved evidence escaped") }
    do { try journal.ack(installation: UUID(), sequence: 36); fatalError("foreign stream ack") } catch ProtectionStoreError.conflict {}
    do { try journal.ack(installation: journal.installationID, sequence: 37); fatalError("unissued ack") } catch ProtectionStoreError.conflict {}
    try store.update(expectedRevision: store.read()?.revision) { $0.owners[0].rewardJournal = journal }
    do { _ = try store.rewardsRead(owner: other); fatalError("B drained A") } catch ProtectionStoreError.staleLease {}
    // Restart keeps offered prefix and IDs; failed upload leaves the same batch.
    let reopened = SharedProtectionStore(directory: root)
    guard NSDictionary(dictionary: try reopened.rewardsRead(owner: owner)!).isEqual(to: first) else { fatalError("restart changed batch") }
    try reopened.rewardsAck(owner: owner, installation: journal.installationID, sequence: 36)
    try reopened.rewardsAck(owner: owner, installation: journal.installationID, sequence: 36)
    guard try reopened.read()!.owners[0].rewardJournal!.events.first?.sequence == 37 else { fatalError("ack removed future data") }
    let before = try reopened.read()!
    let failing = SharedProtectionStore(directory: root, beforeRename: { throw ProtectionStoreError.unavailable })
    do { _ = try failing.rewardsRead(owner: owner); fatalError("failed drain acknowledged") } catch ProtectionStoreError.unavailable {}
    guard try reopened.read() == before else { fatalError("failed write changed durable data") }
    var rollback = journal
    try rollback.append(grant: grant(261), revision: 1, clock: .init(wall: at - 1, elapsed: 1000, boot: "fixture"), timezone: "UTC")
    try rollback.append(grant: grant(262), revision: 1, clock: .init(wall: at + 1000, elapsed: 1000, boot: "fixture"), timezone: "Europe/London")
    guard rollback.discarded == 6, rollback.events == journal.events else { fatalError("clock/zone invented dated evidence") }
    var malformed = journal; malformed.issued = malformed.nextSequence
    do { try malformed.validated(); fatalError("invalid cursor accepted") } catch ProtectionStoreError.invalidRecord {}
    print("PASS: owner-isolated durable evidence, stable retry/restart, bounded drain/ack, overflow and clock/zone gaps; no invented quit/day/measurement evidence.")
  }
}
