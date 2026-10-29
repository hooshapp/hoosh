//
//  User.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/21/26.
//

import Foundation
import FirebaseFirestore

struct User: Identifiable, Codable {
    @DocumentID var id: String?
    var email: String
    var goal: String
    var genre: String
    var tone: String
}
