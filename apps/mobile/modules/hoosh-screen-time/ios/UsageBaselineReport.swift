import UIKit
import SwiftUI
import FamilyControls
import DeviceActivity

struct UsageBaselineConfirmation {
  let totalMinutes: Int
  let days: Int
  let endsBefore: String
  let timezone: String
}

/// Report contents stay in Apple's extension. Only the user's explicit text entry returns to the host.
final class UsageBaselinePresenter: NSObject, UIAdaptivePresentationControllerDelegate {
  private var controller: UIViewController?
  private var finish: ((Result<UsageBaselineConfirmation, Error>) -> Void)?
  private var background: NSObjectProtocol?
  @MainActor func present(selection: FamilyActivitySelection, check: @escaping () -> Bool) async throws -> UsageBaselineConfirmation {
    guard finish == nil, UIApplication.shared.applicationState == .active,
      let presenter = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).flatMap(\.windows).first(where: \.isKeyWindow)?.rootViewController else { throw SelectionFailure.unavailable }
    var top = presenter
    while let shown = top.presentedViewController { top = shown }
    guard !top.isBeingDismissed, check() else { throw SelectionFailure.unavailable }
    return try await withCheckedThrowingContinuation { continuation in
      finish = { continuation.resume(with: $0) }
      let host = UIHostingController(rootView: UsageBaselineContent(selection: selection,
        cancel: { [weak self] in self?.complete(.failure(SelectionFailure.cancelled)) },
        confirm: { [weak self] result in
          guard check() else { self?.complete(.failure(SelectionFailure.unavailable)); return }
          self?.complete(.success(result))
        }))
      controller = host
      host.presentationController?.delegate = self
      background = NotificationCenter.default.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in
        Task { @MainActor in self?.cancel() }
      }
      top.present(host, animated: true)
      host.presentationController?.delegate = self
    }
  }
  @MainActor func cancel() { complete(.failure(SelectionFailure.cancelled)) }
  @MainActor func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { cancel() }
  @MainActor private func complete(_ result: Result<UsageBaselineConfirmation, Error>) {
    guard let callback = finish else { return }
    finish = nil
    if let background { NotificationCenter.default.removeObserver(background) }
    background = nil
    let host = controller; controller = nil
    if host?.presentingViewController != nil { host?.dismiss(animated: true) { callback(result) } }
    else { callback(result) }
  }
}

private struct UsageBaselineContent: View {
  let selection: FamilyActivitySelection
  let cancel: () -> Void
  let confirm: (UsageBaselineConfirmation) -> Void
  private var end: Date { Calendar.current.startOfDay(for: Date()) }
  private var interval: DateInterval {
    DateInterval(start: Calendar.current.date(byAdding: .day, value: -1, to: end)!, end: end)
  }
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 20) {
          Text("Yesterday").font(.custom("SpaceGrotesk-Bold", size: 28))
          DeviceActivityReport(.init("Total Activity"), filter: .init(segment: .daily(during: interval), users: .all,
            devices: .init([.iPhone]), applications: selection.applicationTokens))
            .frame(minHeight: 180)
          Text("Measured usage for your selected apps. No sample values are used.")
            .font(.custom("SpaceGrotesk-Regular", size: 14))
        }.padding(24)
      }
      .background(Color(red: 1, green: 0.945, blue: 0.867))
      .navigationTitle("Your usage").navigationBarTitleDisplayMode(.inline)
      .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done", action: cancel) } }
    }.preferredColorScheme(.light)
  }
}
