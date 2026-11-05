import XCTest

/// Uses live study enrollment/database. Only the unavailable Apple picker is substituted.
/// Run on a fresh, dedicated simulator; fixtures use QA names and example.invalid contacts.
final class DisconnectAppUITests: XCTestCase {
    @MainActor
    func testNewParticipantOnboardingSettingsAndFeedback() throws {
        continueAfterFailure=false
        let app=XCUIApplication()
        app.launchEnvironment["DISCONNECT_UI_TESTING"]="1"
        app.launchEnvironment["DISCONNECT_UI_TEST_FAIL_ENROLLMENT_ONCE"]="1"
        app.launch()
        addUIInterruptionMonitor(withDescription:"Optional notification permission") { alert in
            if alert.buttons["Allow"].exists { alert.buttons["Allow"].tap();return true }
            return false
        }
        func screenshot(_ name:String) {
            let attachment=XCTAttachment(screenshot:app.screenshot());attachment.name=name;attachment.lifetime = .keepAlways;add(attachment)
        }
        func tap(_ label:String) {
            let button=app.buttons.matching(NSPredicate(format:"identifier == %@ OR label BEGINSWITH %@",label,label)).firstMatch
            for _ in 0..<20 {
                if button.exists && button.isHittable { break }
                app.swipeUp()
            }
            XCTAssertTrue(button.exists && button.isHittable,"Button is not reachable: "+label)
            button.tap()
        }
        func replace(_ field:XCUIElement,_ value:String) {
            field.tap()
            let existing=field.value as? String ?? ""
            if !existing.isEmpty && existing != field.placeholderValue { field.typeText(String(repeating:XCUIKeyboardKey.delete.rawValue,count:existing.count)) }
            field.typeText(value)
            if app.buttons["keyboard.done"].waitForExistence(timeout:2) { app.buttons["keyboard.done"].tap() }
        }
        XCTAssertTrue(app.textFields["Your name"].waitForExistence(timeout:20))
        XCTAssertFalse(app.buttons["Start study"].isEnabled)
        screenshot("01-new-participant-light-fields")
        replace(app.textFields["Your name"],"QA Enrollment Smoke Test UI "+UUID().uuidString.prefix(8))
        replace(app.textFields["Email"],"invalid-email")
        app.buttons["Start study"].tap()
        XCTAssertTrue(app.staticTexts["Enter an email address in the format name@example.com."].waitForExistence(timeout:5))
        replace(app.textFields["Email"],"qa-ui-"+UUID().uuidString.prefix(8)+"@example.invalid")
        app.buttons["Start study"].tap()
        XCTAssertTrue(app.buttons["Retry account setup"].waitForExistence(timeout:30),"A failed registration write must block first-time entry")
        XCTAssertFalse(app.buttons["Get Started"].exists)
        XCTAssertFalse(app.buttons["Settings"].exists)
        screenshot("01b-registration-failure-keeps-account-for-retry")
        tap("Retry account setup")
        XCTAssertTrue(app.buttons["Get Started"].waitForExistence(timeout:30),"Verified enrollment must show onboarding, not Dashboard")
        screenshot("02-enrollment-opens-onboarding")
        tap("Get Started")
        XCTAssertTrue(app.staticTexts["APP SELECTION"].waitForExistence(timeout:10))
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@","SIMULATOR UI TEST")).firstMatch.exists)
        tap("Continue") // Only this Apple-only step is substituted.
        tap("Choose your questions")
        tap("goal.gym");tap("goal.read")
        tap("Get Started")
        XCTAssertTrue(app.staticTexts["Select your triggers"].waitForExistence(timeout:10))
        tap("trigger.three")
        screenshot("03-questionnaire")
        tap("Next Step")
        let goal=app.textViews["e.g., Finishing my online certification course..."]
        XCTAssertTrue(goal.waitForExistence(timeout:10))
        replace(goal,"QA: Read two pages of my book")
        screenshot("04-written-answer")
        app.terminate();app.launch()
        XCTAssertTrue(app.buttons["Get Started"].waitForExistence(timeout:20),"Incomplete setup must not open Dashboard")
        tap("Get Started");tap("Continue");tap("Choose your questions")
        XCTAssertTrue(app.buttons["goal.read"].isSelected)
        XCTAssertFalse(app.buttons["goal.gym"].isSelected)
        tap("Get Started")
        XCTAssertTrue(app.buttons["trigger.three"].isSelected)
        tap("Next Step")
        XCTAssertTrue(goal.waitForExistence(timeout:10))
        XCTAssertEqual(goal.value as? String,"QA: Read two pages of my book","Written answer must survive interrupted onboarding")
        tap("Continue")
        XCTAssertTrue(app.staticTexts["CONNECT PLAN"].waitForExistence(timeout:10))
        screenshot("05-optional-connections")
        tap("Skip for now")
        // Completion returns through the auth-first root gate.
        XCTAssertTrue(app.buttons["Settings"].waitForExistence(timeout:20))
        app.tap() // Lets the interruption monitor handle any optional system alert.
        tap("Settings")
        XCTAssertTrue(app.staticTexts["Protection"].waitForExistence(timeout:10))
        XCTAssertFalse(app.staticTexts["Your account & data"].exists)
        XCTAssertFalse(app.staticTexts.containing(NSPredicate(format:"label BEGINSWITH %@","Dashboard stats now use")).firstMatch.exists)
        screenshot("06-condensed-settings")
        tap("AI tone")
        tap("preference.AI tone.Direct")
        XCTAssertTrue(app.buttons["preference.AI tone.Direct"].isSelected)
        screenshot("07-expanded-tone")
        app.terminate();app.launch()
        XCTAssertTrue(app.buttons["Settings"].waitForExistence(timeout:20),"Completed returning participant must resume Dashboard")
        XCTAssertFalse(app.textFields["Your name"].exists)
        tap("Feedback")
        let feedback=app.textViews["What felt helpful, annoying, too soft, or worth improving?"]
        XCTAssertTrue(feedback.waitForExistence(timeout:10))
        replace(feedback,"QA UI audit: the feedback form is reachable after setup.")
        screenshot("08-feedback-draft")
        tap("Send Feedback")
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS[c] %@","thank")).firstMatch.waitForExistence(timeout:20))
        screenshot("08-feedback-saved")
        let consent=app.switches["I am open to a quick follow-up interview"]
        for _ in 0..<10 { if consent.exists && consent.isHittable { break };app.swipeUp() }
        XCTAssertTrue(consent.exists && consent.isHittable)
        consent.tap()
        replace(app.textFields["Your name"],"QA Interview Participant")
        replace(app.textFields["Email or phone"],"qa-interview@example.invalid")
        tap("Join Interview List")
        let savedConsent=XCTNSPredicateExpectation(predicate:NSPredicate(format:"value == %@","0"),object:consent)
        XCTAssertEqual(XCTWaiter.wait(for:[savedConsent],timeout:20),.completed,"Successful interview submission must reset consent")
        XCTAssertTrue(app.staticTexts["Saved. Thank you for helping shape Disconnect."].waitForExistence(timeout:20))
        screenshot("09-interview-saved")
    }
}
