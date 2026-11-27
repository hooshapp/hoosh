import Foundation
import Darwin

struct ProtectionShieldPresentation: Codable, Equatable {
  let name: String?
  let activity: String?
  let generatedLine: String?
  let expired: Bool
  let resuming: Bool
  let seconds: Int
  let canContinue: Bool
  let allowanceApplied: Bool
  let used: Int
  let limit: Int
  let rewardPoints: Int
}

struct ProtectionExpiryPresentation: Codable, Equatable {
  let preparedAt: Date
  let apps: [Data: ProtectionShieldPresentation]

  func presentation(for app: Data, now: Date) -> ProtectionShieldPresentation? {
    guard (0..<30).contains(now.timeIntervalSince(preparedAt)) else { return nil }
    return apps[app]
  }
}

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
struct ProtectionPublicHoliday: Codable, Equatable {
  let name: String
  let startsAt: Date
  let endsAt: Date
}

struct ProtectionNudgeCopy: Codable, Equatable {
  let activity: String
  let tone: String
  let messages: [String]
  let expiresAt: Date
}

private enum SessionNudgeKind: String, Codable {
  case calendar, dino, goal, quest
}

struct ProtectionSessionNudgePlan: Codable, Equatable {
  let session: UUID
  let hasCalendarEvent: Bool
  let dinoLow: Bool

  fileprivate var order: [SessionNudgeKind] {
    switch (hasCalendarEvent, dinoLow) {
    case (true, true): [.calendar, .dino, .goal]
    case (true, false): [.calendar, .dino, .quest]
    case (false, true): [.dino, .goal, .quest]
    case (false, false): [.goal, .quest, .dino]
    }
  }
}

struct ProtectionCalendarEvent: Codable, Equatable {
  let startsAt: Date
  let endsAt: Date?
  let title: String?

  func isEligible(at now: Date) -> Bool {
    if let endsAt, endsAt <= now { return false }
    if startsAt <= now { return endsAt != nil }
    return startsAt.timeIntervalSince(now) <= 86400
  }

  static func nudgeTitle(_ text: String?) -> String? {
    guard let text else { return nil }
    let trimmed = text.components(separatedBy: .whitespacesAndNewlines.union(.controlCharacters))
      .filter { !$0.isEmpty }.joined(separator: " ")
    if trimmed.isEmpty { return nil }
    return trimmed.count <= 34 ? trimmed : String(trimmed.prefix(33)) + "…"
  }
}

struct ProtectionAppleReminder: Codable, Equatable {
  let title: String
  let dueDate: Date?

  func isEligible(at now: Date, calendar: Calendar) -> Bool {
    guard let dueDate else { return true }
    return dueDate <= now || calendar.isDate(dueDate, inSameDayAs: now)
  }
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
  var nudgeTurn: Int?
  var recentNudgeLines: [String]?
  var dinoLowUntil: Date?
  var dinoWarningAt: Date?
  var calendarNudges: Bool?
  var calendarEventAt: Date?
  var googleCalendarID: String?
  var googleCalendarEventAt: Date?
  var directGoogleCalendarEventAt: Date?
  var appleCalendarEvents: [ProtectionCalendarEvent]?
  var syncedGoogleCalendarEvents: [ProtectionCalendarEvent]?
  var directGoogleCalendarEvents: [ProtectionCalendarEvent]?
  var googleTaskTitles: [String]?
  var googleTasksRefreshedAt: Date?
  var appleRemindersEnabled: Bool?
  var appleReminders: [ProtectionAppleReminder]?
  var appleRemindersRefreshedAt: Date?
  var appleRemindersConnectionID: UUID?
  var googleTaskTurn: Int?
  var lastCalendarNudgeWasTask: Bool?
  var lastBlackFridayNudge: Int?
  var publicHoliday: ProtectionPublicHoliday?
  var holidayNudgeMessages: [String]?
  var lastHolidayNudge: ProtectionPublicHoliday?
  var sessionNudgePlans: [ProtectionSessionNudgePlan]?

  private struct UpcomingCalendarEvent {
    let provider: String
    let event: ProtectionCalendarEvent
  }

