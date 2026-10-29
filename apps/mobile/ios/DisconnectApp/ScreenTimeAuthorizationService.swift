import Foundation
import Combine
import FamilyControls

@MainActor
final class ScreenTimeAuthorizationService: ObservableObject {
    @Published private(set) var status = AuthorizationCenter.shared.authorizationStatus
    @Published var errorMessage: String?

    var isApproved: Bool {
        status == .approved
    }

    var statusText: String {
        switch status {
        case .notDetermined:
            return "Not requested yet"
        case .denied:
            return "Denied"
        case .approved:
            return "Approved"
        @unknown default:
            return "Unknown"
        }
    }

    func requestAuthorization() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            status = AuthorizationCenter.shared.authorizationStatus
            errorMessage = nil
        } catch {
            status = AuthorizationCenter.shared.authorizationStatus
            errorMessage = error.localizedDescription
        }
    }

    func refreshStatus() {
        status = AuthorizationCenter.shared.authorizationStatus
    }
}
