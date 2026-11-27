#if os(iOS)
import Foundation
import FamilyControls
import ManagedSettings
import UserNotifications
import CryptoKit

/// Extension dispatch never trusts callback-supplied owner/reason identifiers.
/// Read the currently claimed generation and re-evaluate its persisted definitions.
enum ProtectionNativeEngine {
  static func monitor(_ name: String) {
    guard ProtectionActivationGate.enabled, name.hasPrefix("hoosh.shared.") else { return }
    do {
      let store = try SharedProtectionStore.appGroup()
      // startMonitoring may invoke the extension before the installer releases
      // the state lock. The installer applies the current shield itself.
      guard let snapshot = try store.presentationSnapshot(), let claimed = snapshot.installedOwner,
        snapshot.pendingClaim == nil,
        let installed = snapshot.owners.first(where: { $0.owner == claimed }),
        installed.pendingInstallation == nil, installed.installation?.enabled == true else { return }
      if name.contains(".usage.") {
        // Retiring the completed monitor can generate intervalDidEnd while the
        // next grant holds the store lock. Ignore closed monitors from the
        // committed snapshot before entering the locked reconciliation path.
        let clock = try ProtectionDeviceClock.sample()
        guard let ledger = installed.sessionLedger,
          ledger.sessions.contains(where: { session in
            session.usageBased && session.live(clock) &&
              name == ProtectionNativeDriver.usageMonitorName(owner: claimed, session: session) &&
              ledger.grants.contains { grant in
                grant.app == session.app && grant.boot == clock.boot &&
                  grant.wallEnd > clock.wall && grant.elapsedEnd > clock.elapsed
              }
          }) else { return }
      }
      let (owner, revision) = try current(store)
      if !name.contains(".usage.") {
        guard name.hasPrefix(ProtectionRuntimePlanner.prefix(owner) + "r\(revision).") else { return }
      } else if owner != claimed {
        return
      }
      try ProtectionRuntimeCoordinator(store: store).refresh(owner: owner, revision: revision,
        driver: ProtectionNativeDriver(owner: owner))
      syncNudges(owner: owner)
    } catch { /* No empty-state fallback, legacy mutation or fabricated success. */ }
  }

