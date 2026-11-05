//
//  User.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/21/26.
//

import Foundation

struct User: Identifiable, Codable {
    var id: String? = nil
    var email: String
    var goal: String
    var genre: String
    var tone: String
}
