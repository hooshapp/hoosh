//
//  DisconnectAppApp.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/21/26.
//

import SwiftUI
import FirebaseCore
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    FirebaseApp.configure()
    UNUserNotificationCenter.current().delegate = self
    BreakReminderScheduler.registerNotificationActions()
    ShieldStoreController().refreshShieldStateAfterInstallOrRun()

    return true
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
    if response.notification.request.content.categoryIdentifier == BreakReminderScheduler.reminderCategoryIdentifier,
       response.actionIdentifier == UNNotificationDefaultActionIdentifier || response.actionIdentifier == BreakReminderScheduler.doneScrollingActionIdentifier {
      ShieldStoreController().endBypassBecauseUserReturnedToDisconnect()
    }

    completionHandler()
  }
}

@main
struct DisconnectAppApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onChange(of: scenePhase) { phase in
                    guard phase == .active else { return }
                    ShieldStoreController().endBypassBecauseUserReturnedToDisconnect()
                    Task {
                        await AppleProductivityContextService().refreshContext()
                    }
                }
        }
    }
}