  static func usage(_ name: String, event: String) {
    guard ProtectionActivationGate.enabled, event.hasPrefix("usage."),
      let seconds = Int(event.dropFirst(6)), seconds > 0,
      let label = name.components(separatedBy: ".usage.").last?.split(separator: ".").first.map(String.init),
      let group = UUID(uuidString: label) else { return }
    do {
      let store = try SharedProtectionStore.appGroup()
      let (owner, revision) = try current(store)
      let clock = try ProtectionDeviceClock.sample()
      var reachedEnd = false
      var reminderRemaining: Int?
      var reminderLine: String?
      _ = try store.updateLatest { next in
        guard next.installedOwner == owner, next.pendingClaim == nil,
          let index = next.owners.firstIndex(where: { $0.owner == owner }),
          next.owners[index].pendingInstallation == nil,
          let runtime = next.owners[index].installation, runtime.enabled, runtime.revision == revision,
          var ledger = next.owners[index].sessionLedger,
          let session = ledger.sessions.first(where: { $0.usageBased && $0.usageGroup == group }),
          name == ProtectionNativeDriver.usageMonitorName(owner: owner, session: session),
          seconds > (session.usageOffsetSeconds ?? 0), seconds <= session.seconds else { return }
        let hasActiveGrant = ledger.grants.contains { grant in
          grant.revision == revision && grant.boot == clock.boot &&
            grant.wallEnd > clock.wall && grant.elapsedEnd > clock.elapsed &&
            ledger.sessions.contains { $0.app == grant.app && $0.usageGroup == group }
        }
        guard hasActiveGrant, try ledger.recordUsage(group: group, seconds: seconds, clock: clock) else { return }
        reachedEnd = seconds == session.seconds
        if session.nudgeSeconds.contains(seconds) {
          reminderRemaining = session.seconds - seconds
          let checkpoint = session.nudgeSeconds.firstIndex(of: seconds) ?? 0
          reminderLine = next.owners[index].nextNotificationLine(checkpoint: checkpoint, session: group,
            now: Date(timeIntervalSince1970: Double(clock.wall) / 1000))
        }
        next.owners[index].sessionLedger = ledger
      }
      if reachedEnd {
        // Prepare presentation after committing the usage checkpoint, before
        // the foreground app receives the re-applied restriction.
        let applied = try store.withSnapshot { latest -> Bool in
          guard let latest, latest.installedOwner == owner, latest.pendingClaim == nil,
            let record = latest.owners.first(where: { $0.owner == owner }),
            record.pendingInstallation == nil, let runtime = record.installation,
            let ledger = record.sessionLedger,
            runtime.enabled, runtime.revision == revision else { return false }
          let clock = try ProtectionDeviceClock.sample()
          let blocked = try ProtectionNativeDriver.blocked(runtime, ledger: ledger, clock: clock)
          guard !blocked.isEmpty else { return false }
          let now = Date(timeIntervalSince1970: Double(clock.wall) / 1000)
          let completed = ledger.sessions.filter {
            $0.usageBased && $0.usageGroup == group && $0.usageConsumedSeconds == $0.seconds
          }.compactMap { try? JSONDecoder().decode(ApplicationToken.self, from: $0.app) }
            .filter { blocked.contains($0) }
          // A newer grant may have replaced the finished session meanwhile.
          guard !completed.isEmpty else { return false }
          var cards: [Data: ProtectionShieldPresentation] = [:]
          for app in completed {
            guard let card = try? presentation(app, record: record, runtime: runtime, now: clock.wall),
              card.expired, let key = try? presentationKey(app) else { continue }
            cards[key] = card
          }
          // A presentation I/O error must never prevent the block.
          let snapshotWritten: Bool
          do {
            try store.saveExpiryPresentation(.init(preparedAt: now, apps: cards))
            snapshotWritten = true
          } catch {
            store.clearExpiryPresentation()
            snapshotWritten = false
          }
          try ProtectionOSAdapter.reapplyExpiredSessionShield(blocked)
          #if HOOSH_PHYSICAL_NUDGE_QA
          let qa = UserDefaults(suiteName: SharedProtectionStore.group)
          qa?.set(Date().timeIntervalSince1970, forKey: "hoosh.qa.expiryShieldSubmittedAt")
          qa?.set(seconds, forKey: "hoosh.qa.expiryDurationSeconds")
          qa?.set(snapshotWritten ? cards.count : 0, forKey: "hoosh.qa.expiryPreparedAppCount")
          #endif
          queueExpiryNotice(owner: owner)
          return true
        }
        // Match the Swift per-app implementation's order. A stopped monitor
        // may call back, so retire it after the shield write and outside the lock.
        if applied { try? ProtectionOSAdapter.retire([name]) }
      }
      if let remaining = reminderRemaining, remaining > 0, let recommendation = reminderLine {
        let content = UNMutableNotificationContent()
        content.title = "Tap to pause · +30 credits"
        let time = "\(max(1, (remaining + 59) / 60)) min left"
        content.body = "\(time) · \(recommendation)"
        content.categoryIdentifier = "hoosh.session.nudge"
        content.userInfo = ["ownerTag": ProtectionRuntimePlanner.prefix(owner), "group": group.uuidString, "checkpoint": seconds, "remainingSeconds": remaining, "recommendation": recommendation, "tapToPause": true]
        content.sound = .default
        UNUserNotificationCenter.current().add(UNNotificationRequest(
          identifier: "hoosh.shared.nudge." + ProtectionRuntimePlanner.prefix(owner) + group.uuidString + ".\(seconds)",
          content: content, trigger: nil))
      }
    } catch { /* Keep the persisted checkpoint; retry never consumes another session. */ }
  }

  private static func expiryNoticeID(owner: ProtectionOwner) -> String {
    "hoosh.session.complete." + ProtectionRuntimePlanner.prefix(owner)
  }

