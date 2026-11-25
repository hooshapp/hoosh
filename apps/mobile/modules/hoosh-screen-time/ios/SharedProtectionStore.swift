import Foundation
import Darwin

// Foundation-only: extension targets can compile this same source without Expo.
// Native selection bytes never cross the JavaScript bridge.
enum ProtectionStoreError: Error, Equatable {
  case unavailable, locked, corrupt, newerVersion, oversized, conflict, invalidRecord, staleLease
}

struct ProtectionOwner: Codable, Equatable {
  let namespace: String
  let userID: UUID
}
struct ProtectionSelection: Codable, Equatable {
  let revision: UInt64
  let encodedTokens: Data
}
struct ProtectionReason: Codable, Equatable {
  let id: String
  let policyRevision: String
  let selectionRevision: UInt64
  let scheduleName: String
}
struct ProtectionAllowance: Codable, Equatable {
  let reasonID: String
  let deadline: Date
  let day: String
  let timezone: String
}
struct ProtectionReceipt: Codable, Equatable {
  let requestID: UUID
  let revision: UInt64
  let cancelled: Bool
  var fingerprint: Data? = nil
}
struct ProtectionBusinessEvent: Codable, Equatable {
  let id: UUID
  let sequence: UInt64
  let reasonID: String
  let kind: String
  let occurredAt: Date
}
struct ProtectionOwnerRecord: Codable, Equatable {
  let owner: ProtectionOwner
  var selection: ProtectionSelection?
  var reasons: [ProtectionReason] = []
  var allowances: [ProtectionAllowance] = []
  var receipts: [ProtectionReceipt] = []
  var events: [ProtectionBusinessEvent] = []
  var installation: ProtectionRuntimeRecord?
  var pendingInstallation: ProtectionPendingInstallation?
  var sessionLedger: ProtectionSessionLedger?
  var coverage: String = "unknown"
  var nudgeTone: String? = nil
  var shieldName: String? = nil
  var shieldActivity: String? = nil
  var rewardJournal: ProtectionRewardJournal?
}
struct ProtectionClaim: Codable, Equatable {
  let id: UUID
  let previousOwner: ProtectionOwner?
  let nextOwner: ProtectionOwner
  // A pending claim does not authorize a new installation. C04 must verify Stop.
  var phase: String = "awaiting_stop"
}
struct ProtectionState: Codable, Equatable {
  var version: Int = 4
  var revision: UInt64 = 0
  var legacyStopped: Bool?
  var installedOwner: ProtectionOwner?
  var pendingClaim: ProtectionClaim?
  var owners: [ProtectionOwnerRecord] = []

  var permitsLegacyCallbacks: Bool { pendingClaim == nil && legacyStopped != true && installedOwner == nil }

