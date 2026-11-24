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
  @State private var days = 7
  @State private var hours = ""
  @State private var minutes = ""
  private var end: Date { Calendar.current.startOfDay(for: Date()) }
  private var interval: DateInterval { DateInterval(start: Calendar.current.date(byAdding: .day, value: -days, to: end)!, end: end) }
  private var total: Int? {
    guard !hours.isEmpty || !minutes.isEmpty,
      hours.isEmpty || hours.allSatisfy({ $0.isASCII && $0.isNumber }),
      minutes.isEmpty || minutes.allSatisfy({ $0.isASCII && $0.isNumber }),
      let h = Int(hours.isEmpty ? "0" : hours), let m = Int(minutes.isEmpty ? "0" : minutes),
      h <= days * 26, (0...59).contains(m), h * 60 + m <= days * 26 * 60 else { return nil }
    return h * 60 + m
  }
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 18) {
          Text("Review your selected apps’ usage").font(.title2.bold())
          Text("Prefer seven complete days. If that report is unavailable, choose Yesterday. Today is excluded.").font(.subheadline).foregroundStyle(.secondary)
          Picker("Usage period", selection: $days) { Text("Last 7 days").tag(7); Text("Yesterday").tag(1) }.pickerStyle(.segmented)
          DeviceActivityReport(.init("Total Activity"), filter: .init(segment: .daily(during: interval), users: .all,
            devices: .init([.iPhone]), applications: selection.applicationTokens))
            .frame(minHeight: 110).id(days)
          Text(days == 7 ? "Enter the TOTAL shown for all seven days. Hoosh will divide it by seven." : "Enter the total shown for yesterday.").font(.headline)
          HStack {
            TextField("Hours", text: $hours).keyboardType(.numberPad).textFieldStyle(.roundedBorder).accessibilityLabel("Usage total hours")
            TextField("Minutes", text: $minutes).keyboardType(.numberPad).textFieldStyle(.roundedBorder).accessibilityLabel("Usage total minutes")
          }
          Text("Only use a complete report for the apps you selected. If the report is blank or incomplete, cancel and use manual setup. This total is user-confirmed; Hoosh does not extract protected report data.").font(.footnote).foregroundStyle(.secondary)
          Button("Use this total") {
            guard let total else { return }
            let formatter = DateFormatter(); formatter.calendar = Calendar(identifier: .gregorian); formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.timeZone = .current; formatter.dateFormat = "yyyy-MM-dd"
            confirm(.init(totalMinutes: total, days: days, endsBefore: formatter.string(from: end), timezone: TimeZone.current.identifier))
          }.buttonStyle(.borderedProminent).disabled(total == nil)
        }.padding()
      }
      .navigationTitle("Usage for your plan").navigationBarTitleDisplayMode(.inline)
      .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel", action: cancel) } }
      .onChange(of: days) { _ in hours = ""; minutes = "" }
    }
  }
}
