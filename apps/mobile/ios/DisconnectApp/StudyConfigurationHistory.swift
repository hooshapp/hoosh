import Foundation
import CryptoKit

/// Immutable local snapshots survive offline edits. Files contain study answers,
/// never authentication credentials or opaque Apple selection tokens.
enum StudyConfigurationHistory {
    private static let lock = NSLock()
    private static var pendingCapture: DispatchWorkItem?
    static func scheduleCapture(reason: String) {
        lock.lock();defer { lock.unlock() }
        pendingCapture?.cancel()
        let work=DispatchWorkItem { capture(reason:reason) }
        pendingCapture=work
        DispatchQueue.main.asyncAfter(deadline:.now()+1,execute:work)
    }
    static func directory() -> URL? {
        guard let root = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier:ShieldPresentationStore.group) else { return nil }
        let url=root.appendingPathComponent("StudyConfigurationOutbox",isDirectory:true)
        try? FileManager.default.createDirectory(at:url,withIntermediateDirectories:true,attributes:[.protectionKey:FileProtectionType.completeUntilFirstUserAuthentication])
        return url
    }
    static func capture(reason: String) {
        lock.lock(); defer { lock.unlock() }
        let d=ShieldPresentationStore.defaults
        guard let raw=d.string(forKey:NativeResearchQueue.userKey), let owner=UUID(uuidString:raw),
              d.string(forKey:AccountWorkspace.ownerKey)==owner.uuidString,let directory=directory() else { return }
        do {
            let plan=try PerAppProtection.rules(for:PerAppProtection.selection()).map {
                StudyPlanEntry(localRuleID:$0.id,appLabel:$0.researchLabel,dailyMinutes:$0.minutes,sessionMinutes:$0.sessionMinutes)
            }
            let snapshot=StudyConfigurationSnapshot(preferences:OnboardingResponseStore.load(),plan:plan,onboardingCompleted:OnboardingResponseStore.hasCompletedOnboarding)
            let encoder=JSONEncoder();encoder.outputFormatting=[.sortedKeys]
            let data=try encoder.encode(snapshot)
            guard data.count <= 65536 else { return }
            let hash=SHA256.hash(data:data).map { String(format:"%02x",$0) }.joined()
            if d.string(forKey:"disconnect.configuration.lastHash")==hash { return }
            let record=StudyConfigurationRecord(user_id:owner,reason:reason,snapshot:data)
            try encoder.encode(record).write(to:directory.appendingPathComponent(record.id.uuidString+".json"),options:.atomic)
            d.set(hash,forKey:"disconnect.configuration.lastHash")
            Task { try? await DatabaseService.shared.flushConfigurationOnly() }
        } catch { d.set("A settings-history snapshot could not be saved. Please retry sync.",forKey:DatabaseService.statusKey) }
    }
    static func pending(for owner: UUID) -> [(URL,StudyConfigurationRecord)] {
        guard let directory=directory(),let files=try? FileManager.default.contentsOfDirectory(at:directory,includingPropertiesForKeys:nil) else { return [] }
        return files.compactMap { url in
            guard let data=try? Data(contentsOf:url),let record=try? JSONDecoder().decode(StudyConfigurationRecord.self,from:data),record.user_id==owner else { return nil }
            return (url,record)
        }
    }
}
