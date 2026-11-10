import Foundation

struct NativeResearchEvent: Codable {
    var id = UUID()
    var user_id: UUID
    var event_name: String
    var occurred_at: String = ISO8601DateFormatter().string(from: Date())
    var properties: [String:String]
}
/// Separate atomic files avoid read-modify-write collisions between host and extensions.
/// Files contain no Apple tokens, email addresses, calendar titles or credentials.
enum NativeResearchQueue {
    static let userKey = ShieldPresentationStore.participantKey
    static func setUser(_ id: UUID?) {
        ShieldPresentationStore.defaults.set(id?.uuidString, forKey: userKey)
    }
    static func directory() -> URL? {
        #if os(iOS)
        guard let group = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: ShieldPresentationStore.group) else { return nil }
        let url = group.appendingPathComponent("ResearchOutbox", isDirectory:true)
        try? FileManager.default.createDirectory(at:url, withIntermediateDirectories:true, attributes:[.protectionKey:FileProtectionType.completeUntilFirstUserAuthentication])
        return url
        #else
        return nil
        #endif
    }
    static func enqueue(_ name: String, properties: [String:String] = [:]) {
        guard let raw = ShieldPresentationStore.defaults.string(forKey:userKey), let user = UUID(uuidString:raw),
              let directory = directory() else { return }
        let count = (try? FileManager.default.contentsOfDirectory(atPath:directory.path).count) ?? 0
        guard count < 1000 else {
            ShieldPresentationStore.defaults.set(true,forKey:"disconnect.researchQueueFull")
            return
        }
        let allowed = name.lowercased().map { $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "_") ? $0 : "_" }
        var cleanName = String(allowed.prefix(64))
        if cleanName.first?.isLetter != true { cleanName = String(("event_" + cleanName).prefix(64)) }
        var metadata=properties
        metadata["recorded_day"]=ShieldPresentationStore.day()
        metadata["timezone"]=TimeZone.current.identifier
        let event = NativeResearchEvent(user_id:user,event_name:cleanName,properties:metadata)
        guard let data = try? JSONEncoder().encode(event) else { return }
        try? data.write(to:directory.appendingPathComponent(event.id.uuidString+".json"),options:.atomic)
    }
    static func pending(for user: UUID) -> [(URL, NativeResearchEvent)] {
        guard let directory = directory(), let files = try? FileManager.default.contentsOfDirectory(at:directory, includingPropertiesForKeys:nil) else { return [] }
        return files.compactMap { url in
            guard let data = try? Data(contentsOf:url), let event = try? JSONDecoder().decode(NativeResearchEvent.self,from:data), event.user_id == user else { return nil }
            return (url,event)
        }
    }
}
