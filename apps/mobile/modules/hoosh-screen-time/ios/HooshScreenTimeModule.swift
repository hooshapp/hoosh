import ExpoModulesCore
import FamilyControls

public class HooshScreenTimeModule: Module {
  private let leases = ProtectionOwnerLeases()
  public func definition() -> ModuleDefinition {
    Name("HooshScreenTime")
    // Credential-free verified product identity. This never reads or claims disk state.
    AsyncFunction("beginOwnerSession") { (namespace: String, userID: String) throws -> String in
      guard !namespace.isEmpty, namespace.utf8.count <= 256,
            let id = UUID(uuidString: userID) else { throw ProtectionStoreError.invalidRecord }
      return self.leases.begin(ProtectionOwner(namespace: namespace, userID: id)).uuidString
    }
    AsyncFunction("endOwnerSession") { (raw: String) throws in
      guard let token = UUID(uuidString: raw) else { throw ProtectionStoreError.invalidRecord }
      self.leases.end(token)
    }
    OnDestroy { self.leases.destroy() }
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
