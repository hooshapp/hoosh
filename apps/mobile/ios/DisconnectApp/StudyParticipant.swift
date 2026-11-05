import Foundation

struct StudyParticipant: Codable, Equatable {
    let name: String
    let email: String
    init(name: String, email: String) throws {
        let name = name.trimmingCharacters(in:.whitespacesAndNewlines)
        let email = email.trimmingCharacters(in:.whitespacesAndNewlines)
        guard !name.isEmpty, name.count <= 100, !name.contains("\n"), !name.contains("\r") else {
            throw ValidationError.name
        }
        guard email.count <= 254,
              email.range(of:"^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$",options:.regularExpression) != nil else {
            throw ValidationError.email
        }
        self.name = name; self.email = email
    }
    enum ValidationError: LocalizedError {
        case name, email
        var errorDescription: String? {
            self == .name ? "Enter your name (up to 100 characters)." : "Enter an email address in the format name@example.com."
        }
    }
}
