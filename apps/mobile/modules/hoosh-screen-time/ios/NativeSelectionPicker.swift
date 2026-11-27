import FamilyControls
import SwiftUI
import UIKit

/// Apple's picker owns token/label rendering. No app inventory reaches JavaScript.
final class NativeSelectionPicker: NSObject, UIAdaptivePresentationControllerDelegate {
  private var finish: ((Result<FamilyActivitySelection, Error>) -> Void)?
  private var controller: UIViewController?
  private var lease: UUID?
  private var background: NSObjectProtocol?

  @MainActor func pick(_ initial: FamilyActivitySelection, lease: UUID, presenter: UIViewController) async throws -> FamilyActivitySelection {
    guard finish == nil, presenter.viewIfLoaded?.window != nil,
          !presenter.isBeingDismissed, !presenter.isBeingPresented, presenter.presentedViewController == nil,
          UIApplication.shared.applicationState == .active else { throw SelectionFailure.unavailable }
    return try await withCheckedThrowingContinuation { continuation in
      self.lease = lease
      finish = { continuation.resume(with: $0) }
      let content = SelectionPickerContent(selection: initial,
        cancel: { self.complete(.failure(SelectionFailure.cancelled)) },
        done: { self.complete(.success($0)) })
      let host = UIHostingController(rootView: content)
      controller = host
      host.modalPresentationStyle = .pageSheet
      host.presentationController?.delegate = self
      background = NotificationCenter.default.addObserver(forName: UIApplication.didEnterBackgroundNotification,
        object: nil, queue: .main) { [weak self] _ in
          MainActor.assumeIsolated { self?.complete(.failure(SelectionFailure.cancelled)) }
        }
      presenter.present(host, animated: true)
      // UIKit can decline a presentation without throwing or calling its completion.
      // Give the transition time to settle, then release JS if no sheet is visible.
      DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self, weak host] in
        guard let self, let host, self.controller === host,
              host.viewIfLoaded?.window == nil else { return }
        self.complete(.failure(SelectionFailure.unavailable))
      }
    }
  }
  @MainActor func cancel(lease: UUID? = nil) {
    if lease == nil || self.lease == lease { complete(.failure(SelectionFailure.cancelled)) }
  }
  @MainActor func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    complete(.failure(SelectionFailure.cancelled))
  }
  @MainActor private func complete(_ result: Result<FamilyActivitySelection, Error>) {
    guard let callback = finish else { return }
    finish = nil
    lease = nil
    if let background { NotificationCenter.default.removeObserver(background) }
    background = nil
    let host = controller
    controller = nil
    if host?.presentingViewController != nil {
      host?.dismiss(animated: true) { callback(result) }
    } else { callback(result) }
  }
}
private struct SelectionPickerContent: View {
  @State var selection: FamilyActivitySelection
  @State private var unsupported = false
  let cancel: () -> Void
  let done: (FamilyActivitySelection) -> Void
  var body: some View {
    NavigationStack {
      VStack {
        Text("Choose individual apps only. Categories and websites cannot be saved.")
          .font(.footnote).foregroundStyle(.secondary).padding()
        FamilyActivityPicker(selection: $selection)
      }
      .navigationTitle("Choose apps")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) { Button("Cancel", action: cancel) }
        ToolbarItem(placement: .confirmationAction) {
          Button("Done") {
            if selection.categoryTokens.isEmpty && selection.webDomainTokens.isEmpty && selection.applicationTokens.count <= 512 {
              done(selection)
            } else { unsupported = true }
          }
        }
      }
      .alert("Choose individual apps", isPresented: $unsupported) {
        Button("Review choices", role: .cancel) {}
      } message: { Text("Deselect categories and websites. Choose up to 512 individual apps.") }
    }
  }
}
