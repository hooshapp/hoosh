import Foundation
import FamilyControls
import ManagedSettings
import ManagedSettingsUI
import UIKit

/// Presentation only: no monitor queries, session mutations, database SDKs or
/// network requests. The writer saves this small snapshot before applying shields.
final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration(token: application.token, appName: application.localizedDisplayName)
    }
    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration(token: application.token, appName: application.localizedDisplayName)
    }
    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        makeConfiguration(token: nil)
    }
    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration(token: nil)
    }
    private func makeConfiguration(token: ApplicationToken?, appName: String? = nil) -> ShieldConfiguration {
        ShieldPresentationStore.synchronize()
        let defaults = ShieldPresentationStore.defaults
        defaults.set(Date(), forKey: "shieldConfigurationEnteredAt")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let tokenData = token.flatMap { try? encoder.encode($0) }
        let isFirstDay = DayTwoSettingsTipStore.isFirstDay()
        let presentation = tokenData.flatMap { ShieldPresentationStore.load(tokenData: $0)?.forFirstDay(isFirstDay) }
        let historyKey = "disconnect.recentShieldPrompts.v1"
        let recent = defaults.stringArray(forKey:historyKey) ?? []
        let localContext = LocalProductivityNudgeStore.messages()
        let showsFirstDayGuidance = isFirstDay && presentation?.dailyLimitReached == true
        let message: String
        if showsFirstDayGuidance {
            message = ""
        } else {
            message = BalancedNudgeSelection.savedChoice(
                questionnaire: presentation?.messages ?? PersonalizedNudgeLibrary.general,
                context: localContext, recent: recent, channel: "shield").message
            defaults.set(Array((recent + [message]).suffix(32)), forKey: historyKey)
        }
        defaults.set(message, forKey: "lastDisplayedShieldPrompt")
        defaults.set(presentation != nil, forKey: "disconnect.shieldSnapshotFound")
        let explanation = presentation?.dailyLimitReached == false
            ? ShieldPresentation.sessionExplanation
            : presentation?.explanation ?? "Open Hoosh to review your session settings."
        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterialDark,
            backgroundColor: UIColor(red: 0.07, green: 0.08, blue: 0.10, alpha: 1),
            icon: UIImage(systemName: "brain.head.profile"),
            title: .init(text: presentation?.title ?? "Pause and choose", color: .white),
            subtitle: .init(text: showsFirstDayGuidance ? explanation : message + "\n\n" + explanation, color: UIColor(white: 0.78, alpha: 1)),
            primaryButtonLabel: .init(text: "Close App & Stay Focused", color: .black),
            primaryButtonBackgroundColor: UIColor(red: 0.13, green: 0.79, blue: 0.33, alpha: 1),
            secondaryButtonLabel: presentation?.actionLabel(appName: appName).map { .init(text: $0, color: UIColor(white: 0.82, alpha: 1)) }
        )
    }
}
