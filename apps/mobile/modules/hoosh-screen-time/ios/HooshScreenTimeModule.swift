import ExpoModulesCore
import FamilyControls
import EventKit
import UIKit
import Combine
import UserNotifications

public class HooshScreenTimeModule: Module {
  private let leases = ProtectionOwnerLeases()
  private var permissionObserver: AnyCancellable?
  private var foregroundObserver: NSObjectProtocol?
  private var calendarObserver: NSObjectProtocol?
  private var notificationDelegate: ProtectionNotificationDelegate?
  private var dinoWarningLease: UUID?
  private static let dinoWarningID = "hoosh.dino.health"
  private let calendarStore = EKEventStore()
  private var lastCalendarSourceRefresh: Date?
  private let picker = NativeSelectionPicker()
  private let usageReport = UsageBaselinePresenter()
  private var transactions: SelectionTransactions<FamilyActivitySelection>?
  private let transactionLock = NSLock()
  private func selections() throws -> SelectionTransactions<FamilyActivitySelection> {
    transactionLock.lock(); defer { transactionLock.unlock() }
    if let transactions { return transactions }
    let storage = try SharedProtectionStore.appGroup()
    let value = SelectionTransactions<FamilyActivitySelection>(store: storage, leases: leases,
      empty: FamilyActivitySelection(), same: Self.sameSelection) { selection in
      guard selection.categoryTokens.isEmpty, selection.webDomainTokens.isEmpty,
            selection.applicationTokens.count <= 512 else { throw SelectionFailure.unavailable }
      return selection.applicationTokens.count
    }
    transactions = value
    return value
  }
  private static func sameSelection(_ lhs: FamilyActivitySelection, _ rhs: FamilyActivitySelection) -> Bool {
    let appsMatch = lhs.applicationTokens == rhs.applicationTokens
    let categoriesMatch = lhs.categoryTokens == rhs.categoryTokens
    let domainsMatch = lhs.webDomainTokens == rhs.webDomainTokens
    return appsMatch && categoriesMatch && domainsMatch
  }
  private func selectionResult<T>(_ action: () throws -> T) throws -> T {
    do { return try action() }
    catch let failure as SelectionFailure {
      throw Exception(name: "SelectionError", description: "App selection could not be confirmed.", code: failure.rawValue)
    }
  }
  // Sanitized physical-QA receipt: never includes identity, app tokens, answers or clock signals.
  private func writeProtectionDiagnostic(_ owner: ProtectionOwner, stage: String, error: Error? = nil) {
    #if HOOSH_PHYSICAL_NUDGE_QA
    var receipt: [String: Any] = ["stage": stage, "activationAvailable": ProtectionActivationGate.enabled,
      "authorized": AuthorizationCenter.shared.authorizationStatus == .approved,
      "clockAvailable": (try? ProtectionDeviceClock.sample()) != nil,
      "monitorCount": ProtectionOSAdapter.scopedMonitorCount]
    receipt["allowanceFailure"] = UserDefaults(suiteName: SharedProtectionStore.group)?.string(forKey: "hoosh.qa.allowanceFailure")
    let qaDefaults = UserDefaults(suiteName: SharedProtectionStore.group)
    receipt["expiryShieldSubmittedAt"] = qaDefaults?.object(forKey: "hoosh.qa.expiryShieldSubmittedAt")
    receipt["expiryShieldConfiguredAt"] = qaDefaults?.object(forKey: "hoosh.qa.expiryShieldConfiguredAt")
    for key in ["appShieldRequestedAt", "appShieldReturnedAt", "appShieldFallbackAt", "expiryDurationSeconds", "expiryPreparedAppCount"] {
      receipt[key] = qaDefaults?.object(forKey: "hoosh.qa." + key)
    }
    if let state = try? SharedProtectionStore.appGroup().read(),
       let record = state.owners.first(where: { $0.owner == owner }) {
      receipt["ownerMatches"] = state.installedOwner == owner
      receipt["pendingClaim"] = state.pendingClaim != nil
      receipt["hasSelection"] = record.selection != nil
      receipt["pendingInstallation"] = record.pendingInstallation != nil
      if let pending = record.pendingInstallation, var ledger = record.sessionLedger {
        do { try ledger.updatePolicy(pending.target.policy); receipt["pendingPolicyCompatible"] = true }
        catch { receipt["pendingPolicyCompatible"] = false }
      }
      let now = Date()
      receipt["googleCalendarSelected"] = record.googleCalendarID != nil
      receipt["googleCalendarUpcoming"] = [record.googleCalendarEventAt, record.directGoogleCalendarEventAt]
        .compactMap { $0 }.contains { $0 > now && $0.timeIntervalSince(now) <= 86400 } ||
        ((record.directGoogleCalendarEvents ?? []) + (record.syncedGoogleCalendarEvents ?? []))
          .contains { $0.isEligible(at: now) }
      receipt["appleCalendarUpcoming"] = record.calendarNudges == true &&
        (record.appleCalendarEvents?.contains { $0.isEligible(at: now) } ??
          (record.calendarEventAt.map { $0 > now && $0.timeIntervalSince(now) <= 86400 } ?? false))
      receipt["hasInstallation"] = record.installation != nil
      receipt["sessionLimit"] = record.installation?.policy.sessionsPerDay
      receipt["sharedSessionBudget"] = record.installation?.policy.sharedBudget
      if let ledger = record.sessionLedger {
        let now = Int64(Date().timeIntervalSince1970 * 1000)
        receipt["largestDailySessionCount"] = Set(ledger.daily.map(\.app)).compactMap {
          try? ledger.usedSessions(app: $0, wall: now)
        }.max() ?? 0
      }
      receipt["enabled"] = record.installation?.enabled ?? false
      receipt["activeReasonCount"] = record.installation?.activeSnapshots.count ?? 0
      receipt["allowanceSessionCount"] = record.sessionLedger?.sessions.count ?? 0
      receipt["allowanceGrantCount"] = record.sessionLedger?.grants.count ?? 0
      let measured = record.sessionLedger?.sessions.filter { $0.usageBased } ?? []
      receipt["usageSessionCount"] = measured.count
      receipt["usedUsageSeconds"] = measured.reduce(0) { $0 + ($1.usageConsumedSeconds ?? 0) }
      receipt["remainingUsageSeconds"] = measured.reduce(0) { $0 + max(0, $1.seconds - ($1.usageConsumedSeconds ?? 0)) }
      if let journal = record.rewardJournal {
        receipt["rewardAcknowledged"] = journal.acknowledged
        receipt["rewardFirstQueued"] = journal.events.first?.sequence
        receipt["rewardQueuedCount"] = journal.events.count
      }
    }
    if let error {
      if let typed = error as? ProtectionTransactionError { receipt["failure"] = String(describing: typed) }
      else if let typed = error as? ProtectionStoreError { receipt["failure"] = String(describing: typed) }
      else if let typed = error as? ScheduleFailure { receipt["failure"] = String(describing: typed) }
      else { let native = error as NSError; receipt["failure"] = "\(native.domain):\(native.code)" }
    }
    if let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
      let file = directory.appendingPathComponent("hoosh-protection-diagnostic.json")
      if stage == "read", let prior = try? Data(contentsOf: file),
         let saved = (try? JSONSerialization.jsonObject(with: prior)) as? [String: Any],
         let failure = saved["failure"] as? String { receipt["failure"] = failure }
      if let data = try? JSONSerialization.data(withJSONObject: receipt, options: [.sortedKeys]) {
        try? data.write(to: file, options: [.atomic, .completeFileProtection])
      }
    }
    #endif
  }
  private func isGoogleCalendar(_ calendar: EKCalendar) -> Bool {
    guard calendar.source.sourceType == .calDAV else { return false }
    let source = calendar.source.title.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    return source == "google" || source == "gmail" || source == "google calendar" ||
      source.hasSuffix("@gmail.com") || source.hasSuffix("@googlemail.com")
  }

  private func isAppleCalendar(_ calendar: EKCalendar) -> Bool {
    switch calendar.source.sourceType {
    case .local, .mobileMe: return true
    case .calDAV:
      let source = calendar.source.title.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      return source == "icloud" || source.hasSuffix("@icloud.com") ||
        source.hasSuffix("@me.com") || source.hasSuffix("@mac.com")
    default: return false
    }
  }

  private func timedCalendarEvents(in calendars: [EKCalendar]?) -> [EKEvent] {
    let now = Date()
    let window = calendarStore.predicateForEvents(withStart: now,
      end: now.addingTimeInterval(86400), calendars: calendars)
    return calendarStore.events(matching: window)
      .filter { !$0.isAllDay && $0.status != .canceled && $0.endDate > now }
      .sorted { $0.startDate < $1.startDate }
  }

  private func cacheableEvents(_ events: [EKEvent]) -> [ProtectionCalendarEvent] {
    events.prefix(8).map {
      ProtectionCalendarEvent(startsAt: $0.startDate, endsAt: $0.endDate,
        title: ProtectionCalendarEvent.nudgeTitle($0.title))
    }
  }

  private func canReadReminders() -> Bool {
    let status = EKEventStore.authorizationStatus(for: .reminder)
    if #available(iOS 17.0, *) { return status == .fullAccess }
    return status == .authorized
  }

  private func fetchIncompleteReminders() async -> [ProtectionAppleReminder]? {
    let predicate = calendarStore.predicateForIncompleteReminders(
      withDueDateStarting: nil, ending: nil, calendars: nil)
    let now = Date()
    let calendar = Calendar.current
    return await withCheckedContinuation { continuation in
      calendarStore.fetchReminders(matching: predicate) { items in
        let reminders = items?.compactMap { reminder -> ProtectionAppleReminder? in
          guard !reminder.isCompleted,
            let title = ProtectionCalendarEvent.nudgeTitle(reminder.title) else { return nil }
          return ProtectionAppleReminder(title: title, dueDate: reminder.dueDateComponents?.date)
        }.filter { $0.isEligible(at: now, calendar: calendar) }.sorted {
          let first = $0.dueDate ?? .distantFuture
          let second = $1.dueDate ?? .distantFuture
          return (first, $0.title) < (second, $1.title)
        }
        continuation.resume(returning: reminders.map { Array($0.prefix(8)) })
      }
    }
  }

  public func definition() -> ModuleDefinition {
    Name("HooshScreenTime")
    Constant("usageComparisonAvailable") { true }
    AsyncFunction("setNudgeTone") { (namespace: String, userID: String, raw: String, tone: String) throws -> [String: Bool] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard ["Supportive", "Direct", "Playful", "Intense"].contains(tone) else { throw ProtectionStoreError.invalidRecord }
      try self.leases.withLease(owner, token: token) {
        let store = try SharedProtectionStore.appGroup()
        let state = try store.read()
        try store.update(expectedRevision: state?.revision ?? 0) { next in
          if let index = next.owners.firstIndex(where: { $0.owner == owner }) { next.owners[index].nudgeTone = tone }
          else { var record = ProtectionOwnerRecord(owner: owner); record.nudgeTone = tone; next.owners.append(record) }
        }
      }
      return ["saved": true]
    }
    AsyncFunction("calendarNudgeSettings") { (namespace: String, userID: String, raw: String, enabled: Bool?) async throws -> Bool in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let store = try SharedProtectionStore.appGroup()
      let current = try self.leases.withLease(owner, token: token) {
        try store.read()?.owners.first(where: { $0.owner == owner })?.calendarNudges ?? false
      }
      var active = enabled ?? current
      if enabled == true {
        if #available(iOS 17.0, *) {
          active = try await self.calendarStore.requestFullAccessToEvents()
        } else {
          active = try await self.calendarStore.requestAccess(to: .event)
        }
      }
      let status = EKEventStore.authorizationStatus(for: .event)
      if #available(iOS 17.0, *) {
        active = active && status == .fullAccess
      } else {
        active = active && status == .authorized
      }
      let calendars = active ? self.calendarStore.calendars(for: .event).filter(self.isAppleCalendar) : []
      let events = calendars.isEmpty ? [] : self.cacheableEvents(self.timedCalendarEvents(in: calendars))
      try self.leases.withLease(owner, token: token) {
        try store.updateLatest { state in
          guard let index = state.owners.firstIndex(where: { $0.owner == owner }) else {
            if active { throw ProtectionStoreError.staleLease }
            return
          }
          if let enabled { state.owners[index].calendarNudges = enabled && active }
          state.owners[index].calendarEventAt = nil
          state.owners[index].appleCalendarEvents = events
        }
      }
      return active
    }
    AsyncFunction("remindersNudgeSettings") { (namespace: String, userID: String, raw: String, enabled: Bool?) async throws -> Bool in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let store = try SharedProtectionStore.appGroup()
      if enabled == true, !self.canReadReminders() {
        let granted: Bool
        if #available(iOS 17.0, *) {
          granted = try await self.calendarStore.requestFullAccessToReminders()
        } else {
          granted = try await self.calendarStore.requestAccess(to: .reminder)
        }
        guard granted else { return false }
      }
      let connection = try self.leases.withLease(owner, token: token) {
        if let enabled {
          try store.updateLatest { state in
            guard let index = state.owners.firstIndex(where: { $0.owner == owner }) else {
              throw ProtectionStoreError.staleLease
            }
            state.owners[index].appleRemindersEnabled = enabled
            state.owners[index].appleRemindersConnectionID = enabled ? UUID() : nil
            state.owners[index].appleReminders = nil
            state.owners[index].appleRemindersRefreshedAt = nil
            if enabled { state.owners[index].lastCalendarNudgeWasTask = nil }
          }
        }
        return try store.read()?.owners.first(where: { $0.owner == owner })?.appleRemindersConnectionID
      }
      guard let connection else { return false }
      let started = Date()
      let reminders = self.canReadReminders() ? await self.fetchIncompleteReminders() : nil
      let allowed = self.canReadReminders()
      try self.leases.withLease(owner, token: token) {
        try store.updateLatest { state in
          guard let index = state.owners.firstIndex(where: { $0.owner == owner }),
            state.owners[index].appleRemindersConnectionID == connection,
            (state.owners[index].appleRemindersRefreshedAt ?? .distantPast) <= started else { return }
          state.owners[index].appleReminders = allowed ? reminders : nil
          state.owners[index].appleRemindersRefreshedAt = started
        }
      }
      return allowed
    }
    AsyncFunction("setDirectGoogleCalendarContext") { (namespace: String, userID: String, raw: String, context: String, replaceSynced: Bool) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      struct Context: Decodable {
        let events: [ProtectionCalendarEvent]
        let tasks: [String]
      }
      guard context.utf8.count <= 12_000 else { throw ProtectionStoreError.invalidRecord }
      let decoder = JSONDecoder()
      decoder.dateDecodingStrategy = .millisecondsSince1970
      let snapshot = try decoder.decode(Context.self, from: Data(context.utf8))
      guard snapshot.events.count <= 8, snapshot.tasks.count <= 8 else { throw ProtectionStoreError.invalidRecord }
      let now = Date()
      let events = snapshot.events.filter { event in
        guard let end = event.endsAt else { return false }
        return end > event.startsAt && event.isEligible(at: now)
      }.sorted { $0.startsAt < $1.startsAt }.map { event in
        ProtectionCalendarEvent(startsAt: event.startsAt, endsAt: event.endsAt,
          title: ProtectionCalendarEvent.nudgeTitle(event.title))
      }
      let tasks = snapshot.tasks.compactMap { ProtectionCalendarEvent.nudgeTitle($0) }
      try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().updateLatest { state in
          guard let index = state.owners.firstIndex(where: { $0.owner == owner }) else {
            throw ProtectionStoreError.staleLease
          }
          if replaceSynced {
            state.owners[index].googleCalendarID = nil
            state.owners[index].googleCalendarEventAt = nil
            state.owners[index].syncedGoogleCalendarEvents = nil
          }
          state.owners[index].directGoogleCalendarEventAt = nil
          state.owners[index].directGoogleCalendarEvents = events
          state.owners[index].googleTaskTitles = tasks
          state.owners[index].googleTasksRefreshedAt = tasks.isEmpty ? nil : now
        }
      }
    }
    AsyncFunction("questPlanningContext") { (namespace: String, userID: String, raw: String, directConnected: Bool) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let store = try SharedProtectionStore.appGroup()
      let record = try self.leases.withLease(owner, token: token) {
        try store.read()?.owners.first(where: { $0.owner == owner })
      }
      let now = Date()
      let status = EKEventStore.authorizationStatus(for: .event)
      let access: Bool
      if #available(iOS 17.0, *) { access = status == .fullAccess }
      else { access = status == .authorized }
      let calendars = access ? self.calendarStore.calendars(for: .event) : []
      let googleSource = record?.googleCalendarID.flatMap { id in
        calendars.first { $0.calendarIdentifier == id }?.source.sourceIdentifier
      }
      let connectedCalendars = calendars.filter {
        (record?.calendarNudges == true && self.isAppleCalendar($0)) ||
          (googleSource == $0.source.sourceIdentifier && $0.type != .subscription)
      }
      let local = connectedCalendars.isEmpty ? [] : self.timedCalendarEvents(in: connectedCalendars)
      let direct = directConnected ? record?.directGoogleCalendarEvents ?? [] : []
      let windows = local.map { [$0.startDate.timeIntervalSince1970 * 1000, $0.endDate.timeIntervalSince1970 * 1000] } +
        direct.compactMap { event -> [Double]? in
          guard let end = event.endsAt else { return nil }
          return [event.startsAt.timeIntervalSince1970 * 1000, end.timeIntervalSince1970 * 1000]
        }
      let reminder = self.canReadReminders() && record?.appleRemindersEnabled == true
        ? record?.appleReminders?.first { $0.isEligible(at: now, calendar: .current) }?.title : nil
      let task = directConnected ? record?.googleTaskTitles?.first : nil
      try self.leases.require(owner, token: token)
      var result: [String: Any] = ["windows": windows, "calendarChecked": directConnected || !connectedCalendars.isEmpty]
      if let title = reminder ?? task { result["task"] = title }
      let upcomingLocal = local.compactMap { event -> (Date, String)? in
        guard event.startDate > now, let title = ProtectionCalendarEvent.nudgeTitle(event.title) else { return nil }
        return (event.startDate, title)
      }
      let upcomingDirect = direct.compactMap { event -> (Date, String)? in
        guard event.startsAt > now, let title = event.title else { return nil }
        return (event.startsAt, title)
      }
      if let event = (upcomingLocal + upcomingDirect).min(by: { $0.0 < $1.0 }) {
        result["event"] = ["startsAt": event.0.timeIntervalSince1970 * 1000, "title": event.1]
      }
      if direct.count == 8, let last = direct.last { result["checkedThrough"] = last.startsAt.timeIntervalSince1970 * 1000 }
      return result
    }
    AsyncFunction("refreshCalendarSources") { (namespace: String, userID: String, raw: String) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      try self.leases.require(owner, token: token)
      let status = EKEventStore.authorizationStatus(for: .event)
      if #available(iOS 17.0, *) {
        guard status == .fullAccess else { return }
      } else {
        guard status == .authorized else { return }
      }
      let now = Date()
      if let last = self.lastCalendarSourceRefresh, (0..<60).contains(now.timeIntervalSince(last)) { return }
      self.lastCalendarSourceRefresh = now
      self.calendarStore.refreshSourcesIfNecessary()
    }
    AsyncFunction("refreshPublicHoliday") { (namespace: String, userID: String, raw: String) throws -> String? in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let store = try SharedProtectionStore.appGroup()
      return try self.leases.withLease(owner, token: token) {
        guard let record = try store.read()?.owners.first(where: { $0.owner == owner }) else { return nil }
        let status = EKEventStore.authorizationStatus(for: .event)
        let allowed: Bool
        if #available(iOS 17.0, *) { allowed = status == .fullAccess }
        else { allowed = status == .authorized }
        let enabled = record.calendarNudges == true || record.googleCalendarID != nil
        var holiday: ProtectionPublicHoliday?
        if allowed && enabled, let day = Calendar.current.dateInterval(of: .day, for: Date()) {
          // Only dedicated read-only holiday calendars supply public names.
          let googleSource = record.googleCalendarID.flatMap {
            self.calendarStore.calendar(withIdentifier: $0)?.source.sourceIdentifier
          }
          let holidays = self.calendarStore.calendars(for: .event).filter {
            let title = $0.title.lowercased()
            let named = title == "holidays" || title.hasSuffix(" holidays") || title.hasPrefix("holidays in ")
            let fromSelectedGoogle = googleSource != nil && $0.source.sourceIdentifier == googleSource
            return named && !$0.allowsContentModifications && ($0.type == .subscription || fromSelectedGoogle)
          }
          if !holidays.isEmpty {
            let predicate = self.calendarStore.predicateForEvents(withStart: day.start, end: day.end, calendars: holidays)
            holiday = self.calendarStore.events(matching: predicate)
              .filter { $0.isAllDay && $0.status != .canceled }
              .compactMap { event -> ProtectionPublicHoliday? in
                guard let name = event.title?.trimmingCharacters(in: .whitespacesAndNewlines),
                  (1...56).contains(name.count),
                  name.rangeOfCharacter(from: .controlCharacters.union(.newlines)) == nil else { return nil }
                return ProtectionPublicHoliday(name: name, startsAt: day.start, endsAt: day.end)
              }.sorted { $0.name < $1.name }.first
          }
        }
        if holiday != record.publicHoliday {
          try store.updateLatest { state in
            guard let index = state.owners.firstIndex(where: { $0.owner == owner }) else { return }
            state.owners[index].publicHoliday = holiday
            state.owners[index].holidayNudgeMessages = nil
          }
        }
        return holiday?.name
      }
    }
    AsyncFunction("cacheHolidayNudges") { (namespace: String, userID: String, raw: String, name: String, messages: [String]) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let folded = name.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
      guard messages.count == 3, messages.allSatisfy({ message in
        (1...72).contains(message.count) && message.rangeOfCharacter(from: .controlCharacters.union(.newlines)) == nil &&
          message.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current).contains(folded)
      }) else { throw ProtectionStoreError.invalidRecord }
      try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().updateLatest { state in
          guard let index = state.owners.firstIndex(where: { $0.owner == owner }),
            state.owners[index].publicHoliday?.name == name else { return }
          state.owners[index].holidayNudgeMessages = messages
        }
      }
    }
    AsyncFunction("googleCalendarNudges") { (namespace: String, userID: String, raw: String, action: String, calendarID: String?) async throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let store = try SharedProtectionStore.appGroup()
      guard ["status", "choose", "connect", "disconnect"].contains(action) else {
        throw ProtectionStoreError.invalidRecord
      }
      let saved = try self.leases.withLease(owner, token: token) {
        try store.read()?.owners.first(where: { $0.owner == owner })?.googleCalendarID
      }
      if action == "status" && saved == nil { return ["status": "off"] }
      if action == "choose" {
        if #available(iOS 17.0, *) {
          _ = try await self.calendarStore.requestFullAccessToEvents()
        } else {
          _ = try await self.calendarStore.requestAccess(to: .event)
        }
      }
      let status = EKEventStore.authorizationStatus(for: .event)
      let allowed: Bool
      if #available(iOS 17.0, *) { allowed = status == .fullAccess }
      else { allowed = status == .authorized }
      if action == "choose" {
        guard allowed else { return ["status": "permission"] }
        let calendars = self.calendarStore.calendars(for: .event)
          .filter(self.isGoogleCalendar)
          .sorted { $0.title.localizedStandardCompare($1.title) == .orderedAscending }
        try self.leases.require(owner, token: token)
        return ["status": calendars.isEmpty ? "sync_required" : "choose",
          "calendars": calendars.map { ["id": $0.calendarIdentifier, "label": "\($0.title) · \($0.source.title)"] }]
      }
      if action == "connect" && calendarID == nil { throw ProtectionStoreError.invalidRecord }
      let selectedID = action == "disconnect" ? nil : (action == "connect" ? calendarID : saved)
      let selected = allowed ? selectedID.flatMap { id in
        guard let calendar = self.calendarStore.calendar(withIdentifier: id),
          action != "connect" || self.isGoogleCalendar(calendar) else { return nil as EKCalendar? }
        return calendar
      } : nil
      let events: [EKEvent] = selected.map { selected in
        let calendars = self.calendarStore.calendars(for: .event).filter {
          $0.source.sourceIdentifier == selected.source.sourceIdentifier && $0.type != .subscription
        }
        return self.timedCalendarEvents(in: calendars.isEmpty ? [selected] : calendars)
      } ?? []
      let now = Date()
      let next = events.first { $0.startDate > now }?.startDate
      let activeEvent = events.contains { $0.startDate <= now && now < $0.endDate }
      try self.leases.withLease(owner, token: token) {
        try store.updateLatest { state in
          guard let index = state.owners.firstIndex(where: { $0.owner == owner }) else {
            if action == "connect" { throw ProtectionStoreError.staleLease }
            return
          }
          if action == "status" && state.owners[index].googleCalendarID != saved { return }
          if action == "disconnect" || (action == "connect" && selected != nil) {
            state.owners[index].googleCalendarID = selected?.calendarIdentifier
          }
          state.owners[index].googleCalendarEventAt = nil
          state.owners[index].syncedGoogleCalendarEvents = self.cacheableEvents(events)
        }
      }
      if action == "disconnect" { return ["status": "off"] }
      if !allowed { return ["status": "permission"] }
      #if HOOSH_PHYSICAL_NUDGE_QA
      let qa = UserDefaults(suiteName: SharedProtectionStore.group)
      qa?.set(Date().timeIntervalSince1970, forKey: "hoosh.qa.googleCalendarReadAt")
      qa?.set(selected != nil, forKey: "hoosh.qa.googleCalendarResolved")
      qa?.set(next != nil, forKey: "hoosh.qa.googleCalendarTimedEventFound")
      qa?.set(activeEvent, forKey: "hoosh.qa.googleCalendarActiveEventFound")
      #endif
      guard let selected else { return ["status": "sync_required"] }
      var connection: [String: Any] = ["status": "connected", "calendarLabel": selected.source.title]
      if let next { connection["nextEventStartsAt"] = next.timeIntervalSince1970 * 1000 }
      if activeEvent { connection["activeEvent"] = true }
      return connection
    }
    AsyncFunction("cacheGeneratedNudges") { (namespace: String, userID: String, raw: String, activity: String, tone: String, messages: [String]) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard messages.isEmpty || (messages.count == 3 && messages.allSatisfy({
        !$0.isEmpty && $0.utf8.count <= 400 && $0.count <= 100 &&
          $0.rangeOfCharacter(from: .controlCharacters.union(.newlines)) == nil
      })) else { throw ProtectionStoreError.invalidRecord }
      try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().updateLatest { state in
          guard let index = state.owners.firstIndex(where: { $0.owner == owner }) else { return }
          state.owners[index].generatedNudges = messages.isEmpty ? nil :
            ProtectionNudgeCopy(activity: activity, tone: tone, messages: messages,
              expiresAt: Date().addingTimeInterval(86400))
        }
      }
    }
    AsyncFunction("setShieldContext") { (namespace: String, userID: String, raw: String, name: String, activity: String) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let cleanName = String(name.components(separatedBy: .controlCharacters).joined(separator: " ")
        .trimmingCharacters(in: .whitespacesAndNewlines).prefix(40))
      let custom = activity.hasPrefix("custom:") ? String(activity.dropFirst("custom:".count)
        .components(separatedBy: .controlCharacters.union(.newlines)).joined(separator: " ")
        .trimmingCharacters(in: .whitespacesAndNewlines).prefix(48)) : ""
      let goal = ["gym", "reading", "arts_and_crafts", "walking", "music", "cooking"].contains(activity)
        ? activity : (custom.isEmpty ? nil : "custom:" + custom)
      let displayName: String? = cleanName.isEmpty ? nil : cleanName
      try self.leases.withLease(owner, token: token) {
        let store = try SharedProtectionStore.appGroup()
        try store.updateLatest { state in
          if let index = state.owners.firstIndex(where: { $0.owner == owner }) {
            state.owners[index].shieldName = displayName
            state.owners[index].shieldActivity = goal
          } else {
            var record = ProtectionOwnerRecord(owner: owner)
            record.shieldName = displayName
            record.shieldActivity = goal
            state.owners.append(record)
          }
        }
      }
    }
    AsyncFunction("budgetCapabilities") { ["scope": "all_selected_apps", "policy": "selected_apps_shared_v1"] }
    AsyncFunction("reviewUsageBaseline") { (namespace: String, userID: String, raw: String) async throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let store = try SharedProtectionStore.appGroup()
      let saved = try self.leases.withLease(owner, token: token) {
        try store.withSnapshot { state -> ProtectionSelection in
          guard let state, state.installedOwner == owner, state.pendingClaim == nil,
            let selection = state.owners.first(where: { $0.owner == owner })?.selection,
            AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
          return selection
        }
      }
      let selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: saved.encodedTokens)
      let result = try await self.usageReport.present(selection: selection) {
        (try? self.leases.withLease(owner, token: token) {
          try store.withSnapshot { state in
            state?.installedOwner == owner && state?.pendingClaim == nil &&
            state?.owners.first(where: { $0.owner == owner })?.selection?.revision == saved.revision &&
            AuthorizationCenter.shared.authorizationStatus == .approved
          }
        }) == true
      }
      return ["state": "confirmed", "source": "user_confirmed_report", "owner": "\(namespace):\(userID.lowercased())",
        "selectionRevision": saved.revision, "selectedAppCount": selection.applicationTokens.count,
        "windowDays": result.days, "totalMinutes": result.totalMinutes, "endsBefore": result.endsBefore, "timezone": result.timezone]
    }
    View(UsageComparisonHost.self) {
      ViewName("UsageComparisonHost")
      Prop("page") { (view: UsageComparisonHost, page: String) in view.page = page }
      Prop("days") { (view: UsageComparisonHost, days: Int) in view.days = days }
      Prop("ownerKey") { (view: UsageComparisonHost, key: String) in view.ownerKey = key }
      Prop("compact") { (view: UsageComparisonHost, compact: Bool) in view.compact = compact }
    }
    Events("onDeviceStatusChanged", "onCalendarChanged")
    OnDestroy {
      if let observer = self.foregroundObserver { NotificationCenter.default.removeObserver(observer) }
      if let observer = self.calendarObserver { NotificationCenter.default.removeObserver(observer) }
    }
    OnCreate {
      self.calendarObserver = NotificationCenter.default.addObserver(
        forName: .EKEventStoreChanged, object: self.calendarStore, queue: .main
      ) { [weak self] _ in
        self?.sendEvent("onCalendarChanged", [:])
      }
      let reconcile: () -> Void = { [weak self] in
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
          ProtectionNativeEngine.pauseForHostReturn()
          if let state = try? SharedProtectionStore.appGroup().read(), let owner = state.installedOwner {
            self?.writeProtectionDiagnostic(owner, stage: "foreground")
          }
          self?.sendEvent("onDeviceStatusChanged", ["reason": "foreground"])
        }
      }
      self.foregroundObserver = NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: nil) { _ in reconcile() }
      reconcile()
      let center = UNUserNotificationCenter.current()
      let delegate = ProtectionNotificationDelegate(previous: center.delegate) { [weak self] in
        self?.sendEvent("onDeviceStatusChanged", ["reason": "notification_accepted"])
      }
      self.notificationDelegate = delegate; center.delegate = delegate
      center.getNotificationCategories { categories in
        let category = UNNotificationCategory(identifier: "hoosh.session.nudge", actions: [
          UNNotificationAction(identifier: "hoosh.nudge.skip", title: "Skip", options: []),
          UNNotificationAction(identifier: "hoosh.nudge.accept", title: "Accept · +30 ✦", options: [.foreground])
        ], intentIdentifiers: [], options: [])
        center.setNotificationCategories(categories.union([category]))
      }
      self.permissionObserver = AuthorizationCenter.shared.$authorizationStatus.dropFirst().sink { [weak self] _ in
        guard let self else { return }
        self.sendEvent("onDeviceStatusChanged", ["reason": "authorization"])
        Task { @MainActor in self.picker.cancel(); self.usageReport.cancel() }
      }
    }
    // Read-only compiler. Preview is not monitor installation or elapsed expiry proof.
    AsyncFunction("schedulePreview") { (input: [String: Any]) throws -> [String: Any] in
      guard JSONSerialization.isValidJSONObject(input) else { throw ScheduleFailure.invalid }
      let data = try JSONSerialization.data(withJSONObject: input)
      guard data.count <= 8192 else { throw ScheduleFailure.capacity }
      let spec = try JSONDecoder().decode(WeeklyProtectionSpec.self, from: data)
      let now = Int64(Date().timeIntervalSince1970 * 1000)
      let windows = try ProtectionSchedules.weekly(spec, now: now)
      let envelopes = try ProtectionSchedules.monitoringEnvelopes(windows)
      return ["windows": windows.map(\.preview), "availability": "preview_only",
              "requiresTimingVerification": true,
              "usesPaddedMonitoringIntervals": envelopes.contains(where: { $0.startsAt < $0.businessStartsAt }),
              "activationAvailable": false, "blocker": "elapsed_session_expiry_unverified"]
    }
    AsyncFunction("rewardsRead") { (namespace: String, userID: String, raw: String) throws -> [String: Any]? in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().rewardsRead(owner: owner)
      }
    }
    AsyncFunction("dinoHealthWarning") { (namespace: String, userID: String, raw: String, warningAt: Double, low: Bool) async throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard warningAt.isFinite, warningAt > 0, warningAt <= 4102444800000 else {
        throw ProtectionStoreError.invalidRecord
      }
      try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().updateLatest { state in
          guard let index = state.owners.firstIndex(where: { $0.owner == owner }) else { return }
          state.owners[index].dinoLowUntil = low ? Date().addingTimeInterval(86400) : nil
          state.owners[index].dinoWarningAt = Date(timeIntervalSince1970: warningAt / 1000)
        }
      }
      let center = UNUserNotificationCenter.current()
      let authorization = await center.notificationSettings().authorizationStatus
      guard [.authorized, .provisional, .ephemeral].contains(authorization) else { return }
      try self.leases.withLease(owner, token: token) {
        let id = Self.dinoWarningID
        let key = id + "." + ProtectionRuntimePlanner.prefix(owner)
        let defaults = UserDefaults.standard
        let now = Date().timeIntervalSince1970
        let due = max(now + 1, warningAt / 1000)
        let scheduled = defaults.double(forKey: key)
        if self.dinoWarningLease == token {
          if low && scheduled > 0 && scheduled <= now + 1 { return }
          if !low && scheduled == due { return }
        }
        let content = UNMutableNotificationContent()
        content.title = "Dino could use a little care"
        content.body = "Your little friend is feeling droopy. Open Hoosh to check in and give Dino a snack when you have 10 credits."
        content.categoryIdentifier = id
        content.sound = .default
        let request = UNNotificationRequest(identifier: id, content: content,
          trigger: UNTimeIntervalNotificationTrigger(timeInterval: due - now, repeats: false))
        if !low { center.removeDeliveredNotifications(withIdentifiers: [id]) }
        self.dinoWarningLease = token
        defaults.set(due, forKey: key)
        center.add(request)
      }
    }
    AsyncFunction("rewardsAck") { (namespace: String, userID: String, raw: String, installation: String, sequence: Double) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: installation), sequence.isFinite, sequence.rounded() == sequence,
        sequence > 0, sequence <= Double(ProtectionRewardJournal.maximum) else { throw ProtectionStoreError.invalidRecord }
      try self.leases.withLease(owner, token: token) {
        try SharedProtectionStore.appGroup().rewardsAck(owner: owner, installation: id, sequence: UInt64(sequence))
      }
    }
    AsyncFunction("runtimeRead") { (namespace: String, userID: String, raw: String, quest: String?) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      defer { self.writeProtectionDiagnostic(owner, stage: "read") }
      return try self.leases.withLease(owner, token: token) {
        let id = quest.flatMap(UUID.init(uuidString:))
        guard quest == nil || id != nil else { throw ProtectionTransactionError.invalid }
        return try ProtectionBridge.read(store: .appGroup(), owner: owner, questID: id)
      }
    }
    AsyncFunction("runtimeApply") { (namespace: String, userID: String, raw: String, json: String) async throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      let (command, canonical) = try ProtectionBridge.command(json)
      do {
        _ = try ProtectionTransactions(store: .appGroup(), leases: self.leases).apply(owner: owner, token: token,
          requestID: command.requestID, expected: command.expectedRevision, selectionRevision: command.selectionRevision,
          canonicalCommand: canonical, driver: ProtectionNativeDriver(owner: owner), build: command.build)
      } catch {
        self.writeProtectionDiagnostic(owner, stage: "apply_failed", error: error)
        throw error
      }
      self.writeProtectionDiagnostic(owner, stage: "apply_confirmed")
      if ProtectionActivationGate.enabled {
        // The installed plan should be confirmed even while the notification
        // permission alert is still waiting for a response.
        Task { _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) }
      }
      ProtectionNativeEngine.syncNudges(owner: owner)
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
      return try self.leases.withLease(owner, token: token) {
        try ProtectionBridge.read(store: .appGroup(), owner: owner, questID: command.quest?.questID ?? command.questID)
      }
    }
    AsyncFunction("runtimeRecover") { (namespace: String, userID: String, raw: String, request: String) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: request) else { throw ProtectionTransactionError.invalid }
      do {
        _ = try ProtectionTransactions(store: .appGroup(), leases: self.leases).recover(owner: owner, token: token,
          requestID: id, driver: ProtectionNativeDriver(owner: owner))
        self.writeProtectionDiagnostic(owner, stage: "recover_confirmed")
      } catch {
        self.writeProtectionDiagnostic(owner, stage: "recover_failed", error: error)
        throw error
      }
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
    }
    AsyncFunction("deviceDiagnostics") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.leases.withLease(owner, token: token) {
        let state = try SharedProtectionStore.appGroup().read()
        guard state?.installedOwner == owner, state?.pendingClaim == nil else { throw ProtectionStoreError.staleLease }
        // Never export ticks or boot identity. Availability is a read-only diagnostic.
        return ["schemaVersion": 1, "platform": "ios", "activationAvailable": ProtectionActivationGate.enabled,
          "clockAvailable": (try? ProtectionDeviceClock.sample()) != nil,
          "scopedMonitorCount": ProtectionOSAdapter.scopedMonitorCount, "enforcementVerified": false]
      }
    }
    AsyncFunction("deviceStatus") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.leases.withLease(owner, token: token) {
        let state = try SharedProtectionStore.appGroup().read()
        guard state?.installedOwner == owner, state?.pendingClaim == nil,
              let record = state?.owners.first(where: { $0.owner == owner }) else { throw SelectionFailure.unavailable }
        let authorization: String
        switch AuthorizationCenter.shared.authorizationStatus {
        case .approved: authorization = "authorized"
        case .denied: authorization = "denied"
        case .notDetermined: authorization = "not_requested"
        @unknown default: authorization = "unavailable"
        }
        // C04 has not registered the schedule engine. No active claim can be made.
        let uncertain = record.pendingInstallation != nil || record.installation?.enabled == true
          || ProtectionDeviceTransition.protectionPresent
        let deviceState = authorization != "authorized" ? "needs_permission"
          : (record.reasons.isEmpty && !uncertain ? "inactive" : "degraded")
        return ["schemaVersion": 1, "owner": "\(namespace):\(userID.lowercased())",
          "platform": "ios", "mode": "system_shield", "selectionUI": "native_picker",
          "authorization": authorization,
          "state": deviceState,
          "installedRevision": NSNull(), "installedReasonIds": [] as [String],
          "supportsScheduledRestriction": false, "supportsTemporaryAllowance": false,
          "supportsUsageThreshold": false, "supportsAdvanceWarning": false, "supportsUsageSummary": false]
      }
    }
    // Credential-free verified product identity. This never reads or claims disk state.
    AsyncFunction("beginOwnerSession") { (namespace: String, userID: String) throws -> String in
      guard !namespace.isEmpty, namespace.utf8.count <= 256,
            let id = UUID(uuidString: userID) else { throw ProtectionStoreError.invalidRecord }
      return self.leases.begin(ProtectionOwner(namespace: namespace, userID: id)).uuidString
    }
    AsyncFunction("endOwnerSession") { (raw: String) throws in
      guard let token = UUID(uuidString: raw) else { throw ProtectionStoreError.invalidRecord }
      self.leases.end(token)
      if self.dinoWarningLease == token {
        self.dinoWarningLease = nil
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [Self.dinoWarningID])
        center.removeDeliveredNotifications(withIdentifiers: [Self.dinoWarningID])
      }
      Task { @MainActor in self.picker.cancel(lease: token); self.usageReport.cancel() }
    }
    AsyncFunction("readInstallation") { (namespace: String, userID: String, rawToken: String) throws -> [String: String] in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      return try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .read(owner: owner, token: token, legacyPresent: ProtectionDeviceTransition.legacyPresent)
    }
    AsyncFunction("claimInstallation") { (namespace: String, userID: String, rawToken: String, revision: String, confirmed: Bool) throws in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      let priorState = try SharedProtectionStore.appGroup().read()
      let priorOwner = priorState?.installedOwner
      let priorSessions = priorState?.owners.first(where: { $0.owner == priorOwner })?.sessionLedger?.sessions.map { $0.id.uuidString } ?? []
      try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .claim(owner: owner, token: token, revision: revision, confirmed: confirmed,
               stopAndVerify: ProtectionDeviceTransition.stopAndVerify)
      if let priorOwner {
        let prefix = "hoosh.shared.nudge." + ProtectionRuntimePlanner.prefix(priorOwner)
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
          let ids = requests.filter { request in priorSessions.contains { request.identifier.hasPrefix(prefix + $0 + ".") } }.map(\.identifier)
          UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
          UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ids)
        }
      }
      self.invalidateSelections()
      self.sendEvent("onDeviceStatusChanged", ["reason": "installation"])
      Task { @MainActor in self.picker.cancel(lease: token); self.usageReport.cancel() }
    }
    AsyncFunction("requestDeviceAuthorization") { (namespace: String, userID: String, raw: String) async throws -> String in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try await self.requestForOwner(owner, token: token)
    }
    AsyncFunction("selectionRead") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.selectionResult { try self.selections().read(owner: owner, token: token,
        authorized: AuthorizationCenter.shared.authorizationStatus == .approved) }
    }
    AsyncFunction("selectionBegin") { (namespace: String, userID: String, raw: String) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.selectionResult {
        guard AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
        return try self.selections().begin(owner: owner, token: token)
      }
    }
    AsyncFunction("selectionPick") { (namespace: String, userID: String, raw: String, draftID: String, version: Int) async throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: draftID) else { throw SelectionFailure.expired }
      let initial = try self.selectionResult { try self.selections().snapshot(owner: owner, token: token, id: id, version: version) }
      let chosen: FamilyActivitySelection
      do {
        chosen = try await self.pick(initial, owner: owner, token: token)
      } catch let failure as SelectionFailure {
        throw Exception(name: "SelectionError", description: "Picker closed without saving.", code: failure.rawValue)
      }
      return try self.selectionResult {
        guard AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
        return try self.selections().replace(owner: owner, token: token, id: id, version: version, value: chosen)
      }
    }
    AsyncFunction("selectionCommit") { (namespace: String, userID: String, raw: String, draftID: String, version: Int) throws -> [String: Any] in
      let (owner, token) = try self.owner(namespace, userID, raw)
      return try self.selectionResult {
        guard let id = UUID(uuidString: draftID) else { throw SelectionFailure.expired }
        guard AuthorizationCenter.shared.authorizationStatus == .approved else { throw SelectionFailure.unavailable }
        let result = try self.selections().commit(owner: owner, token: token, id: id, version: version)
        self.sendEvent("onDeviceStatusChanged", ["reason": "selection"])
        DispatchQueue.main.async {
          NotificationCenter.default.post(name: UsageComparisonHost.selectionChanged, object: nil)
        }
        return result
      }
    }
    AsyncFunction("selectionRelease") { (namespace: String, userID: String, raw: String, draftID: String) throws in
      let (owner, token) = try self.owner(namespace, userID, raw)
      guard let id = UUID(uuidString: draftID) else { return }
      try self.selections().release(owner: owner, token: token, id: id)
    }
    OnDestroy {
      self.permissionObserver?.cancel()
      self.leases.destroy()
      self.invalidateSelections()
      Task { @MainActor in self.picker.cancel(); self.usageReport.cancel() }
    }
    AsyncFunction("getAuthorization") { () -> String in
      await MainActor.run { self.authorization() }
    }
    AsyncFunction("requestAuthorization") { () async throws -> String in
      try await self.request()
    }
  }

  private func owner(_ namespace: String, _ userID: String, _ rawToken: String) throws -> (ProtectionOwner, UUID) {
    guard !namespace.isEmpty, namespace.utf8.count <= 256,
          let user = UUID(uuidString: userID), let token = UUID(uuidString: rawToken) else {
      throw ProtectionStoreError.invalidRecord
    }
    return (ProtectionOwner(namespace: namespace, userID: user), token)
  }

  private func invalidateSelections() {
    transactionLock.lock(); defer { transactionLock.unlock() }
    transactions?.invalidate()
  }
  @MainActor private func requestForOwner(_ owner: ProtectionOwner, token: UUID) async throws -> String {
    try leases.require(owner, token: token)
    let state = try SharedProtectionStore.appGroup().read()
    guard state?.installedOwner == owner, state?.pendingClaim == nil else { throw SelectionFailure.unavailable }
    let result = try await request()
    try leases.require(owner, token: token)
    return result
  }
  @MainActor private func pick(_ initial: FamilyActivitySelection, owner: ProtectionOwner, token: UUID) async throws -> FamilyActivitySelection {
    guard AuthorizationCenter.shared.authorizationStatus == .approved,
          let presenter = appContext?.utilities?.currentViewController() else { throw SelectionFailure.unavailable }
    try leases.require(owner, token: token)
    return try await picker.pick(initial, lease: token, presenter: presenter)
  }

  @MainActor private func request() async throws -> String {
    // Already-approved access must not reopen the system authorization flow.
    if AuthorizationCenter.shared.authorizationStatus == .approved { return authorization() }
    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
    return authorization()
  }

  @MainActor private func authorization() -> String {
    switch AuthorizationCenter.shared.authorizationStatus {
    case .approved: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "not_requested"
    @unknown default: return "unavailable"
    }
  }
}

