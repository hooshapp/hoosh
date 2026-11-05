//
//  CheckpointStore.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/24/26.
//

import Foundation

struct CheckpointStore {
    private static let key = "userCheckpoint"
    private static var defaults: UserDefaults { ShieldPresentationStore.defaults }
    
    static func save(_ checkpoint: IdentityCheckpoint) {
        if let encoded = try? JSONEncoder().encode(checkpoint) {
            defaults.set(encoded, forKey:key)
        }
    }
    
    static func load() -> IdentityCheckpoint? {
        let legacy = defaults.string(forKey:AccountWorkspace.ownerKey) == nil ? UserDefaults.standard.data(forKey:key) : nil
        guard let data = defaults.data(forKey:key) ?? legacy else { return nil }
        return try? JSONDecoder().decode(IdentityCheckpoint.self, from: data)
    }
    
    static func clear() {
        defaults.removeObject(forKey:key)
        UserDefaults.standard.removeObject(forKey:key)
    }
}
