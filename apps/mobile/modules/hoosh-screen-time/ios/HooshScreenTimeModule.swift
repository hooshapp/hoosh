import ExpoModulesCore
import FamilyControls

public class HooshScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HooshScreenTime")
    AsyncFunction("getAuthorization") { () -> String in
      await MainActor.run { self.authorization() }
    }
    AsyncFunction("requestAuthorization") { () async throws -> String in
      try await self.request()
    }
  }

  @MainActor private func request() async throws -> String {
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