  func validated() throws {
    guard (1...4).contains(version) else { throw version > 4 ? ProtectionStoreError.newerVersion : .corrupt }
    guard owners.count <= 16, Set(owners.map { "\($0.owner.namespace):\($0.owner.userID)" }).count == owners.count,
          installedOwner == nil || owners.contains(where: { $0.owner == installedOwner }),
          pendingClaim == nil || (pendingClaim?.previousOwner == installedOwner && pendingClaim?.phase == "awaiting_stop") else { throw ProtectionStoreError.invalidRecord }
    for record in owners {
      guard record.nudgeTone == nil || ["Supportive", "Direct", "Playful", "Intense"].contains(record.nudgeTone!) else { throw ProtectionStoreError.invalidRecord }
      if version < 4 && record.rewardJournal != nil { throw ProtectionStoreError.invalidRecord }
      try record.rewardJournal?.validated()
      if version == 1 && (record.installation != nil || record.pendingInstallation != nil || record.sessionLedger != nil || record.receipts.contains(where: { $0.fingerprint != nil })) {
        throw ProtectionStoreError.invalidRecord
      }
      if version < 3 && (record.installation?.weeklyEnabled != nil || record.pendingInstallation?.target.weeklyEnabled != nil || record.installation?.quests.contains(where: { $0.requestID != nil }) == true) {
        throw ProtectionStoreError.invalidRecord
      }
      if let installed = record.installation { try installed.validated() }
      if let pending = record.pendingInstallation {
        try pending.target.validated()
        guard pending.fingerprint.count == 32, !record.receipts.contains(where: { $0.requestID == pending.requestID }),
              pending.target.revision == (record.installation?.revision ?? 0) + 1 else { throw ProtectionStoreError.invalidRecord }
      }
      guard record.receipts.allSatisfy({ $0.fingerprint == nil || $0.fingerprint?.count == 32 }) else { throw ProtectionStoreError.invalidRecord }
      guard !record.owner.namespace.isEmpty, record.owner.namespace.utf8.count <= 256,
            record.reasons.count <= 256, record.allowances.count <= 256,
            record.receipts.count <= 512, record.events.count <= 2048,
            record.selection?.encodedTokens.count ?? 0 <= 262144,
            record.selection == nil || (record.selection!.revision > 0 && record.selection!.revision <= 2147483647),
            ["unknown", "partial", "observed", "unavailable"].contains(record.coverage),
            Set(record.reasons.map(\.id)).count == record.reasons.count,
            Set(record.receipts.map(\.requestID)).count == record.receipts.count,
            Set(record.events.map(\.id)).count == record.events.count else { throw ProtectionStoreError.invalidRecord }
      for reason in record.reasons {
        guard !reason.id.isEmpty, reason.id.utf8.count <= 256, reason.policyRevision.utf8.count <= 256,
              !reason.scheduleName.isEmpty, reason.scheduleName.utf8.count <= 256,
              reason.selectionRevision > 0, reason.selectionRevision <= (record.selection?.revision ?? 0) else { throw ProtectionStoreError.invalidRecord }
      }
      for allowance in record.allowances {
        guard record.reasons.contains(where: { $0.id == allowance.reasonID }),
              allowance.day.count == 10, TimeZone(identifier: allowance.timezone) != nil,
              allowance.deadline.timeIntervalSince1970.isFinite else { throw ProtectionStoreError.invalidRecord }
      }
      var last: UInt64 = 0
      for event in record.events {
        guard event.sequence > last, !event.kind.isEmpty, event.kind.utf8.count <= 128,
              event.reasonID.utf8.count <= 256, event.occurredAt.timeIntervalSince1970.isFinite else { throw ProtectionStoreError.invalidRecord }
        last = event.sequence
      }
    }
  }
}

