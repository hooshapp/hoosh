//
//  CheckpointStore.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/24/26.
//

import Foundation

struct CheckpointStore {
    private static let key = "userCheckpoint"
    
    static func save(_ checkpoint: IdentityCheckpoint) {
        if let encoded = try? JSONEncoder().encode(checkpoint) {
            UserDefaults.standard.set(encoded, forKey: key)
        }
    }
    
    static func load() -> IdentityCheckpoint? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(IdentityCheckpoint.self, from: data)
    }
    
    static func clear() {
        UserDefaults.standard.removeObject(forKey: key)
    }
}
