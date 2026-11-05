import SwiftUI

struct StudyEnrollmentCard: View {
    @State private var name = ""
    @State private var email = ""
    @State private var busy = false
    @State private var message = ""
    var body: some View {
        VStack(alignment:.leading,spacing:16) {
            Label("Join the study",systemImage:"person.crop.circle")
                .font(.system(size:17,weight:.heavy)).foregroundStyle(DisconnectTheme.ink)
            Text("Enter your name and email, then set up your app sessions. No password or email confirmation is needed.")
                .font(.subheadline).foregroundStyle(DisconnectTheme.mutedInk)
            TextField("Your name",text:$name).textContentType(.name).modifier(DisconnectInputStyle()).disabled(busy)
            TextField("Email",text:$email).textContentType(.emailAddress).keyboardType(.emailAddress)
                .textInputAutocapitalization(.never).autocorrectionDisabled().modifier(DisconnectInputStyle()).disabled(busy)
            Text("The study records your selected-app usage minutes, session times, and intervention choices. Your name and email label your private study record.")
                .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            Button(busy ? "Starting…" : "Start study") {
                busy = true; message = ""
                Task {
                    defer { busy = false }
                    do { try await NativeSupabase.shared.enroll(StudyParticipant(name:name,email:email)) }
                    catch {
                        message = error.localizedDescription
                        ShieldPresentationStore.defaults.set(message,forKey:"disconnect.auth.lastError")
                    }
                }
            }
            .buttonStyle(PrimaryButtonStyle()).disabled(busy || name.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty || email.isEmpty)
            if !message.isEmpty { Text(message).font(.caption).foregroundStyle(.red).fixedSize(horizontal:false,vertical:true) }
            Text("This phone remembers your participant profile. Contact the researcher before moving to another phone or clearing app data.")
                .font(.caption).foregroundStyle(DisconnectTheme.mutedInk)
            NavigationLink("Use an existing password account") { SupabaseAccountCard(isEntry:true).padding(24) }.font(.caption)
        }
        .padding(20).background(RoundedRectangle(cornerRadius:14).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius:14).stroke(DisconnectTheme.border,lineWidth:1))
        .task {
            if email.isEmpty, let account=await NativeSupabase.shared.identity(),let savedEmail=account.1 { email=savedEmail }
        }
    }
}
