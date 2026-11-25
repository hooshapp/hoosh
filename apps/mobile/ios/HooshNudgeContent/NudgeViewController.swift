import UIKit
import UserNotifications
import UserNotificationsUI

final class NudgeViewController: UIViewController, UNNotificationContentExtension {
  private let ink = UIColor(red: 0.239, green: 0.157, blue: 0, alpha: 1)
  private let headline = UILabel(), message = UILabel()
  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = UIColor(red: 1, green: 250.0 / 255, blue: 242.0 / 255, alpha: 1)
    view.layer.cornerRadius = 24
    view.layer.borderWidth = 1.5
    view.layer.borderColor = UIColor(red: 232.0 / 255, green: 213.0 / 255, blue: 176.0 / 255, alpha: 1).cgColor
    view.clipsToBounds = true
    let header = UIView(); header.backgroundColor = UIColor(red: 1, green: 0.847, blue: 0.631, alpha: 1)
    let dino = UIImageView(image: UIImage(named: "nudge-dino")); dino.contentMode = .scaleAspectFit
    let caption = label("NUDGE", size: 10, bold: true)
    let recommendation = label("Recommendation for you", size: 13, bold: true)
    let reward = label("+30 ✦", size: 10, bold: true)
    reward.textColor = header.backgroundColor; reward.backgroundColor = UIColor(white: 0.10, alpha: 1)
    reward.textAlignment = .center; reward.layer.cornerRadius = 12; reward.clipsToBounds = true
    let copy = UIStackView(arrangedSubviews: [caption, recommendation]); copy.axis = .vertical; copy.spacing = 2
    headline.numberOfLines = 0; headline.textColor = UIColor(white: 0.1, alpha: 1); headline.font = font(17, bold: true)
    message.numberOfLines = 0; message.textColor = UIColor(white: 0.4, alpha: 1); message.font = font(14)
    let notice = label("Accept to pause this session.", size: 10)
    notice.backgroundColor = UIColor(red: 1, green: 0.941, blue: 0.816, alpha: 1)
    notice.layer.cornerRadius = 12; notice.clipsToBounds = true; notice.textAlignment = .center
    let body = UIStackView(arrangedSubviews: [headline, message, notice]); body.axis = .vertical; body.spacing = 10
    for item in [header, body] { item.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(item) }
    for item in [dino, copy, reward] { item.translatesAutoresizingMaskIntoConstraints = false; header.addSubview(item) }
    NSLayoutConstraint.activate([
      header.topAnchor.constraint(equalTo: view.topAnchor), header.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      header.trailingAnchor.constraint(equalTo: view.trailingAnchor), header.heightAnchor.constraint(equalToConstant: 160),
      dino.leadingAnchor.constraint(equalTo: header.leadingAnchor, constant: 16), dino.centerYAnchor.constraint(equalTo: header.centerYAnchor),
      dino.widthAnchor.constraint(equalToConstant: 151), dino.heightAnchor.constraint(equalToConstant: 136),
      copy.leadingAnchor.constraint(equalTo: dino.trailingAnchor, constant: 10), copy.trailingAnchor.constraint(equalTo: header.trailingAnchor, constant: -16),
      copy.centerYAnchor.constraint(equalTo: header.centerYAnchor),
      reward.topAnchor.constraint(equalTo: header.topAnchor, constant: 12), reward.trailingAnchor.constraint(equalTo: header.trailingAnchor, constant: -16),
      reward.widthAnchor.constraint(equalToConstant: 51), reward.heightAnchor.constraint(equalToConstant: 24),
      body.topAnchor.constraint(equalTo: header.bottomAnchor, constant: 14), body.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
      body.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16), body.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -16),
      notice.heightAnchor.constraint(greaterThanOrEqualToConstant: 30)
    ])
    preferredContentSize = CGSize(width: 361, height: 305)
  }
  func didReceive(_ notification: UNNotification) {
    let content = notification.request.content
    if let remaining = content.userInfo["remainingSeconds"] as? Int, remaining > 0 {
      let minutes = Int(ceil(Double(remaining) / 60))
      headline.text = "\(minutes) \(minutes == 1 ? "minute" : "minutes") before your timer ends…"
    } else {
      headline.text = "Ready for a break?"
    }
    let recommendation = content.userInfo["recommendation"] as? String ?? "Make room for what matters to you."
    message.text = "\(recommendation) Accept this break to earn 30 credits."
    view.setNeedsLayout(); view.layoutIfNeeded()
    preferredContentSize = CGSize(width: view.bounds.width, height: max(285, view.systemLayoutSizeFitting(CGSize(width: view.bounds.width, height: 0), withHorizontalFittingPriority: .required, verticalFittingPriority: .fittingSizeLevel).height))
  }
  private func font(_ size: CGFloat, bold: Bool = false) -> UIFont {
    UIFont(name: bold ? "SpaceGrotesk-Bold" : "SpaceGrotesk-Regular", size: size) ?? .systemFont(ofSize: size, weight: bold ? .bold : .regular)
  }
  private func label(_ text: String, size: CGFloat, bold: Bool = false) -> UILabel {
    let value = UILabel(); value.text = text; value.textColor = ink; value.font = font(size, bold: bold); value.numberOfLines = 0; return value
  }
}