/// One lock file + atomic renamed state file. Never remove/replace the lock inode.
/// Missing is nil; unreadable/corrupt/newer records throw and are never reset.
final class SharedProtectionStore {
  static let group = "group.com.AnishaDasgupta.DisconnectApp"
  static let maximumBytes = 2 * 1024 * 1024
  private let directory: URL
  private let beforeRename: (() throws -> Void)?
  init(directory: URL, beforeRename: (() throws -> Void)? = nil) {
    self.directory = directory
    self.beforeRename = beforeRename
  }
  #if os(iOS)
  static func appGroup() throws -> SharedProtectionStore {
    guard let root = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group) else {
      throw ProtectionStoreError.unavailable
    }
    return SharedProtectionStore(directory: root.appendingPathComponent("SharedProductProtection", isDirectory: true))
  }
  #endif
  func read() throws -> ProtectionState? { try locked { try readLocked() } }
  /// Rendering only: writers atomically rename a complete state file. Avoid
  /// filesystem mutations and waiting on another process's transaction lock.
  /// Never use this snapshot to authorize or commit an action.
  func presentationSnapshot() throws -> ProtectionState? { try readLocked() }
  func withSnapshot<T>(_ action: (ProtectionState?) throws -> T) throws -> T {
    try locked { try action(try readLocked()) }
  }
  @discardableResult
  func update(expectedRevision: UInt64?, _ edit: (inout ProtectionState) throws -> Void) throws -> ProtectionState {
    try locked {
      let previous = try readLocked()
      guard previous?.revision == expectedRevision else { throw ProtectionStoreError.conflict }
      var next = previous ?? ProtectionState()
      try edit(&next)
      guard next.version == (previous?.version ?? 4), next.revision == (previous?.revision ?? 0),
            next.revision < UInt64.max else { throw ProtectionStoreError.invalidRecord }
      next.revision += 1
      next.version = 4 // Upgrade only as part of an atomic successful write.
      try next.validated()
      let encoder = JSONEncoder()
      encoder.outputFormatting = [.sortedKeys]
      let data = try encoder.encode(next)
      guard data.count <= Self.maximumBytes else { throw ProtectionStoreError.oversized }
      let temporary = directory.appendingPathComponent("pending-\(UUID().uuidString)")
      defer { try? FileManager.default.removeItem(at: temporary) }
      try data.write(to: temporary, options: .withoutOverwriting)
      try protect(temporary)
      let fd = open(temporary.path, O_RDONLY)
      guard fd >= 0 else { throw ioError() }
      defer { close(fd) }
      guard fsync(fd) == 0 else { throw ioError() }
      try beforeRename?()
      guard rename(temporary.path, stateURL.path) == 0 else { throw ioError() }
      // Persist directory metadata as well as contents. A failure requires readback;
      // callers must not retry with a new request ID and assume the write was absent.
      let parent = open(directory.path, O_RDONLY)
      guard parent >= 0 else { throw ioError() }
      defer { close(parent) }
      guard fsync(parent) == 0 else { throw ioError() }
      guard try readLocked() == next else { throw ProtectionStoreError.corrupt }
      return next
    }
  }
  // Keep one path across schemas: an older reader must see a newer header,
  // not a missing file that could be mistaken for an empty installation.
  private var stateURL: URL { directory.appendingPathComponent("state-v1.json") }
  private func readLocked() throws -> ProtectionState? {
    do {
      let attributes = try FileManager.default.attributesOfItem(atPath: stateURL.path)
      guard let size = attributes[.size] as? NSNumber, size.intValue <= Self.maximumBytes else { throw ProtectionStoreError.oversized }
      let data = try Data(contentsOf: stateURL)
      guard data.count <= Self.maximumBytes else { throw ProtectionStoreError.oversized }
      struct Header: Decodable { let version: Int }
      guard let header = try? JSONDecoder().decode(Header.self, from: data) else { throw ProtectionStoreError.corrupt }
      guard (1...4).contains(header.version) else { throw header.version > 4 ? ProtectionStoreError.newerVersion : .corrupt }
      guard let state = try? JSONDecoder().decode(ProtectionState.self, from: data) else { throw ProtectionStoreError.corrupt }
      try state.validated()
      return state
    } catch let error as ProtectionStoreError { throw error }
    catch {
      let ns = error as NSError
      if ns.domain == NSCocoaErrorDomain && [NSFileNoSuchFileError, NSFileReadNoSuchFileError].contains(ns.code) { return nil }
      if ns.domain == NSCocoaErrorDomain && ns.code == NSFileReadNoPermissionError { throw ProtectionStoreError.locked }
      throw ProtectionStoreError.unavailable
    }
  }
  private func locked<T>(_ action: () throws -> T) throws -> T {
    do {
      try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      try protect(directory)
    } catch {
      let ns = error as NSError
      if ns.domain == NSCocoaErrorDomain && [NSFileReadNoPermissionError, NSFileWriteNoPermissionError].contains(ns.code) {
        throw ProtectionStoreError.locked
      }
      throw ProtectionStoreError.unavailable
    }
    let fd = open(directory.appendingPathComponent("state.lock").path, O_CREAT | O_RDWR, S_IRUSR | S_IWUSR)
    guard fd >= 0 else { throw ioError() }
    defer { close(fd) }
    try protect(directory.appendingPathComponent("state.lock"))
    guard flock(fd, LOCK_EX) == 0 else { throw ioError() }
    defer { _ = flock(fd, LOCK_UN) }
    // A killed writer can leave a temporary file, never a partial committed file.
    // Under the same lock, no live writer can own one of these leftovers.
    for url in try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil) {
      let name = url.lastPathComponent
      if name.hasPrefix("pending-"), UUID(uuidString: String(name.dropFirst(8))) != nil {
        try FileManager.default.removeItem(at: url)
      }
    }
    return try action()
  }
  private func protect(_ url: URL) throws {
    #if os(iOS)
    try FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: url.path)
    #endif
  }
  private func ioError() -> ProtectionStoreError {
    errno == EACCES || errno == EPERM ? .locked : .unavailable
  }
}

/// Bridge-lifetime authority, deliberately never serialized. Login does not claim
/// installed state. Out-of-order cleanup cannot invalidate a replacement lease.
final class ProtectionOwnerLeases {
  private let lock = NSLock()
  private var active: (owner: ProtectionOwner, token: UUID)?
  func begin(_ owner: ProtectionOwner) -> UUID {
    lock.lock(); defer { lock.unlock() }
    let token = UUID()
    active = (owner, token)
    return token
  }
  func withLease<T>(_ owner: ProtectionOwner, token: UUID, _ action: () throws -> T) throws -> T {
    lock.lock(); defer { lock.unlock() }
    guard active?.owner == owner, active?.token == token else { throw ProtectionStoreError.staleLease }
    return try action()
  }
  func require(_ owner: ProtectionOwner, token: UUID) throws {
    lock.lock(); defer { lock.unlock() }
    guard active?.owner == owner, active?.token == token else { throw ProtectionStoreError.staleLease }
  }
  func end(_ token: UUID) {
    lock.lock(); defer { lock.unlock() }
    if active?.token == token { active = nil }
  }
  func destroy() {
    lock.lock(); defer { lock.unlock() }
    active = nil
  }
}