  private func dinoNeedsCare(at now: Date) -> Bool {
    (dinoLowUntil ?? .distantPast) > now || dinoWarningAt.map { $0 <= now } == true
  }
  func contextualLine(_ index: Int, turn: Int, isShield: Bool = false, now: Date = Date()) -> String {
    let goal = generatedLine(index) ?? goalLine(index)
    let quest = isShield
      ? "Try a quest in Hoosh. Schedule and complete it to earn 50 credits."
      : "Save a quest idea. Finish the quest for 50 credits."
    let low = dinoNeedsCare(at: now)
    let slot = max(0, turn)
    let cycleLength = low ? 6 : 8
    let events = upcomingCalendarEvents(at: now)
    let calendarTurn = slot / cycleLength
    let calendar = events.isEmpty ? goal : calendarNudge(
      events[calendarTurn % events.count], now: now, turn: calendarTurn / events.count)
    if low {
      let cycle = ["Dino needs care. Take a break to earn food credits.", goal,
        "Dino is low on energy. Pause to help.", quest,
        "Dino could use a meal. Step away for a bit.", calendar]
      return cycle[slot % cycle.count]
    }
    let cycle = [goal, quest, calendar, goal, "Take a break to help feed Dino.", goal, quest, goal]
    return cycle[slot % cycle.count]
  }
  private func upcomingCalendarEvents(at now: Date) -> [UpcomingCalendarEvent] {
    func legacy(_ start: Date?) -> [ProtectionCalendarEvent] {
      start.map { [ProtectionCalendarEvent(startsAt: $0, endsAt: nil, title: nil)] } ?? []
    }
    let syncedGoogle = googleCalendarID == nil ? [] : syncedGoogleCalendarEvents ?? legacy(googleCalendarEventAt)
    let directGoogle = directGoogleCalendarEvents ?? legacy(directGoogleCalendarEventAt)
    let candidates: [(String, [ProtectionCalendarEvent])] = [
      ("Apple Calendar", calendarNudges == true ? appleCalendarEvents ?? legacy(calendarEventAt) : []),
      ("Google Calendar", directGoogle.isEmpty ? syncedGoogle : directGoogle),
    ]
    return candidates.compactMap { provider, events in
      // Source snapshots are ordered by start time. An ongoing event takes precedence.
      guard let event = events.first(where: { $0.isEligible(at: now) }) else { return nil }
      return UpcomingCalendarEvent(provider: provider, event: event)
    }
  }

  private func calendarLead(_ event: UpcomingCalendarEvent, now: Date) -> String {
    let name = event.event.title
    if event.event.startsAt <= now {
      return name.map { "\($0) is on now." } ?? "You have an event now."
    }
    let minutes = max(1, Int(ceil(event.event.startsAt.timeIntervalSince(now) / 60)))
    let hours = minutes / 60
    let rest = minutes % 60
    let time = hours == 0 ? "\(minutes)m" : rest == 0 ? "\(hours)h" : "\(hours)h \(rest)m"
    return name.map { "\($0) starts in \(time)." } ?? "\(event.provider) in \(time)."
  }

  private func calendarNudge(_ event: UpcomingCalendarEvent, now: Date, turn: Int) -> String {
    let lead = calendarLead(event, now: now)
    let lines: [String]
    switch (event.event.startsAt <= now, nudgeTone) {
    case (true, "Direct"): lines = ["Pause and get to it.", "Give it your attention."]
    case (true, "Playful"): lines = ["The feed can wait.", "Let this have its moment."]
    case (true, "Intense"): lines = ["Pause and give it your focus.", "Put the phone down. Focus."]
    case (true, _): lines = ["Give it a moment of focus.", "You can pause here."]
    case (false, "Direct"): lines = ["Get what you need.", "Take a moment to prep."]
    case (false, "Playful"): lines = ["Give future you a head start.", "Take a tiny prep break."]
    case (false, "Intense"): lines = ["Protect your prep time.", "Pause and get ready."]
    default: lines = ["Take a moment to get ready.", "One small step can help."]
    }
    let fitting = lines.filter { lead.count + $0.count < 61 }
    return fitting.isEmpty ? lead : lead + " " + fitting[turn % fitting.count]
  }

