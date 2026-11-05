import Foundation
import UIKit

/// Measures Disconnect's OWN observed foreground visits, separately from
/// selected-app usage checkpoints. No inference about other apps' launch events.
@MainActor final class StudyAppVisitTracker {
    static let shared = StudyAppVisitTracker()
    private var started: Date?
    private var user: String?
    private var visit: String?
    func becameActive() {
        guard UIApplication.shared.applicationState == .active,
              let currentUser = ShieldPresentationStore.defaults.string(forKey:NativeResearchQueue.userKey) else { return }
        guard started == nil || user != currentUser else { return }
        started = Date(); user = currentUser; visit = UUID().uuidString
        NativeResearchQueue.enqueue("app_visit_started",properties:["visit_id":visit!])
    }
    func enteredBackground() {
        defer { started = nil; user = nil; visit = nil }
        guard let started, let visit, user == ShieldPresentationStore.defaults.string(forKey:NativeResearchQueue.userKey) else { return }
        let seconds = min(86400,max(0,Int(Date().timeIntervalSince(started))))
        NativeResearchQueue.enqueue("app_visit_ended",properties:["visit_id":visit,"foreground_seconds":String(seconds)])
    }
}
