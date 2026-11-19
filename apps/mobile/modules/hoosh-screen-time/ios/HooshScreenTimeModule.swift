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
    AsyncFunction("readInstallation") { (namespace: String, userID: String, rawToken: String) throws -> [String: String] in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      return try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .read(owner: owner, token: token, legacyPresent: ProtectionDeviceTransition.legacyPresent)
    }
    AsyncFunction("claimInstallation") { (namespace: String, userID: String, rawToken: String, revision: String, confirmed: Bool) throws in
      let (owner, token) = try self.owner(namespace, userID, rawToken)
      try ProtectionInstallation(store: .appGroup(), leases: self.leases)
        .claim(owner: owner, token: token, revision: revision, confirmed: confirmed,
               stopAndVerify: ProtectionDeviceTransition.stopAndVerify)
    }
    OnDestroy { self.leases.destroy() }
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
