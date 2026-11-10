import Foundation

/// Only substitutes for Apple's unavailable Screen Time picker in simulator UI tests.
/// Production and physical-device builds always return false.
enum SimulatorUITestSupport {
    static var enabled:Bool {
        #if DEBUG && targetEnvironment(simulator)
        return ProcessInfo.processInfo.environment["DISCONNECT_UI_TESTING"] == "1"
        #else
        return false
        #endif
    }
    static func routePersonalization(for owner: String) {
        #if DEBUG && targetEnvironment(simulator)
        guard enabled, ProcessInfo.processInfo.environment["DISCONNECT_UI_TEST_OPEN_PERSONALIZATION"] == "1" else { return }
        ShieldPresentationStore.defaults.set(owner, forKey: DayTwoSettingsTipStore.pendingRoute)
        #endif
    }

    static func consumeEnrollmentFailure() -> Bool {
        #if DEBUG && targetEnvironment(simulator)
        let key="disconnect.uiTestEnrollmentFailureInjected"
        guard enabled,ProcessInfo.processInfo.environment["DISCONNECT_UI_TEST_FAIL_ENROLLMENT_ONCE"]=="1",
              !ShieldPresentationStore.defaults.bool(forKey:key) else { return false }
        ShieldPresentationStore.defaults.set(true,forKey:key)
        return true
        #else
        return false
        #endif
    }

}
