//
//  DatabaseService.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/21/26.
//

import Foundation
import FamilyControls
import FirebaseAnalytics
import FirebaseAuth
import FirebaseFirestore

class DatabaseService {
    static let shared = DatabaseService()

    private let db = Firestore.firestore()
    private let installIDKey = "anonymousInstallID"

    private var defaults: UserDefaults {
        UserDefaults(suiteName: OnboardingResponseStore.appGroupID) ?? .standard
    }

    var anonymousInstallID: String {
        if let existingID = defaults.string(forKey: installIDKey), !existingID.isEmpty {
            return existingID
        }

        let newID = UUID().uuidString
        defaults.set(newID, forKey: installIDKey)
        return newID
    }

    func saveUserPreferences(userId: String, email: String, goal: String, genre: String, tone: String) {
        let userData: [String: Any] = [
            "email": email,
            "goal": goal,
            "genre": genre,
            "tone": tone,
            "updatedAt": Timestamp(date: Date())
        ]

        db.collection("users").document(userId).setData(userData, merge: true) { error in
            if let error = error {
                print("Error saving user data: \(error.localizedDescription)")
            } else {
                print("User preferences saved successfully!")
            }
        }
    }

    func fetchUserPreferences(userId: String, completion: @escaping (User?) -> Void) {
        db.collection("users").document(userId).getDocument { (document, error) in
            if let document = document, document.exists {
                do {
                    let user = try document.data(as: User.self)
                    completion(user)
                } catch {
                    print("Error: \(error)")
                    completion(nil)
                }
            } else {
                completion(nil)
            }
        }
    }

    func logEvent(_ name: String, properties: [String: Any] = [:]) {
        let cleanName = analyticsName(name)
        let analyticsProperties = cleanAnalyticsProperties(properties)

        Analytics.setUserID(anonymousInstallID)
        Analytics.logEvent(cleanName, parameters: analyticsProperties)

        ensureAnonymousAuth {
            var firestoreData = self.cleanFirestoreProperties(properties)
            firestoreData["eventName"] = cleanName
            firestoreData["installID"] = self.anonymousInstallID
            firestoreData["firebaseUID"] = Auth.auth().currentUser?.uid ?? "unknown"
            firestoreData["createdAt"] = Timestamp(date: Date())
            firestoreData["appVersion"] = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
            firestoreData["buildNumber"] = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"

            self.db.collection("analytics_events").addDocument(data: firestoreData) { error in
                if let error {
                    print("Error logging analytics event: \(error.localizedDescription)")
                }
            }
        }
    }

    func syncUserProfile(responses: OnboardingResponses, selection: FamilyActivitySelection? = nil) {
        ensureAnonymousAuth {
            var data: [String: Any] = [
                "installID": self.anonymousInstallID,
                "firebaseUID": Auth.auth().currentUser?.uid ?? "unknown",
                "focusGoal": responses.focusGoal,
                "focusGoalIconName": responses.focusGoalIconName,
                "primaryGoal": responses.primaryGoal,
                "focusFeeling": responses.focusFeeling,
                "tinyTask": responses.tinyTask,
                "scrollTemptation": responses.scrollTemptation,
                "scrollCost": responses.scrollCost,
                "accountabilityAnchor": responses.accountabilityAnchor,
                "bypassMinutes": responses.bypassMinutes,
                "aiFrictionStyle": responses.aiFrictionStyle,
                "aiTone": responses.aiTone,
                "persuasionStyle": responses.persuasionStyle,
                "selectedQuestionCount": responses.selectedQuestions.count,
                "hasCustomQuestion": !responses.customQuestion.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                "updatedAt": Timestamp(date: Date())
            ]

            if let selection {
                data.merge(self.selectionSummary(selection)) { _, new in new }
            }

            self.db.collection("users").document(self.anonymousInstallID).setData(data, merge: true) { error in
                if let error {
                    print("Error syncing user profile: \(error.localizedDescription)")
                }
            }
        }
    }

    func logProtectedSelectionChanged(_ selection: FamilyActivitySelection) {
        var properties = selectionSummary(selection)
        properties["totalSelected"] = selectedItemCount(selection)
        logEvent("protected_selection_changed", properties: properties)
        syncUserProfile(responses: OnboardingResponseStore.load(), selection: selection)
    }

