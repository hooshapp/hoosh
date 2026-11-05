import Foundation

/// Local account isolation. Archives never leave this device and include no Keychain credentials.
struct AccountWorkspace {
    static let ownerKey = "disconnect.workspace.owner"
    static let archivePrefix = "disconnect.workspace.archive."
    let defaults: UserDefaults
    let domain: String
    var owner: String? { defaults.string(forKey:Self.ownerKey) }
    private func belongsToWorkspace(_ key: String) -> Bool {
        key != Self.ownerKey && !key.hasPrefix(Self.archivePrefix) &&
        !key.hasPrefix("disconnect.auth.") && key != "disconnect.supabaseResearchUser" && key != "anonymousInstallID"
    }
    private var values: [String:Any] {
        (defaults.persistentDomain(forName:domain) ?? [:]).filter { belongsToWorkspace($0.key) }
    }
    func validate(_ userID: String) throws {
        if owner != nil, owner != userID, let data = defaults.data(forKey:Self.archivePrefix + userID) {
            guard (try PropertyListSerialization.propertyList(from:data,format:nil)) is [String:Any] else {
                throw CocoaError(.coderReadCorrupt)
            }
        }
    }
    func activate(_ userID: String) throws {
        try validate(userID)
        guard owner != userID else { return }
        if let oldOwner = owner {
            let archive = try PropertyListSerialization.data(fromPropertyList:values,format:.binary,options:0)
            defaults.set(archive,forKey:Self.archivePrefix + oldOwner)
            let restored: [String:Any]
            if let data = defaults.data(forKey:Self.archivePrefix + userID) {
                guard let decoded = try PropertyListSerialization.propertyList(from:data,format:nil) as? [String:Any] else {
                    throw CocoaError(.coderReadCorrupt)
                }
                restored = decoded.filter { belongsToWorkspace($0.key) }
            } else { restored = [:] }
            for key in values.keys { defaults.removeObject(forKey:key) }
            for (key,value) in restored { defaults.set(value,forKey:key) }
        }
        // Unowned legacy data is not proof this participant completed onboarding.
        // Keep their draft answers/plan, but require the questionnaire/setup flow.
        if owner == nil { defaults.removeObject(forKey:"onboardingCompleted") }
        defaults.set(userID,forKey:Self.ownerKey)
    }
    func completed(for userID: String) -> Bool {
        owner == userID && defaults.bool(forKey:"onboardingCompleted")
    }
}