  private func taskNudge(_ title: String, turn: Int) -> String {
    let lines: [String]
    switch nudgeTone {
    case "Direct": lines = ["Pick the first step.", "Pause and start here."]
    case "Playful": lines = ["Give this task a turn.", "One little box to tick."]
    case "Intense": lines = ["Pause and make progress.", "Give this your focus now."]
    default: lines = ["A small start counts.", "Make a little room for it."]
    }
    let lead = "\(title) is still open."
    let fitting = lines.filter { lead.count + $0.count < 61 }
    return fitting.isEmpty ? lead : lead + " " + fitting[turn % fitting.count]
  }

  private func blackFridayYear(at now: Date, region: String?, timeZone: TimeZone) -> Int? {
    guard region == "US" else { return nil }
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = timeZone
    let day = calendar.dateComponents([.year, .month, .day, .weekday], from: now)
    // Black Friday follows the fourth Thursday of November.
    guard day.month == 11, day.weekday == 6, let date = day.day, (23...29).contains(date) else { return nil }
    return day.year
  }

  mutating func nextNotificationLine(checkpoint: Int, session: UUID? = nil, now: Date = Date(),
                                     region: String? = Locale.current.region?.identifier,
                                     timeZone: TimeZone = .current) -> String {
    let turn = max(0, nudgeTurn ?? 0) % 24
    let recent = Array((recentNudgeLines ?? []).suffix(4))
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = timeZone
    let events = upcomingCalendarEvents(at: now)
      .filter { $0.event.startsAt <= now || calendar.isDate($0.event.startsAt, inSameDayAs: now) }
      .sorted { ($0.event.startsAt, $0.provider) < ($1.event.startsAt, $1.provider) }
    let googleTasks = googleTasksRefreshedAt.map { (0..<86400).contains(now.timeIntervalSince($0)) } == true
      ? (googleTaskTitles ?? []) : []
    let reminders = appleRemindersEnabled == true &&
      appleRemindersRefreshedAt.map { (0..<86400).contains(now.timeIntervalSince($0)) } == true
      ? (appleReminders ?? []) : []
    let tasks = reminders.filter { $0.isEligible(at: now, calendar: calendar) }.map(\.title) + googleTasks
    let plans = sessionNudgePlans ?? []
    let plan = plans.first { $0.session == session } ?? ProtectionSessionNudgePlan(
      session: session ?? UUID(), hasCalendarEvent: !events.isEmpty || !tasks.isEmpty, dinoLow: dinoNeedsCare(at: now))
    if let session, !plans.contains(where: { $0.session == session }) {
      sessionNudgePlans = Array((plans + [plan]).suffix(32))
    }
    let point = max(0, checkpoint)
    let kind = plan.order[point % plan.order.count]
    let goal = goalLabel ?? "your goal"
    var calendarEvent: UpcomingCalendarEvent?
    var usedTask = false
    var choices: [String]
    switch kind {
    case .calendar:
      if !tasks.isEmpty && (events.isEmpty || lastCalendarNudgeWasTask == false) {
        let index = max(0, googleTaskTurn ?? 0) % tasks.count
        choices = [taskNudge(tasks[index], turn: turn), taskNudge(tasks[index], turn: turn + 1)]
        googleTaskTurn = (index + 1) % tasks.count
        lastCalendarNudgeWasTask = true
        usedTask = true
      } else if !events.isEmpty {
        let event = events[(point / plan.order.count) % events.count]
        calendarEvent = event
        choices = [calendarNudge(event, now: now, turn: turn), calendarNudge(event, now: now, turn: turn + 1)]
        lastCalendarNudgeWasTask = false
      } else {
        choices = (0..<3).map { goalLine(($0 + turn) % 3) }
      }
    case .dino:
      choices = plan.dinoLow
        ? ["Dino needs care. Take a break to earn food credits.",
           "Dino is low on energy. Pause to help.",
           "Dino could use a meal. Step away for a bit."]
        : ["Take a break to help feed Dino.",
           "Pause and earn credits for Dino’s next meal.",
           "A short break can help keep Dino fed."]
    case .quest:
      choices = ["Save a quest idea. Finish the quest for 50 credits.",
                 "Try a Hoosh quest. Earn 50 credits when you finish.",
                 "Pick a quest for your next break. Finish it for 50 credits."]
    case .goal:
      let index = (point + turn / 3) % 3
      choices = [generatedLine(index)].compactMap { $0 }
        + (0..<3).map { goalLine((index + $0) % 3) }
        + ["Make a little room for \(goal). What could you do first?"]
    }

    if kind == .goal || (kind == .calendar && !usedTask) {
      if let holiday = publicHoliday, holiday.startsAt <= now, now < holiday.endsAt,
         lastHolidayNudge != holiday, calendarEvent == nil {
        let messages = holidayNudgeMessages ?? []
        choices.insert(messages.isEmpty ? "\(holiday.name): take a short break away from your phone."
          : messages[turn % messages.count], at: 0)
        lastHolidayNudge = holiday
      } else if let year = blackFridayYear(at: now, region: region, timeZone: timeZone), lastBlackFridayNudge != year {
        if let calendarEvent {
          let lead = calendarLead(calendarEvent, now: now)
          let seasonal = lead + " Enjoy Black Friday."
          if seasonal.count <= 61 { choices.insert(seasonal, at: 0) }
        } else {
          choices.insert("Black Friday idea: swap a scroll for a walk with someone you love.", at: 0)
        }
        lastBlackFridayNudge = year
      }
    }
    let available = choices.filter { !recent.contains($0) }
    // Avoid repeating copy without substituting a different kind of nudge.
    let line = available.first ?? choices[turn % choices.count]
    nudgeTurn = (turn + 1) % 24
    recentNudgeLines = Array((recent + [line]).suffix(4))
    return line
  }
  var goalLabel: String? {
    guard let activity = shieldActivity else { return nil }
    if activity.hasPrefix("custom:") { return String(activity.dropFirst("custom:".count)) }
    return ["reading": "reading", "gym": "working out", "walking": "a walk",
      "arts_and_crafts": "arts and crafts", "music": "music", "cooking": "cooking"][activity]
  }
  func goalLine(_ index: Int) -> String {
    let goal = goalLabel ?? "something you want to do"
    let lines: [String]
    switch nudgeTone {
    case "Direct":
      lines = ["Pick one next step for \(goal).", "Put the phone down and make time for \(goal).", "Start \(goal) now. One small step is enough."]
    case "Playful":
      lines = ["Give \(goal) the next spot in your lineup.", "Plot twist: \(goal) gets a turn.", "Let the feed wait. Go make time for \(goal)."]
    case "Intense":
      lines = ["Protect the time you set aside for \(goal).", "Choose \(goal). Put the phone down and follow through.", "Take the first step toward \(goal) now."]
    default:
      lines = ["Think of one small way to make time for \(goal).", "Take a breath and give yourself a little time for \(goal).", "Ready for \(goal)? A small start is enough."]
    }
    return lines[min(max(index, 0), lines.count - 1)]
  }
  var generatedNudges: ProtectionNudgeCopy?
  func generatedLine(_ index: Int) -> String? {
    guard let pack = generatedNudges, pack.activity == shieldActivity,
      pack.tone == (nudgeTone ?? "Supportive"), pack.expiresAt > Date(),
      pack.messages.indices.contains(index) else { return nil }
    return pack.messages[index]
  }
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
  func presentationSnapshot() throws -> ProtectionState? {
    // Committed state was validated before its atomic rename. Rechecking the
    // entire rewards journal and schedule history can miss the shield UI deadline.
    try readLocked(validate: false)
  }
  private var expiryPresentationURL: URL { directory.appendingPathComponent("expiry-presentation.json") }

