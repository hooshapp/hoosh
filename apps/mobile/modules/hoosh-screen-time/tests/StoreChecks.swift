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
      if args[1] == "legacy" {
        let store = SharedProtectionStore(directory: root)
        let allowed = try store.withSnapshot { $0?.permitsLegacyCallbacks ?? true }
        _exit(allowed ? 12 : 0)
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
    var context = ProtectionOwnerRecord(owner: a)
    context.shieldActivity = "reading"
    let localLines = (0..<3).map { context.contextualLine($0, turn: 0) }
    expect(Set(localLines).count == 3 && localLines.allSatisfy { $0.contains("reading") },
      "local checkpoints vary and remember the goal")
    context.generatedNudges = .init(activity: "reading", tone: "Supportive",
      messages: ["Put your book nearby.", "Open the book.", "Read a page."],
      expiresAt: Date().addingTimeInterval(3600))
    expect(context.contextualLine(0, turn: 0) == "Put your book nearby.", "AI copy is automatic")
    expect(context.contextualLine(0, turn: 1).contains("50 credits"), "quest copy is automatic")
    expect(context.contextualLine(0, turn: 2) == "Put your book nearby.", "disconnected Calendar uses goal copy")
    expect(context.contextualLine(0, turn: 4).contains("Dino"), "occasional healthy Dino reminder")
    context.dinoLowUntil = Date().addingTimeInterval(3600)
    let lowCycle = (0..<6).map { context.contextualLine(0, turn: $0) }
    expect(lowCycle.enumerated().allSatisfy { $0.element.contains("Dino") == ($0.offset % 2 == 0) },
      "low health gets every other turn")
    context.dinoLowUntil = nil
    context.dinoWarningAt = Date().addingTimeInterval(-1)
    expect(context.contextualLine(0, turn: 0).contains("Dino"), "scheduled health decay still prioritizes Dino")
    context.dinoWarningAt = Date().addingTimeInterval(3600)
    context.googleCalendarID = "synced-calendar"
    context.googleCalendarEventAt = Date().addingTimeInterval(300)
    expect(context.contextualLine(0, turn: 2).contains("Google Calendar"), "Google Calendar works with Apple Calendar off")
    context.calendarNudges = true
    context.calendarEventAt = Date().addingTimeInterval(120)
    expect(context.contextualLine(0, turn: 2).contains("Apple Calendar"), "Apple Calendar gets its own turn")
    expect(context.contextualLine(0, turn: 10).contains("Google Calendar"), "Google Calendar gets the next turn")
    context.calendarNudges = false
    let testNow = ISO8601DateFormatter().date(from: "2026-11-27T16:00:00Z")!
    let eastern = TimeZone(identifier: "America/New_York")!
    var calendarContext = ProtectionOwnerRecord(owner: a)
    calendarContext.googleCalendarID = "synced-calendar"
    calendarContext.googleCalendarEventAt = testNow.addingTimeInterval(3 * 3600)
    let holiday = calendarContext.nextNotificationLine(checkpoint: 0, now: testNow, region: "US", timeZone: eastern)
    expect(holiday.contains("Google Calendar in 3h") && holiday.contains("Black Friday"),
      "Black Friday and a real Google event several hours away can appear together")
    func nudgeKinds(_ lines: [String]) -> [String] {
      lines.map { line in
        if line.contains("Calendar") { return "calendar" }
        if line.contains("Dino") { return "dino" }
        if line.contains("50 credits") { return "quest" }
        return "goal"
      }
    }
    func orderedNudges(google: Bool, apple: Bool, low: Bool, tomorrow: Bool = false) -> [String] {
      var record = ProtectionOwnerRecord(owner: a)
      let start = testNow.addingTimeInterval(tomorrow ? 18 * 3600 : 3600)
      if google { record.googleCalendarID = "synced-calendar"; record.googleCalendarEventAt = start }
      if apple { record.calendarNudges = true; record.calendarEventAt = start }
      if low { record.dinoLowUntil = testNow.addingTimeInterval(3600) }
      let group = UUID()
      return nudgeKinds((0..<6).map { checkpoint in
        record.nextNotificationLine(checkpoint: checkpoint, session: group,
          now: testNow, region: nil, timeZone: eastern)
      })
    }
    let calendarLow = ["calendar", "dino", "goal"]
    let calendarHealthy = ["calendar", "dino", "quest"]
    let noCalendarLow = ["dino", "goal", "quest"]
    let noCalendarHealthy = ["goal", "quest", "dino"]
    for (google, apple, low, tomorrow, expected) in [
      (true, true, true, false, calendarLow), (true, false, true, false, calendarLow),
      (false, true, true, false, calendarLow), (true, false, false, false, calendarHealthy),
      (false, true, false, false, calendarHealthy), (true, true, false, false, calendarHealthy),
      (false, false, true, false, noCalendarLow), (false, false, false, false, noCalendarHealthy),
      (true, false, true, true, noCalendarLow), (true, false, false, true, noCalendarHealthy),
    ] {
      expect(orderedNudges(google: google, apple: apple, low: low, tomorrow: tomorrow) == expected + expected,
        "each session starts with the required order and repeats it for additional checkpoints")
    }
    calendarContext.googleCalendarID = nil
    expect(!calendarContext.contextualLine(0, turn: 2, now: testNow).contains("Google Calendar"),
      "a disconnected calendar cannot supply a nudge")
    var liveCalendar = ProtectionOwnerRecord(owner: a)
    let begins = testNow.addingTimeInterval(960)
    let ends = begins.addingTimeInterval(3600)
    liveCalendar.directGoogleCalendarEvents = [
      ProtectionCalendarEvent(startsAt: begins, endsAt: ends, title: "Homework"),
    ]
    liveCalendar.googleTaskTitles = ["Submit essay", "Call the library"]
    liveCalendar.googleTasksRefreshedAt = testNow
    liveCalendar.shieldActivity = "reading"
    func firstNudge(_ now: Date) -> String {
      liveCalendar.nextNotificationLine(checkpoint: 0, session: UUID(), now: now, region: nil, timeZone: eastern)
    }
    expect(firstNudge(testNow).contains("Homework starts in 16m."), "timed Google nudge names the event")
    expect(firstNudge(begins).contains("Submit essay is still open."), "a task gets a turn with an overlapping event")
    expect(firstNudge(ends.addingTimeInterval(-1)).contains("Homework is on now."), "the event stays eligible until its end")
    expect(firstNudge(ends).contains("Call the library is still open."), "the ended event stops and the next pending task gets a turn")
    expect(firstNudge(ends.addingTimeInterval(1)).contains("Submit essay"), "unfinished tasks are eligible across sessions")
    liveCalendar.googleTaskTitles = []
    expect(firstNudge(ends.addingTimeInterval(2)).contains("reading"), "completed tasks are dropped and the goal order returns")
    var appleContext = ProtectionOwnerRecord(owner: a)
    appleContext.calendarNudges = true
    appleContext.appleCalendarEvents = [
      ProtectionCalendarEvent(startsAt: begins, endsAt: ends, title: "Study group"),
    ]
    appleContext.appleRemindersEnabled = true
    appleContext.appleRemindersRefreshedAt = testNow
    appleContext.appleReminders = [
      ProtectionAppleReminder(title: "Submit lab", dueDate: testNow.addingTimeInterval(1800)),
      ProtectionAppleReminder(title: "Tomorrow’s lab", dueDate: testNow.addingTimeInterval(86400)),
      ProtectionAppleReminder(title: "Pick up a book", dueDate: nil),
    ]
    func appleNudge(_ now: Date) -> String {
      appleContext.nextNotificationLine(checkpoint: 0, session: UUID(), now: now, region: nil, timeZone: eastern)
    }
    expect(appleNudge(testNow).contains("Study group starts in 16m."), "Apple and Google both give the first turn to a timed event")
    expect(appleNudge(begins).contains("Submit lab"), "a reminder due today takes the next calendar slot while the event is active")
    expect(appleNudge(ends.addingTimeInterval(-1)).contains("Study group is on now."), "ongoing Apple Calendar events keep their turn up to the end")
    expect(appleNudge(ends).contains("Pick up a book"), "the ended event and tomorrow's reminder are ineligible, and undated reminders keep rotating")
    appleContext.appleReminders = [ProtectionAppleReminder(title: "Tomorrow’s lab", dueDate: testNow.addingTimeInterval(86400))]
    expect(!appleNudge(ends).contains("Pick up a book"), "a completed Apple Reminder drops out on refresh")
    appleContext.appleReminders = [ProtectionAppleReminder(title: "Pick up a book", dueDate: nil)]
    appleContext.appleRemindersEnabled = false
    expect(!appleNudge(ends).contains("Pick up a book"), "disabling Reminders excludes any cached titles")
    var holidayContext = ProtectionOwnerRecord(owner: a)
    let newYear = ProtectionPublicHoliday(name: "New Year's Day", startsAt: testNow.addingTimeInterval(-3600),
      endsAt: testNow.addingTimeInterval(3600))
    holidayContext.publicHoliday = newYear
    holidayContext.holidayNudgeMessages = ["New Year's Day: send a warm note to a friend."]
    expect(holidayContext.nextNotificationLine(checkpoint: 0, now: testNow, region: nil)
      .contains("send a warm note"), "use prepared AI copy for a calendar holiday")
    holidayContext.nudgeTurn = 0
    expect(!holidayContext.nextNotificationLine(checkpoint: 0, now: testNow, region: nil)
      .contains(newYear.name), "holiday copy does not repeat on every checkpoint")
    holidayContext.lastHolidayNudge = nil
    holidayContext.holidayNudgeMessages = nil
    holidayContext.nudgeTurn = 0
    expect(holidayContext.nextNotificationLine(checkpoint: 0, now: testNow, region: nil)
      .contains(newYear.name), "offline holiday copy preserves the holiday name")
    context.googleCalendarID = nil
    expect(context.contextualLine(0, turn: 2) == "Put your book nearby.", "Google disconnect removes it from rotation")
    var delivered: [String] = []
    for checkpoint in 0..<30 {
      // Round-trip between notifications to simulate the extension restarting.
      context = try JSONDecoder().decode(ProtectionOwnerRecord.self, from: JSONEncoder().encode(context))
      let line = context.nextNotificationLine(checkpoint: checkpoint % 3, region: nil)
      expect(delivered.last != line, "avoid immediate repetition while keeping the category")
      delivered.append(line)
    }
    expect(delivered.contains("Put your book nearby.") && delivered.contains { $0.contains("50 credits") },
      "rotation retains AI and quest copy")
    context.nudgeTone = "Direct"
    expect(context.contextualLine(0, turn: 0) == "Pick one next step for reading.", "tone changes immediately without a new pack")
    context.shieldActivity = "custom:sketching"
    expect(context.contextualLine(0, turn: 0) == "Pick one next step for sketching.", "custom goals remain local and personalized")
    try expect(try store.read() == nil, "missing must stay missing")
    let first = try store.update(expectedRevision: nil) { state in
      state.owners = [ProtectionOwnerRecord(owner: a)]
      state.installedOwner = a
    }
    expect(first.revision == 1, "first atomic revision")
    // Shield reads must finish even while a writer owns the transaction lock.
    let preparedAt = Date()
    let target = Data("target-token".utf8)
    let expiredCard = ProtectionShieldPresentation(name: nil, activity: "reading",
      generatedLine: nil, expired: true, resuming: false, seconds: 300, canContinue: false,
      allowanceApplied: false, used: 3, limit: 3, rewardPoints: 20)
    try store.saveExpiryPresentation(.init(preparedAt: preparedAt, apps: [target: expiredCard]))
    expect(store.expiryPresentation(for: target, now: preparedAt.addingTimeInterval(1)) == expiredCard,
      "expiry presentation reads independently of the owner ledger and preserves the cap")
    expect(store.expiryPresentation(for: Data("different-token".utf8), now: preparedAt) == nil,
      "expiry presentation belongs to the exact shielded app")
    expect(store.expiryPresentation(for: target, now: preparedAt.addingTimeInterval(30)) == nil,
      "expiry handoff never serves stale presentation")
    store.clearExpiryPresentation()
    expect(store.expiryPresentation(for: target, now: preparedAt) == nil,
      "an allowance or plan change can invalidate the old view")
    let rendering = SharedProtectionStore(directory: root, beforeRename: {
      try expect(try store.presentationSnapshot() == first, "rendering sees the last committed state without waiting on writer lock")
      throw ProtectionStoreError.unavailable
    })
    try fails(.unavailable) { try rendering.update(expectedRevision: 1) { $0.owners[0].coverage = "observed" } }
    try expect(try store.presentationSnapshot() == first, "rendering cannot commit an interrupted write")
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
    try Data("{\"version\":5}".utf8).write(to: path)
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
    let installation = ProtectionInstallation(store: store, leases: leases)
    let ownerToken = leases.begin(b)
    let review = try installation.read(owner: b, token: ownerToken, legacyPresent: { false })
    expect(review["status"] == "other_owner", "other account gets neutral status")
    expect(!review.values.contains(a.userID.uuidString), "no previous-owner identity in bridge status")
    var stopped = false
    do {
      try installation.claim(owner: b, token: ownerToken, revision: review["revision"]!, confirmed: false) { stopped = true }
      fatalError("unconfirmed claim succeeded")
    } catch InstallationError.confirmationRequired {}
    expect(!stopped, "cancel never stops protection")
    do {
      try installation.claim(owner: b, token: ownerToken, revision: "missing", confirmed: true) { stopped = true }
      fatalError("stale revision succeeded")
    } catch InstallationError.changed {}
    try fails(.unavailable) {
      try installation.claim(owner: b, token: ownerToken, revision: review["revision"]!, confirmed: true) {
        throw ProtectionStoreError.unavailable
      }
    }
    let interrupted = try store.read()!
    expect(interrupted.installedOwner == a && interrupted.pendingClaim?.nextOwner == b, "failed stop retains attribution and pending claim")
    let pendingReview = try installation.read(owner: b, token: ownerToken, legacyPresent: { true })
    expect(pendingReview["status"] == "claim_pending", "interrupted claim has explicit retry state")
    let lateCallback = process("legacy", root)
    try installation.claim(owner: b, token: ownerToken, revision: pendingReview["revision"]!, confirmed: true) {
      stopped = true
      try lateCallback.run()
    }
    lateCallback.waitUntilExit()
    expect(lateCallback.terminationStatus == 0, "extension callback after Stop cannot restore previous shields")
    let claimed = try store.read()!
    expect(stopped && claimed.installedOwner == b && claimed.pendingClaim == nil, "only verified Stop completes claim")
    expect(claimed.owners.contains(where: { $0.owner == a }), "prior owner data retained")
    expect(claimed.legacyStopped == true && !claimed.permitsLegacyCallbacks, "legacy tombstone fences future callbacks")
    let oldFixture = root.appendingPathComponent("old-store")
    try FileManager.default.createDirectory(at: oldFixture, withIntermediateDirectories: true)
    try Data("{\"version\":1,\"revision\":1,\"owners\":[]}".utf8).write(to: oldFixture.appendingPathComponent("state-v1.json"))
    let upgraded = try SharedProtectionStore(directory: oldFixture).read()!
    expect(upgraded.revision == 1 && upgraded.legacyStopped == nil && upgraded.permitsLegacyCallbacks,
           "previous v1 fixture reads without inventing migration acknowledgment")
    let own = try installation.read(owner: b, token: ownerToken, legacyPresent: { true })
    expect(own["status"] == "owned", "retained legacy files do not trigger repeated migration")
    let selections = SelectionTransactions(store: store, leases: leases, empty: Set<String>()) { $0.count }
    let initialDraft = try selections.begin(owner: b, token: ownerToken)
    let draftID = UUID(uuidString: initialDraft["draftId"] as! String)!
    let changed = try selections.replace(owner: b, token: ownerToken, id: draftID, version: 0, value: ["native-token-a"])
    expect(changed["dirty"] as? Bool == true, "picker updates only draft")
    let beforeSave = try selections.read(owner: b, token: ownerToken, authorized: true)
    expect(beforeSave["selectedAppCount"] as? Int == 0, "Done is not Save")
    let saved = try selections.commit(owner: b, token: ownerToken, id: draftID, version: 1)
    expect(saved["baseRevision"] as? UInt64 == 1 && saved["dirty"] as? Bool == false, "save/readback acknowledges revision")
    let duplicate = try selections.commit(owner: b, token: ownerToken, id: draftID, version: 1)
    expect(duplicate["baseRevision"] as? UInt64 == 1, "same draft save retry does not advance revision")
    let equalCount = try selections.replace(owner: b, token: ownerToken, id: draftID, version: 1, value: ["native-token-b"])
    expect(equalCount["dirty"] as? Bool == true && equalCount["selectedAppCount"] as? Int == 1,
           "same count different tokens remains dirty")
    try selections.release(owner: b, token: ownerToken, id: draftID)
    let cancelRead = try selections.read(owner: b, token: ownerToken, authorized: true)
    expect(cancelRead["revision"] as? UInt64 == 1, "release/cancel preserves saved selection")
    let next = try selections.begin(owner: b, token: ownerToken)
    let nextID = UUID(uuidString: next["draftId"] as! String)!
    _ = try selections.begin(owner: b, token: ownerToken)
    do {
      _ = try selections.snapshot(owner: b, token: ownerToken, id: nextID, version: 0)
      fatalError("competing editor retained old handle")
    } catch SelectionFailure.expired {}
    let revoked = try selections.read(owner: b, token: ownerToken, authorized: false)
    expect(revoked["needsReselection"] as? Bool == true, "revocation preserves saved bytes but marks review required")
    let stale = try selections.begin(owner: b, token: ownerToken)
    let staleID = UUID(uuidString: stale["draftId"] as! String)!
    let stored = try store.read()!
    try store.update(expectedRevision: stored.revision) { state in
      let index = state.owners.firstIndex(where: { $0.owner == b })!
      state.owners[index].selection = ProtectionSelection(revision: 2, encodedTokens: try JSONEncoder().encode(Set(["native-token-c"])))
    }
    do {
      _ = try selections.commit(owner: b, token: ownerToken, id: staleID, version: 0)
      fatalError("stale editor overwrote external selection")
    } catch SelectionFailure.conflict {}
    var clock = Date()
    let expiring = SelectionTransactions(store: store, leases: leases, empty: Set<String>(), now: { clock }) { $0.count }
    let expiringDraft = try expiring.begin(owner: b, token: ownerToken)
    let expiringID = UUID(uuidString: expiringDraft["draftId"] as! String)!
    clock = clock.addingTimeInterval(901)
    do {
      _ = try expiring.snapshot(owner: b, token: ownerToken, id: expiringID, version: 0)
      fatalError("expired draft remained usable")
    } catch SelectionFailure.expired {}
    print("PASS: selection draft/Save separation, idempotent readback, token equality, cancel, competing editors, revoked-access summary and stale-revision refusal")
    leases.end(ownerToken)
    try fails(.staleLease) {
      try installation.claim(owner: b, token: ownerToken, revision: own["revision"]!, confirmed: true) { fatalError("stale session stopped settings") }
    }
    print("PASS: confirmed claim, cancel, stale revision, failed-stop recovery, previous-owner retention, legacy tombstone, expired-session rejection")
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
