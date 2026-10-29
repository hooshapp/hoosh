import SwiftUI

struct OnboardingView: View {
    @State private var goal = ""
    @State private var genre = "Gym"
    @State private var tone = "Funny"
    @State private var showDashboard = false // This variable controls which screen you see
    
    let dbService = DatabaseService()
    
    var body: some View {
        if showDashboard {
            ContentView()
        } else {
            Form {
                Section(header: Text("Your Goal")) {
                    TextField("What are you trying to achieve?", text: $goal)
                }
                
                Section(header: Text("Genre & Tone")) {
                    Picker("Genre", selection: $genre) {
                        ForEach(["Gym", "Poetry", "Arts"], id: \.self) { Text($0) }
                    }
                    Picker("Tone", selection: $tone) {
                        ForEach(["Funny", "Serious", "Harsh"], id: \.self) { Text($0) }
                    }
                }
                
                Button("Get Started") {
                    let authService = AuthService()
                    
                    // Call the new 'signInOrUp' function
                    authService.signInOrUp(email: "user@example.com", password: "password123") { uid, error in
                        if let uid = uid {
                            dbService.saveUserPreferences(userId: uid, email: "user@example.com", goal: goal, genre: genre, tone: tone)
                            
                            DispatchQueue.main.async {
                                self.showDashboard = true
                            }
                        }
                    }
                }
            }
        }
    }
}
