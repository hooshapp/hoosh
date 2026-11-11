import CoreText
import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// Dashboard-only typography. The font is registered from the asset catalog so
/// the redesign does not change typography elsewhere in the existing app.
enum DashboardFont {
    private static let isRegistered: Bool = {
#if canImport(UIKit)
        guard let data = NSDataAsset(name: "InterVariable")?.data as CFData,
              let provider = CGDataProvider(data: data),
              let font = CGFont(provider) else {
            assertionFailure("InterVariable font asset could not be loaded.")
            return false
        }

        var registrationError: Unmanaged<CFError>?
        if CTFontManagerRegisterGraphicsFont(font, &registrationError) {
            return true
        }

        // A duplicate registration is harmless during SwiftUI previews. Check
        // that Core Text can resolve the requested face before using it.
        let loadedFont = CTFontCreateWithName("InterVariable" as CFString, 12, nil)
        return CTFontCopyPostScriptName(loadedFont) as String == "InterVariable"
#else
        // macOS command-line type checking has no iOS asset catalog to load.
        return true
#endif
    }()

    static func regular(_ size: CGFloat) -> Font {
        font(named: "InterVariable", size: size)
    }

    static func medium(_ size: CGFloat) -> Font {
        font(named: "InterVariable-Medium", size: size)
    }

    static func semibold(_ size: CGFloat) -> Font {
        font(named: "InterVariable-SemiBold", size: size)
    }

    private static func font(named name: String, size: CGFloat) -> Font {
        _ = isRegistered
        return .custom(name, fixedSize: size)
    }
}
