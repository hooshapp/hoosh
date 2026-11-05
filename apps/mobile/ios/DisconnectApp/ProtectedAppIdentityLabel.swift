import SwiftUI
import FamilyControls
import ManagedSettings

struct ProtectedAppIdentityLabel:View {
    let token:ApplicationToken
    var name:String?
    var body:some View {
        HStack(spacing:8) {
            Label(token).labelStyle(.iconOnly)
            if let name,!name.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty {
                Text(name).foregroundStyle(Color.black)
            } else { Label(token).labelStyle(.titleOnly).foregroundStyle(Color.black) }
        }.foregroundStyle(Color.black).environment(\.colorScheme,.light)
    }
}