    func submitFeedback(
        rating: Int,
        message: String,
        context: String,
        responses: OnboardingResponses,
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        let data: [String: Any] = [
            "installID": anonymousInstallID,
            "rating": rating,
            "message": trimmedMessage,
            "context": context,
            "focusGoal": responses.focusGoal,
            "bypassMinutes": responses.bypassMinutes,
            "aiTone": responses.aiTone,
            "aiFrictionStyle": responses.aiFrictionStyle,
            "persuasionStyle": responses.persuasionStyle,
            "createdAt": Timestamp(date: Date())
        ]

        ensureAnonymousAuth {
            var feedbackData = data
            feedbackData["firebaseUID"] = Auth.auth().currentUser?.uid ?? "unknown"

            self.db.collection("feedback").addDocument(data: feedbackData) { error in
                if let error {
                    completion(.failure(error))
                } else {
                    self.logEvent("feedback_submitted", properties: ["rating": rating, "context": context])
                    completion(.success(()))
                }
            }
        }
    }

    func submitResearchOptIn(
        name: String,
        contact: String,
        userType: String,
        biggestDistraction: String,
        notes: String,
        responses: OnboardingResponses,
        selection: FamilyActivitySelection,
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        var data: [String: Any] = [
            "installID": anonymousInstallID,
            "name": name.trimmingCharacters(in: .whitespacesAndNewlines),
            "contact": contact.trimmingCharacters(in: .whitespacesAndNewlines),
            "userType": userType,
            "biggestDistraction": biggestDistraction.trimmingCharacters(in: .whitespacesAndNewlines),
            "notes": notes.trimmingCharacters(in: .whitespacesAndNewlines),
            "focusGoal": responses.focusGoal,
            "primaryGoal": responses.primaryGoal,
            "bypassMinutes": responses.bypassMinutes,
            "aiTone": responses.aiTone,
            "aiFrictionStyle": responses.aiFrictionStyle,
            "createdAt": Timestamp(date: Date())
        ]
        data.merge(selectionSummary(selection)) { _, new in new }

        ensureAnonymousAuth {
            data["firebaseUID"] = Auth.auth().currentUser?.uid ?? "unknown"

            self.db.collection("research_opt_ins").addDocument(data: data) { error in
                if let error {
                    completion(.failure(error))
                } else {
                    self.logEvent("research_opt_in_submitted", properties: ["userType": userType])
                    completion(.success(()))
                }
            }
        }
    }

    private func ensureAnonymousAuth(completion: @escaping () -> Void) {
        if Auth.auth().currentUser != nil {
            completion()
            return
        }

        Auth.auth().signInAnonymously { _, error in
            if let error {
                print("Anonymous Firebase sign-in failed: \(error.localizedDescription)")
            }
            completion()
        }
    }

    private func selectedItemCount(_ selection: FamilyActivitySelection) -> Int {
        selection.applicationTokens.count + selection.categoryTokens.count + selection.webDomainTokens.count
    }

    private func selectionSummary(_ selection: FamilyActivitySelection) -> [String: Any] {
        [
            "protectedAppCount": selection.applicationTokens.count,
            "protectedCategoryCount": selection.categoryTokens.count,
            "protectedWebDomainCount": selection.webDomainTokens.count
        ]
    }

    private func analyticsName(_ name: String) -> String {
        let allowed = name.map { character in
            character.isLetter || character.isNumber || character == "_" ? character : "_"
        }
        return String(allowed).prefix(40).isEmpty ? "event" : String(String(allowed).prefix(40))
    }

    private func cleanAnalyticsProperties(_ properties: [String: Any]) -> [String: Any] {
        var clean: [String: Any] = ["install_id": anonymousInstallID]

        for (key, value) in properties {
            let cleanKey = analyticsName(key)
            switch value {
            case let value as String:
                clean[cleanKey] = String(value.prefix(100))
            case let value as Int:
                clean[cleanKey] = value
            case let value as Double:
                clean[cleanKey] = value
            case let value as Float:
                clean[cleanKey] = value
            case let value as Bool:
                clean[cleanKey] = value
            default:
                clean[cleanKey] = String(describing: value).prefix(100).description
            }
        }

        return clean
    }

    private func cleanFirestoreProperties(_ properties: [String: Any]) -> [String: Any] {
        properties.mapValues { value in
            switch value {
            case let value as String:
                return value
            case let value as Int:
                return value
            case let value as Double:
                return value
            case let value as Float:
                return value
            case let value as Bool:
                return value
            case let value as [String]:
                return value
            default:
                return String(describing: value)
            }
        }
    }
}
