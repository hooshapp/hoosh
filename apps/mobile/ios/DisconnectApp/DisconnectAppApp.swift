//
//  DisconnectAppApp.swift
//  DisconnectApp
//
//  Created by Anisha Dasgupta on 5/21/26.
//

import SwiftUI
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    UNUserNotificationCenter.current().delegate = self
    BreakReminderScheduler.registerNotificationActions()

    return true
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
    if [PerAppProtection.nudgeCategory,DayTwoSettingsTipStore.category].contains(response.notification.request.content.categoryIdentifier),
       response.actionIdentifier == PerAppProtection.endSessionAction,
       let id = response.notification.request.content.userInfo["ruleID"] as? String,
       let activity = response.notification.request.content.userInfo["sessionActivity"] as? String,
       PerAppProtection.allowance(for: id)?.activity == activity {
      do {
        try PerAppProtection.endAllowance(for: id)
        NativeResearchQueue.enqueue("nudge_end_session",properties:["local_rule_id":id,"session_id":activity])
      }
      catch { PerAppProtection.defaults.set("Could not end the session. Please retry in Hoosh.", forKey: PerAppProtection.errorKey) }
    }
    if response.notification.request.content.categoryIdentifier == BreakReminderScheduler.reminderCategoryIdentifier,
       response.actionIdentifier == UNNotificationDefaultActionIdentifier || response.actionIdentifier == BreakReminderScheduler.doneScrollingActionIdentifier {
      ShieldStoreController().endBypassBecauseUserReturnedToDisconnect()
    }

    if response.notification.request.content.categoryIdentifier == DayTwoSettingsTipStore.category,
       [UNNotificationDefaultActionIdentifier,DayTwoSettingsTipStore.openAction].contains(response.actionIdentifier),
       let owner = response.notification.request.content.userInfo["participantID"] as? String {
      ShieldPresentationStore.defaults.set(owner, forKey: DayTwoSettingsTipStore.pendingRoute)
      DispatchQueue.main.async { NotificationCenter.default.post(name:DayTwoSettingsTipStore.routeNotification,object:nil) }
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
        }
    }
}
