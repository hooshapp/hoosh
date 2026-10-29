//
//  IdentityCheckpoint.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/24/26.
//

import Foundation

struct IdentityCheckpoint: Codable {
    let question: String
    let fullAnswer: String
    let keywords: [String]
    let categoryHint: String
    let firstLetterHint: String
    let partialHint: String
}
