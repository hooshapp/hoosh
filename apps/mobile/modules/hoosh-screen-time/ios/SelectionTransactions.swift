import Foundation

enum SelectionFailure: String, Error {
  case expired = "ERR_SELECTION_DRAFT_EXPIRED"
  case changed = "ERR_SELECTION_DRAFT_CHANGED"
  case conflict = "ERR_SELECTION_CONFLICT"
  case unavailable = "ERR_SELECTION_UNAVAILABLE"
  case cancelled = "ERR_SELECTION_CANCELLED"
}

/// Token equality is supplied natively; count equality never determines dirty state.
final class SelectionTransactions<Value: Codable & Equatable> {
  private struct Draft {
    let id: UUID
    let owner: ProtectionOwner
    let lease: UUID
    var revision: UInt64
    var version = 0
    var saved: Value
    var value: Value
    let expires: Date
  }
  private let store: SharedProtectionStore
  private let leases: ProtectionOwnerLeases
  private let empty: Value
  private let same: (Value, Value) -> Bool
  private let now: () -> Date
  private let count: (Value) throws -> Int
  private var draft: Draft?
  private let lock = NSLock()
  init(store: SharedProtectionStore, leases: ProtectionOwnerLeases, empty: Value, now: @escaping () -> Date = Date.init, same: @escaping (Value, Value) -> Bool = { $0 == $1 }, count: @escaping (Value) throws -> Int) {
    self.store = store; self.leases = leases; self.empty = empty; self.count = count; self.now = now; self.same = same
  }
  func read(owner: ProtectionOwner, token: UUID, authorized: Bool) throws -> [String: Any] {
    try leases.withLease(owner, token: token) {
      let record = try owned(owner)
      let saved = try decode(record.selection)
      return ["owner": key(owner), "revision": record.selection?.revision ?? 0,
              "selectedAppCount": try count(saved), "needsReselection": !authorized && record.selection != nil]
    }
  }
  func begin(owner: ProtectionOwner, token: UUID) throws -> [String: Any] {
    try leases.withLease(owner, token: token) {
      lock.lock(); defer { lock.unlock() }
      let record = try owned(owner), saved = try decode(record.selection)
      let value = Draft(id: UUID(), owner: owner, lease: token, revision: record.selection?.revision ?? 0,
                        saved: saved, value: saved, expires: now().addingTimeInterval(900))
      draft = value
      return try summary(value)
    }
  }
  func snapshot(owner: ProtectionOwner, token: UUID, id: UUID, version: Int) throws -> Value {
    try access(owner, token, id, version) { current in current.value }
  }
  func replace(owner: ProtectionOwner, token: UUID, id: UUID, version: Int, value: Value) throws -> [String: Any] {
    try access(owner, token, id, version) { current in
      _ = try count(value)
      guard current.version < 2147483647 else { throw SelectionFailure.expired }
      current.value = value
      current.version += 1
      return try summary(current)
    }
  }
  func commit(owner: ProtectionOwner, token: UUID, id: UUID, version: Int) throws -> [String: Any] {
    try access(owner, token, id, version) { current in
      guard let state = try store.read() else { throw SelectionFailure.unavailable }
      guard let index = state.owners.firstIndex(where: { $0.owner == owner }),
            (state.owners[index].selection?.revision ?? 0) == current.revision else { throw SelectionFailure.conflict }
      if !same(current.value, current.saved) {
        guard current.revision < 2147483647 else { throw SelectionFailure.unavailable }
        let encoded = try JSONEncoder().encode(current.value)
        let next = current.revision + 1
        let written = try store.update(expectedRevision: state.revision) { state in
          guard state.installedOwner == owner, state.pendingClaim == nil else { throw SelectionFailure.conflict }
          state.owners[index].selection = ProtectionSelection(revision: next, encodedTokens: encoded)
          // Installed reason snapshots are unchanged. C04 decides when to apply a new selection.
        }
        guard written.owners[index].selection?.encodedTokens == encoded else { throw SelectionFailure.unavailable }
        current.revision = next
        current.saved = current.value
      }
      return try summary(current)
    }
  }
  func release(owner: ProtectionOwner, token: UUID, id: UUID) throws {
    try leases.withLease(owner, token: token) {
      lock.lock(); defer { lock.unlock() }
      if draft?.id == id && draft?.owner == owner && draft?.lease == token { draft = nil }
    }
  }
  func invalidate() { lock.lock(); defer { lock.unlock() }; draft = nil }
  private func access<T>(_ owner: ProtectionOwner, _ token: UUID, _ id: UUID, _ version: Int,
                         _ action: (inout Draft) throws -> T) throws -> T {
    try leases.withLease(owner, token: token) {
      lock.lock(); defer { lock.unlock() }
      guard var current = draft, current.owner == owner, current.lease == token,
            current.id == id, current.expires > now() else { throw SelectionFailure.expired }
      guard current.version == version else { throw SelectionFailure.changed }
      let record = try owned(owner)
      guard (record.selection?.revision ?? 0) == current.revision else { throw SelectionFailure.conflict }
      let result = try action(&current)
      draft = current
      return result
    }
  }
  private func owned(_ owner: ProtectionOwner) throws -> ProtectionOwnerRecord {
    guard let state = try store.read(), state.pendingClaim == nil, state.installedOwner == owner,
          let record = state.owners.first(where: { $0.owner == owner }) else { throw SelectionFailure.unavailable }
    return record
  }
  private func decode(_ selection: ProtectionSelection?) throws -> Value {
    guard let selection else { return empty }
    guard let value = try? JSONDecoder().decode(Value.self, from: selection.encodedTokens) else { throw ProtectionStoreError.corrupt }
    _ = try count(value)
    return value
  }
  private func summary(_ draft: Draft) throws -> [String: Any] {
    ["draftId": draft.id.uuidString.lowercased(), "groupId": "global", "baseRevision": draft.revision,
     "draftVersion": draft.version, "selectedAppCount": try count(draft.value),
     "savedAppCount": try count(draft.saved), "dirty": !same(draft.value, draft.saved)]
  }
  private func key(_ owner: ProtectionOwner) -> String { "\(owner.namespace):\(owner.userID.uuidString.lowercased())" }
}