private final class ProtectionNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
  private weak var previous: UNUserNotificationCenterDelegate?
  private let accepted: () -> Void
  init(previous: UNUserNotificationCenterDelegate?, accepted: @escaping () -> Void) {
    self.previous = previous; self.accepted = accepted
  }
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    if ["hoosh.session.nudge", "hoosh.dino.health"].contains(notification.request.content.categoryIdentifier) {
      completionHandler([.banner, .sound]); return
    }
    if let previous, previous.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:willPresent:withCompletionHandler:))) {
      previous.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
    } else { completionHandler([]) }
  }
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void) {
    if response.notification.request.content.categoryIdentifier == "hoosh.session.nudge" {
      let info = response.notification.request.content.userInfo
      let tappedToPause = response.actionIdentifier == UNNotificationDefaultActionIdentifier && info["tapToPause"] as? Bool == true
      if response.actionIdentifier == "hoosh.nudge.accept" || tappedToPause {
        ProtectionNativeEngine.respondToNotification(response.notification.request.content.userInfo, accept: true)
        accepted()
      } else if response.actionIdentifier == "hoosh.nudge.skip" {
        ProtectionNativeEngine.respondToNotification(response.notification.request.content.userInfo, accept: false)
        accepted()
      }
      completionHandler(); return
    }
    if let previous, previous.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:))) {
      previous.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
    } else { completionHandler() }
  }
}

/// Install before React starts so notification Accept also works from a cold launch.
public enum HooshNudgeNotifications {
  private static var retainedDelegate: ProtectionNotificationDelegate?
  public static func install() {
    let center = UNUserNotificationCenter.current()
    if center.delegate is ProtectionNotificationDelegate { return }
    let delegate = ProtectionNotificationDelegate(previous: center.delegate, accepted: {})
    retainedDelegate = delegate; center.delegate = delegate
  }
}
