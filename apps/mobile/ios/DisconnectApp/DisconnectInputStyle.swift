import SwiftUI

/// Consistent readable fields on the app's white surfaces, including in Dark Mode.
struct DisconnectInputStyle: ViewModifier {
    func body(content:Content) -> some View {
        content
            .textFieldStyle(.plain)
            .foregroundStyle(Color.black)
            .tint(DisconnectTheme.green)
            .padding(.horizontal,10)
            .frame(minHeight:44)
            .background(RoundedRectangle(cornerRadius:8).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius:8).stroke(DisconnectTheme.border,lineWidth:1))
            .environment(\.colorScheme,.light)
    }
}
