import Foundation
@main struct NudgeLibraryChecks {
    static func main() throws {
        for topic in PersonalizedNudgeLibrary.topics {
            for message in topic.messages {
                precondition(message.count <= 110)
                precondition(message.last.map { ".?!".contains($0) } == true)
                precondition(!message.contains("{app}") && !message.contains("Action:"))
            }
        }
        let reading = PersonalizedNudgeLibrary.messages(answers: ["primaryGoal":"Read books", "tinyTask":"read a page"])
        precondition(reading.count >= 4 && reading.contains { $0.contains("page") })
        let noisy = PersonalizedNudgeLibrary.messages(answers: ["primaryGoal":"Read books "+String(repeating:"bad grammar and cutoff wor",count:100)])
        precondition(noisy == reading, "Raw answers must never enter displayed sentences")
        precondition(PersonalizedNudgeLibrary.messages(answers: ["tinyTask":"bread dough"]) == PersonalizedNudgeLibrary.general, "Match whole words rather than read within bread")
        for _ in 1...25 { precondition(PersonalizedNudgeLibrary.choose(reading, avoiding: reading[0]) != reading[0]) }
        let combined = PersonalizedNudgeLibrary.messages(answers: ["goal":"Reading and exercise"])
        precondition(combined.count >= 8)
        var recent:[String] = []
        for _ in 0..<reading.count {
            let next=PersonalizedNudgeLibrary.choose(reading,recent:recent)
            precondition(!recent.contains(next), "Exhaust the message pool before repeating")
            recent.append(next)
        }
        precondition(PersonalizedNudgeLibrary.choose(reading,recent:recent)==recent[0])
        precondition(PersonalizedNudgeLibrary.remainingTime(1)=="1 minute left.")
        precondition(PersonalizedNudgeLibrary.remainingTime(2)=="2 minutes left.")
        precondition(PersonalizedNudgeLibrary.choose(["cutoff",String(repeating:"x",count:120)],recent:[])==PersonalizedNudgeLibrary.general[0])
        let direct=PersonalizedNudgeLibrary.messages(answers:["primaryGoal":"Read books","aiTone":"Direct"])
        let supportive=PersonalizedNudgeLibrary.messages(answers:["primaryGoal":"Read books","aiTone":"Supportive"])
        precondition(direct != supportive && direct.contains("Pause the feed. Choose your next step."))
        let reflective=PersonalizedNudgeLibrary.messages(answers:["aiFrictionStyle":"Reflective","persuasionStyle":"Tiny Action"])
        precondition(reflective.contains("What feeling brought you here, and what do you need now?"))
        precondition(reflective.contains("Pick one small task. You only need to begin."))
        for field in PersonalizedNudgeLibrary.preferenceMessages.values {
            for messages in field.values { for message in messages {
                precondition(message.count<=110 && message.last.map { ".?!".contains($0) } == true)
            } }
        }
        let value = ShieldPresentation(day:"test",title:"Your session has ended",explanation:"Choose your next session.",action:"Start a 15-minute session",messages:reading)
        let decoded = try JSONDecoder().decode(ShieldPresentation.self,from:JSONEncoder().encode(value))
        precondition(decoded.title == value.title && decoded.messages == value.messages)
        print("PASS: complete bounded sentences, keyword topics, variation, multiple interests, word boundaries, raw-input isolation and presentation snapshot decoding")
    }
}