  // Written while the caller holds the state lock, before sending the shield
  // setting to iOS. The render path only reads this small, atomic file.
  func saveExpiryPresentation(_ snapshot: ProtectionExpiryPresentation) throws {
    let data = try JSONEncoder().encode(snapshot)
    guard data.count <= 128 * 1024 else { throw ProtectionStoreError.oversized }
    #if os(iOS)
    try data.write(to: expiryPresentationURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    #else
    try data.write(to: expiryPresentationURL, options: .atomic)
    #endif
  }

  func expiryPresentation(for app: Data, now: Date) -> ProtectionShieldPresentation? {
    guard let data = try? Data(contentsOf: expiryPresentationURL), data.count <= 128 * 1024,
      let snapshot = try? JSONDecoder().decode(ProtectionExpiryPresentation.self, from: data) else { return nil }
    return snapshot.presentation(for: app, now: now)
  }

  func clearExpiryPresentation() {
    try? FileManager.default.removeItem(at: expiryPresentationURL)
  }

  func withSnapshot<T>(_ action: (ProtectionState?) throws -> T) throws -> T {
    try locked { try action(try readLocked()) }
  }
  @discardableResult
  func update(expectedRevision: UInt64?, _ edit: (inout ProtectionState) throws -> Void) throws -> ProtectionState {
    try mutate(checkRevision: { $0?.revision == expectedRevision }, edit)
  }

  // The caller validates its owner and operation inside the same file lock.
  @discardableResult
  func updateLatest(_ edit: (inout ProtectionState) throws -> Void) throws -> ProtectionState {
    try mutate(checkRevision: { $0 != nil }, edit)
  }

  private func mutate(checkRevision: (ProtectionState?) -> Bool,
                      _ edit: (inout ProtectionState) throws -> Void) throws -> ProtectionState {
    try locked {
      let previous = try readLocked()
      guard checkRevision(previous) else { throw ProtectionStoreError.conflict }
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
  private func readLocked(validate: Bool = true) throws -> ProtectionState? {
    do {
      let attributes = try FileManager.default.attributesOfItem(atPath: stateURL.path)
      guard let size = attributes[.size] as? NSNumber, size.intValue <= Self.maximumBytes else { throw ProtectionStoreError.oversized }
      let data = try Data(contentsOf: stateURL)
      guard data.count <= Self.maximumBytes else { throw ProtectionStoreError.oversized }
      struct Header: Decodable { let version: Int }
      guard let header = try? JSONDecoder().decode(Header.self, from: data) else { throw ProtectionStoreError.corrupt }
      guard (1...4).contains(header.version) else { throw header.version > 4 ? ProtectionStoreError.newerVersion : .corrupt }
      guard let state = try? JSONDecoder().decode(ProtectionState.self, from: data) else { throw ProtectionStoreError.corrupt }
      if validate { try state.validated() }
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
  var sessionMinutes: Int? = nil
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
        (1...2147483647).contains(event.revision), ["allowance_consumed", "quit_selected", "nudge_skipped", "app_open"].contains(event.evidence),
        event.sessionMinutes.map({ ["allowance_consumed", "app_open"].contains(event.evidence) && (1...1440).contains($0) }) ?? true,
        event.evidence != "app_open" || event.sessionMinutes != nil,
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
  mutating func append(grant: ProtectionGrantResult, revision: Int, clock: ProtectionClock, timezone: String, openMinutes: Int? = nil) throws {
    guard grant.startedNewSession || openMinutes != nil else { return }
    try clock.validate()
    guard nextSequence < Self.maximum, discarded < Self.maximum else { throw ProtectionStoreError.oversized }
    let sequence = nextSequence; nextSequence += 1
    // Clock rollback or a changed policy zone is an explicit evidence gap, never
    // a shifted date, new installation identity or fabricated healthy day.
    guard clock.wall >= lastTimestamp, timezone == self.timezone else { discarded += 1; return }
    if events.count == 256 { events.removeFirst(); discarded += 1 }
    events.append(.init(id: grant.startedNewSession ? grant.session.id : UUID(), sequence: sequence, occurredAt: clock.wall,
      day: Self.day(clock.wall, timezone: timezone), exhausted: grant.exhausted ?? false,
      revision: revision, evidence: grant.startedNewSession ? "allowance_consumed" : "app_open",
      sessionMinutes: openMinutes ?? (grant.session.seconds + 59) / 60))
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
        var signal: [String: Any] = ["event_id": event.id.uuidString.lowercased(), "sequence": event.sequence,
         "occurred_at": formatter.string(from: Date(timeIntervalSince1970: Double(event.occurredAt) / 1000)),
         "kind": event.evidence == "quit_selected" ? "quit" : event.evidence == "nudge_skipped" ? "nudge_skipped" : event.evidence == "app_open" ? "app_open" : "allowance", "day": event.day,
         "encounter_id": event.encounterID.map { $0.uuidString.lowercased() as Any } ?? NSNull(),
         "context": event.context.map { $0 as Any } ?? NSNull(),
         "exhausted": event.evidence == "allowance_consumed" ? event.exhausted as Any : NSNull(), "covered": NSNull()]
        if let minutes = event.sessionMinutes { signal["session_minutes"] = minutes }
        return signal
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
