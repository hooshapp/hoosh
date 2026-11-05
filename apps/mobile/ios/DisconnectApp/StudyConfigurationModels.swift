import Foundation

enum StudyConfigurationDay {
    static func string(at date: Date = Date(),calendar: Calendar = .current) -> String {
        let p=calendar.dateComponents([.year,.month,.day],from:date)
        return String(format:"%04d-%02d-%02d",p.year ?? 0,p.month ?? 0,p.day ?? 0)
    }
}

struct StudyConfigurationRecord: Codable {
    var id = UUID()
    var user_id: UUID
    var recorded_at = ISO8601DateFormatter().string(from:Date())
    var study_day = StudyConfigurationDay.string()
    var timezone = TimeZone.current.identifier
    var reason: String
    var snapshot: Data
    enum CodingKeys: String,CodingKey { case id,user_id,recorded_at,study_day,timezone,reason,snapshot }
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy:CodingKeys.self)
        try c.encode(id,forKey:.id); try c.encode(user_id,forKey:.user_id)
        try c.encode(recorded_at,forKey:.recorded_at); try c.encode(study_day,forKey:.study_day)
        try c.encode(timezone,forKey:.timezone); try c.encode(reason,forKey:.reason)
        let object = try JSONDecoder().decode(StudyConfigurationSnapshot.self,from:snapshot)
        try c.encode(object,forKey:.snapshot)
    }
    init(user_id: UUID,reason: String,snapshot: Data) { self.user_id=user_id;self.reason=reason;self.snapshot=snapshot }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy:CodingKeys.self)
        id=try c.decode(UUID.self,forKey:.id); user_id=try c.decode(UUID.self,forKey:.user_id)
        recorded_at=try c.decode(String.self,forKey:.recorded_at); study_day=try c.decode(String.self,forKey:.study_day)
        timezone=try c.decode(String.self,forKey:.timezone); reason=try c.decode(String.self,forKey:.reason)
        snapshot=try JSONEncoder().encode(c.decode(StudyConfigurationSnapshot.self,forKey:.snapshot))
    }
}
struct StudyPlanEntry: Codable {
    var localRuleID: String
    var appLabel: String?
    var dailyMinutes: Int
    var sessionMinutes: Int
}
struct StudyConfigurationSnapshot: Codable {
    var preferences: OnboardingResponses
    var plan: [StudyPlanEntry]
    var onboardingCompleted: Bool
}