#if os(iOS)
/// Called while the store lock is held, including delayed extension callbacks.
/// Unreadable/newer state fails closed: preserve restrictions, do not use pilot data.
enum SharedProtectionExtensionFence {
  static func withLegacyAccess(_ action: () -> Void) -> Bool {
    do {
      let store = try SharedProtectionStore.appGroup()
      return try store.withSnapshot { state in
        guard state?.permitsLegacyCallbacks ?? true else { return false }
        action()
        return true
      }
    } catch { return false }
  }
}
#endif

/// Content-free, owner-local evidence. A consumed allowance is not a confirmed
/// quit, complete day, Screen Time measurement or proof the SDK installed it.
struct ProtectionRewardEvidence: Codable, Equatable {
  let id: UUID
  let sequence: UInt64
  let occurredAt: Int64
  let day: String
  let exhausted: Bool
  let revision: Int
  let evidence: String
  var encounterID: UUID? = nil
  var context: String? = nil
}
struct ProtectionRewardJournal: Codable, Equatable {
  static let maximum: UInt64 = 9007199254740991
  let installationID: UUID
  let timezone: String
  var nextSequence: UInt64 = 1
  var acknowledged: UInt64 = 0
  var issued: UInt64 = 0
  var discarded: UInt64 = 0
  var lastTimestamp: Int64 = 0
  var events: [ProtectionRewardEvidence] = []
  var quitEncounters: [UUID]? = nil
  var lastQuitAt: Int64? = nil
  init(timezone: String) { self.installationID = UUID(); self.timezone = timezone }
  func validated() throws {
    guard TimeZone(identifier: timezone) != nil, timezone.utf8.count <= 128,
      nextSequence > 0, nextSequence <= Self.maximum,
      acknowledged <= issued, issued < nextSequence, discarded <= Self.maximum,
      lastTimestamp >= 0, lastTimestamp <= 4102444800000,
      events.count <= 256, Set(events.map(\.id)).count == events.count,
      (quitEncounters?.count ?? 0) <= 512 else { throw ProtectionStoreError.invalidRecord }
    var last = acknowledged, timestamp: Int64 = 0
    for event in events {
      guard event.sequence > last, event.sequence < nextSequence, event.occurredAt >= timestamp,
        event.occurredAt <= lastTimestamp, event.occurredAt >= 0,
        event.day == Self.day(event.occurredAt, timezone: timezone),
        (1...2147483647).contains(event.revision), ["allowance_consumed", "quit_selected", "nudge_skipped"].contains(event.evidence),
        event.evidence != "nudge_skipped" || (event.encounterID != nil && event.context == nil),
        event.evidence != "quit_selected" || (event.encounterID != nil && ["initial", "mid_session", "expired", "notification_accept"].contains(event.context ?? "")) else { throw ProtectionStoreError.invalidRecord }
      last = event.sequence; timestamp = event.occurredAt
    }
  }
  static func day(_ at: Int64, timezone: String) -> String {
    let formatter = DateFormatter(); formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.timeZone = TimeZone(identifier: timezone)
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date(timeIntervalSince1970: Double(at) / 1000))
  }
  mutating func append(grant: ProtectionGrantResult, revision: Int, clock: ProtectionClock, timezone: String) throws {
    guard grant.startedNewSession, let exhausted = grant.exhausted else { return }
    try clock.validate()
    guard nextSequence < Self.maximum, discarded < Self.maximum else { throw ProtectionStoreError.oversized }
    let sequence = nextSequence; nextSequence += 1
    // Clock rollback or a changed policy zone is an explicit evidence gap, never
    // a shifted date, new installation identity or fabricated healthy day.
    guard clock.wall >= lastTimestamp, timezone == self.timezone else { discarded += 1; return }
    if events.count == 256 { events.removeFirst(); discarded += 1 }
    events.append(.init(id: grant.session.id, sequence: sequence, occurredAt: clock.wall,
      day: Self.day(clock.wall, timezone: timezone), exhausted: exhausted,
      revision: revision, evidence: "allowance_consumed"))
    lastTimestamp = clock.wall
    try validated()
  }
  /// Reward evidence is the explicit Quit action, not an inferred app-exit callback.
  mutating func appendQuit(encounter: UUID, context: String, revision: Int, clock: ProtectionClock) throws {
    guard ["initial", "mid_session", "expired", "notification_accept"].contains(context) else { return }
    try appendChoice(encounter: encounter, context: context, revision: revision, clock: clock)
  }
  mutating func appendChoice(encounter: UUID, context: String?, revision: Int, clock: ProtectionClock) throws {
    try clock.validate()
    guard !(quitEncounters ?? []).contains(encounter),
      clock.wall >= lastTimestamp else { return }
    guard nextSequence < Self.maximum else { throw ProtectionStoreError.oversized }
    if events.count == 256 { events.removeFirst(); discarded += 1 }
    events.append(.init(id: UUID(), sequence: nextSequence, occurredAt: clock.wall,
      day: Self.day(clock.wall, timezone: timezone), exhausted: false, revision: revision,
      evidence: context == nil ? "nudge_skipped" : "quit_selected", encounterID: encounter, context: context))
    nextSequence += 1; lastTimestamp = clock.wall
    if context != nil { lastQuitAt = clock.wall }
    quitEncounters = Array(((quitEncounters ?? []) + [encounter]).suffix(512))
    try validated()
  }
  mutating func batch() throws -> [String: Any] {
    try validated()
    let prefix = Array(events.prefix(32))
    if let last = prefix.last { issued = max(issued, last.sequence) }
    let formatter = ISO8601DateFormatter(); formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return ["installation_id": installationID.uuidString.lowercased(), "timezone_id": timezone,
      "discarded": discarded, "acknowledged": acknowledged, "events": prefix.map { event -> [String: Any] in
        ["event_id": event.id.uuidString.lowercased(), "sequence": event.sequence,
         "occurred_at": formatter.string(from: Date(timeIntervalSince1970: Double(event.occurredAt) / 1000)),
         "kind": event.evidence == "quit_selected" ? "quit" : event.evidence == "nudge_skipped" ? "nudge_skipped" : "allowance", "day": event.day,
         "encounter_id": event.encounterID.map { $0.uuidString.lowercased() as Any } ?? NSNull(),
         "context": event.context.map { $0 as Any } ?? NSNull(),
         "exhausted": event.evidence == "allowance_consumed" ? event.exhausted as Any : NSNull(), "covered": NSNull()]
      }]
  }
  mutating func ack(installation: UUID, sequence: UInt64) throws {
    guard installation == installationID, sequence > 0, sequence <= issued else { throw ProtectionStoreError.conflict }
    if sequence <= acknowledged { return }
    // Only acknowledge a prefix actually offered to the host, never future data.
    guard events.contains(where: { $0.sequence == sequence }) else { throw ProtectionStoreError.conflict }
    events.removeAll { $0.sequence <= sequence }; acknowledged = sequence
    try validated()
  }
}

