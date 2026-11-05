import XCTest

/// Reuses the dedicated audit simulator's enrolled QA profile.
final class DashboardHistoryUITests: XCTestCase {
    @MainActor func testSinglePageHistoryPeriodFilter() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["DISCONNECT_UI_TESTING"] = "1"
        app.launch()
        XCTAssertTrue(app.buttons["History"].waitForExistence(timeout: 30))
        app.buttons["History"].tap()
        XCTAssertTrue(app.staticTexts["Your stats"].waitForExistence(timeout: 10))
        app.buttons["This month"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label ENDSWITH %@", "this month.")).firstMatch.exists)
        app.buttons["This week"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label ENDSWITH %@", "this week.")).firstMatch.exists)
        XCTAssertFalse(app.buttons["history.next"].exists)
    }
}