  private static func queueExpiryNotice(owner: ProtectionOwner) {
    let content = UNMutableNotificationContent()
    content.title = "Hoosh · Session complete"
    content.body = "Your app time is up. Tap to return to Hoosh."
    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3, repeats: false)
    UNUserNotificationCenter.current().add(UNNotificationRequest(
      identifier: expiryNoticeID(owner: owner), content: content, trigger: trigger))
  }

  static func suppressExpiryNotice() {
    guard let state = try? SharedProtectionStore.appGroup().presentationSnapshot(),
      let owner = state.installedOwner, state.pendingClaim == nil else { return }
    UNUserNotificationCenter.current().removePendingNotificationRequests(
      withIdentifiers: [expiryNoticeID(owner: owner)])
  }

  static func pauseForHostReturn() {
    guard ProtectionActivationGate.enabled else { return }
    do {
      let store = try SharedProtectionStore.appGroup()
      let (owner, revision) = try current(store)
      guard let before = try store.read(),
        let record = before.owners.first(where: { $0.owner == owner }),
        record.installation?.enabled == true else { return }
      if record.sessionLedger?.grants.isEmpty == false {
      _ = try store.update(expectedRevision: before.revision) { next in
        guard next.installedOwner == owner, next.pendingClaim == nil,
          let i = next.owners.firstIndex(where: { $0.owner == owner }),
          next.owners[i].pendingInstallation == nil, next.owners[i].installation?.revision == revision,
          var ledger = next.owners[i].sessionLedger else { return }
        for item in ledger.sessions { ledger.pause(app: item.app) }
        next.owners[i].sessionLedger = ledger
      }
      }
      // Reconcile an already enabled installation even with no live grant.
      // This restores entry shields and lost monitors; stopped plans remain stopped.
      try ProtectionRuntimeCoordinator(store: store).refresh(owner: owner, revision: revision, driver: ProtectionNativeDriver(owner: owner))
      syncNudges(owner: owner)
    } catch { /* No unconfirmed permission, counter reset or free allowance. */ }
  }

  static func respondToNotification(_ info: [AnyHashable: Any], accept: Bool) {
    guard ProtectionActivationGate.enabled,
      let tag = info["ownerTag"] as? String, let rawGroup = info["group"] as? String,
      let group = UUID(uuidString: rawGroup), let checkpoint = info["checkpoint"] as? Int else { return }
    do {
      let store = try SharedProtectionStore.appGroup()
      let (owner, revision) = try current(store)
      guard tag == ProtectionRuntimePlanner.prefix(owner) else { return }
      let clock = try ProtectionDeviceClock.sample()
      let before = try store.read()
      _ = try store.update(expectedRevision: before?.revision) { next in
        guard next.installedOwner == owner, next.pendingClaim == nil,
          let index = next.owners.firstIndex(where: { $0.owner == owner }),
          next.owners[index].pendingInstallation == nil,
          let runtime = next.owners[index].installation, runtime.revision == revision,
          var ledger = next.owners[index].sessionLedger,
          let session = ledger.sessions.first(where: { $0.usageBased && $0.usageGroup == group }),
          session.wallEnd > clock.wall,
          session.nudgeSeconds.contains(checkpoint),
          (session.usageConsumedSeconds ?? 0) >= checkpoint else { return }
        let digest = SHA256.hash(data: Data("\(group.uuidString):notification:\(checkpoint)".utf8)).prefix(16).map { String(format: "%02x", $0) }.joined()
        let encounter = UUID(uuidString: "\(digest.prefix(8))-\(digest.dropFirst(8).prefix(4))-\(digest.dropFirst(12).prefix(4))-\(digest.dropFirst(16).prefix(4))-\(digest.suffix(12))")!
        var journal = next.owners[index].rewardJournal ?? ProtectionRewardJournal(timezone: runtime.policy.timezoneId)
        try journal.appendChoice(encounter: encounter, context: accept ? "notification_accept" : nil,
          revision: revision, clock: clock)
        if accept {
          for item in ledger.sessions where item.usageGroup == group { ledger.pause(app: item.app) }
        }
        next.owners[index].rewardJournal = journal; next.owners[index].sessionLedger = ledger
      }
      if accept {
        try ProtectionRuntimeCoordinator(store: store).refresh(owner: owner, revision: revision, driver: ProtectionNativeDriver(owner: owner))
        syncNudges(owner: owner)
      }
    } catch { /* Stale notification cannot grant credit or change another owner. */ }
  }

  static func nudgeLine(index: Int? = nil, turn: Int? = nil) -> String {
    let record = (try? SharedProtectionStore.appGroup().presentationSnapshot()).flatMap { state in
      state.installedOwner.flatMap { owner in state.owners.first(where: { $0.owner == owner }) }
    }
    if let index, let line = record?.contextualLine(index, turn: turn ?? index) { return line }
    return record?.goalLine(index ?? 0) ?? "Take a breath and choose what to do next."
  }

  static func quit(_ app: ApplicationToken) {
    guard ProtectionActivationGate.enabled else { return }
    do {
      let store = try SharedProtectionStore.appGroup()
      let (owner, revision) = try current(store)
      let clock = try ProtectionDeviceClock.sample()
      let snapshot = try store.read()
      _ = try store.update(expectedRevision: snapshot?.revision) { state in
        guard state.installedOwner == owner, state.pendingClaim == nil,
          let index = state.owners.firstIndex(where: { $0.owner == owner }),
          state.owners[index].pendingInstallation == nil,
          let runtime = state.owners[index].installation, runtime.enabled, runtime.revision == revision else { throw ProtectionStoreError.staleLease }
        var record = state.owners[index]
        let key = try ProtectionNativeDriver.key(app, ledger: record.sessionLedger)
        guard try runtime.activeSnapshots.contains(where: {
          guard $0.active(at: clock.wall) else { return false }
          return try ProtectionNativeDriver.apps($0.selection).contains(app)
        }) else { return }
        let currentStart = runtime.activeSnapshots.filter { $0.active(at: clock.wall) }.map(\.startsAt).min() ?? clock.wall
        let session = record.sessionLedger?.sessions.first(where: { $0.app == key && $0.wallEnd > currentStart })
        let context = session.map { $0.remaining(clock) > 0 && $0.wallEnd > clock.wall ? "mid_session" : "expired" } ?? "initial"
        var journal = record.rewardJournal ?? ProtectionRewardJournal(timezone: runtime.policy.timezoneId)
        // Ignore duplicate OS delivery of the same tap in quick succession.
        if journal.lastQuitAt.map({ clock.wall - $0 >= 1000 }) ?? true {
          try journal.appendQuit(encounter: UUID(), context: context, revision: revision, clock: clock)
        }
        record.rewardJournal = journal
        // Preserve unused progress and daily count; remove this app's live grants.
        record.sessionLedger?.pause(app: key)
        state.owners[index] = record
      }
      try ProtectionRuntimeCoordinator(store: store).refresh(owner: owner, revision: revision, driver: ProtectionNativeDriver(owner: owner))
      syncNudges(owner: owner)
    } catch { /* Never invent credit confirmation when persistence fails. */ }
  }

  static func allow(_ app: ApplicationToken) -> Bool {
    guard #available(iOS 17.4, *), ProtectionActivationGate.enabled else { return false }
    var stage = "storage"
    do {
      let store = try SharedProtectionStore.appGroup()
      stage = "owner_read"
      let (owner, revision) = try current(store)
      stage = "clock"
      let clock = try ProtectionDeviceClock.sample()
      stage = "grant"
      let driver = ProtectionNativeDriver(owner: owner)
      try ProtectionRuntimeCoordinator(store: store).allow(owner: owner, revision: revision,
        driver: driver, clock: clock, usageBased: true, applyGrant: { runtime, ledger in
          stage = "unlock"
          try driver.applyAllowance(for: app, runtime: runtime, ledger: ledger)
        }) { runtime, ledger in
          let key = try ProtectionNativeDriver.key(app, ledger: ledger)
          let reasons = try runtime.activeSnapshots.filter {
            try ProtectionNativeDriver.apps($0.selection).contains(app)
          }.map { ProtectionSessionReason(id: $0.reasonID, startsAt: $0.startsAt, endsAt: $0.endsAt) }
          return (key, reasons)
        }
      #if HOOSH_PHYSICAL_NUDGE_QA
      UserDefaults(suiteName: SharedProtectionStore.group)?.removeObject(forKey: "hoosh.qa.allowanceFailure")
      #endif
      return true
    } catch {
      #if HOOSH_PHYSICAL_NUDGE_QA
      let failure: String
      if let value = error as? ProtectionTransactionError { failure = String(describing: value) }
      else if let value = error as? ProtectionStoreError { failure = String(describing: value) }
      else if let value = error as? SessionFailure { failure = String(describing: value) }
      else { let value = error as NSError; failure = "\(value.domain):\(value.code)" }
      UserDefaults(suiteName: SharedProtectionStore.group)?.set(stage + ":" + failure, forKey: "hoosh.qa.allowanceFailure")
      #endif
      return false
    }
  }

  /// Read-only presentation. No events, grants, rewards or counters on rendering.
  static func remainingSeconds(_ app: ApplicationToken) -> Int? {
    guard ProtectionActivationGate.enabled, AuthorizationCenter.shared.authorizationStatus == .approved else { return nil }
    do {
      let store = try SharedProtectionStore.appGroup()
      return try store.withSnapshot { state in
        guard let state, let owner = state.installedOwner, state.pendingClaim == nil,
          let record = state.owners.first(where: { $0.owner == owner }), record.pendingInstallation == nil,
          let saved = record.installation, saved.enabled else { return nil }
        let clock = try ProtectionDeviceClock.sample()
        let runtime = try ProtectionRuntimePlanner.resolve(saved, owner: owner, now: clock.wall).runtime
        let ledger = try record.sessionLedger ?? ProtectionSessionLedger(policy: runtime.policy)
        let key = try ProtectionNativeDriver.key(app, ledger: ledger)
        let reasons = try runtime.activeSnapshots.filter { try ProtectionNativeDriver.apps($0.selection).contains(app) }
        guard let earliest = reasons.map(\.endsAt).min() else { return nil }
        let live = ledger.sessions.first(where: { $0.app == key && $0.live(clock) })
        let milliseconds = min(earliest - clock.wall,
          live.map { Int64($0.remaining(clock)) * 1000 } ?? Int64(runtime.policy.sessionSeconds) * 1000)
        guard milliseconds > 0 else { return nil }
        return Int((milliseconds + 999) / 1000)
      }
    } catch { return nil }
  }

  private static func presentationKey(_ app: ApplicationToken) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    return try encoder.encode(app)
  }

  static func presentation(_ app: ApplicationToken) -> ProtectionShieldPresentation? {
    guard ProtectionActivationGate.enabled else { return nil }
    do {
      let store = try SharedProtectionStore.appGroup()
      let now = Date()
      if let prepared = store.expiryPresentation(for: try presentationKey(app), now: now) {
        return prepared
      }
      guard let state = try store.presentationSnapshot(), let owner = state.installedOwner,
        state.pendingClaim == nil,
        let record = state.owners.first(where: { $0.owner == owner }),
        let runtime = record.installation, runtime.enabled else { return nil }
      return try presentation(app, record: record, runtime: runtime,
        now: Int64(now.timeIntervalSince1970 * 1000))
    } catch { return nil }
  }

  private static func presentation(_ app: ApplicationToken, record: ProtectionOwnerRecord,
                                   runtime: ProtectionRuntimeRecord, now: Int64) throws -> ProtectionShieldPresentation? {
    let reasons = try runtime.activeSnapshots.filter {
      guard $0.startsAt <= now && now < $0.endsAt else { return false }
      return try ProtectionNativeDriver.apps($0.selection).contains(app)
    }
    guard !reasons.isEmpty else { return nil }
    let key = try ProtectionNativeDriver.key(app, ledger: record.sessionLedger)
    let ledger = record.sessionLedger
    let currentStart = reasons.map(\.startsAt).min() ?? now
    let prior = ledger?.sessions.first(where: { $0.app == key && $0.wallEnd > currentStart })
    let expired = prior.map { $0.usageBased ? ($0.usageConsumedSeconds ?? 0) >= $0.seconds || $0.wallEnd <= now : $0.wallEnd <= now } ?? false
    let remaining = prior.flatMap { $0.usageBased && !expired ? max(0, $0.seconds - ($0.usageConsumedSeconds ?? 0)) : nil }
    let used = try ledger?.usedSessions(app: key, wall: now) ?? 0
    let canResume = remaining.map { $0 > 0 } == true
    let granted = canResume && reasons.allSatisfy { reason in
      ledger?.grants.contains {
        $0.app == key && $0.revision == runtime.revision && $0.reasonID == reason.reasonID && $0.wallEnd > now
      } == true
    }
    let allowanceApplied = granted && !ProtectionOSAdapter.isBlocked(app)
    return ProtectionShieldPresentation(name: record.shieldName, activity: record.goalLabel,
      generatedLine: record.contextualLine(expired ? 2 : (canResume ? 1 : 0), turn: used + (canResume ? 1 : 0), isShield: true), expired: expired, resuming: canResume,
      seconds: remaining ?? runtime.policy.sessionSeconds,
      canContinue: canResume || used < runtime.policy.sessionsPerDay,
      allowanceApplied: allowanceApplied, used: min(max(0, used - (canResume ? 1 : 0)), runtime.policy.sessionsPerDay), limit: runtime.policy.sessionsPerDay, rewardPoints: prior == nil ? 5 : 20)
  }
  /// Standard iOS notifications; no content/scroll inspection and no fabricated rewards.
  static func syncNudges(owner: ProtectionOwner) {
    guard let store = try? SharedProtectionStore.appGroup(), let state = try? store.read(),
      state.installedOwner == owner, state.pendingClaim == nil,
      let record = state.owners.first(where: { $0.owner == owner }),
      record.pendingInstallation == nil, let clock = try? ProtectionDeviceClock.sample() else { return }
    let revision = state.revision
    let prefix = "hoosh.shared.nudge." + ProtectionRuntimePlanner.prefix(owner)
    let runtime = record.installation.flatMap { try? ProtectionRuntimePlanner.resolve($0, owner: owner, now: clock.wall).runtime }
    let reasons = Set(runtime?.activeSnapshots.map(\.reasonID) ?? [])
    let ledger = record.sessionLedger
    var requests: [UNNotificationRequest] = []
    for session in ledger?.sessions ?? [] where runtime?.enabled == true && !session.usageBased && session.live(clock) {
      guard ledger?.grants.contains(where: { $0.app == session.app && reasons.contains($0.reasonID) && $0.wallEnd > clock.wall }) == true else { continue }
      let reasonEnd = ledger?.grants.filter { $0.app == session.app && reasons.contains($0.reasonID) }.map(\.wallEnd).min() ?? clock.wall
      for checkpoint in session.nudgeSeconds {
        let deadline = session.wallEnd - Int64(session.seconds - checkpoint) * 1000
        let delay = Double(deadline - clock.wall) / 1000
        guard delay >= 1, deadline < reasonEnd else { continue }
        let content = UNMutableNotificationContent()
        content.title = "Hoosh · check-point"
        let minutes = max(1, Int(ceil(Double(session.wallEnd - deadline) / 60000)))
        content.body = "About \(minutes) min left in this session. \(nudgeLine()) Open Hoosh when you’re ready to pause."
        content.sound = .default
        let id = prefix + session.id.uuidString + ".\(checkpoint)"
        requests.append(UNNotificationRequest(identifier: id, content: content,
          trigger: UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)))
      }
    }
    let center = UNUserNotificationCenter.current()
    center.getPendingNotificationRequests { pending in
      guard let latest = try? store.read(), latest.installedOwner == owner, latest.revision == revision else { return }
      let desired = Set(requests.map(\.identifier))
      center.removePendingNotificationRequests(withIdentifiers: pending.filter { $0.identifier.hasPrefix(prefix) && !desired.contains($0.identifier) }.map(\.identifier))
      let existing = Set(pending.map(\.identifier))
      for request in requests where !existing.contains(request.identifier) { center.add(request) }
    }
  }

  private static func current(_ store: SharedProtectionStore) throws -> (ProtectionOwner, Int) {
    guard let state = try store.read(), let owner = state.installedOwner, state.pendingClaim == nil,
      let record = state.owners.first(where: { $0.owner == owner }), record.pendingInstallation == nil,
      let runtime = record.installation, runtime.enabled else { throw ProtectionStoreError.staleLease }
    return (owner, runtime.revision)
  }
}
#endif