extension SharedProtectionStore {
  func rewardsRead(owner: ProtectionOwner) throws -> [String: Any]? {
    guard let snapshot = try read() else { return nil }
    guard snapshot.pendingClaim == nil, snapshot.installedOwner == owner,
      let record = snapshot.owners.first(where: { $0.owner == owner }) else { throw ProtectionStoreError.staleLease }
    guard record.rewardJournal != nil else { return nil }
    var result: [String: Any]?
    try update(expectedRevision: snapshot.revision) { state in
      guard state.pendingClaim == nil, state.installedOwner == owner,
        let i = state.owners.firstIndex(where: { $0.owner == owner }) else { throw ProtectionStoreError.staleLease }
      guard var journal = state.owners[i].rewardJournal else { return }
      result = try journal.batch(); state.owners[i].rewardJournal = journal
    }
    return result
  }
  func rewardsAck(owner: ProtectionOwner, installation: UUID, sequence: UInt64) throws {
    try update(expectedRevision: read()?.revision) { state in
      guard state.pendingClaim == nil, state.installedOwner == owner,
        let i = state.owners.firstIndex(where: { $0.owner == owner }),
        var journal = state.owners[i].rewardJournal else { throw ProtectionStoreError.staleLease }
      try journal.ack(installation: installation, sequence: sequence)
      state.owners[i].rewardJournal = journal
    }
  }
}
