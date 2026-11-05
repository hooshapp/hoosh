import Foundation

struct BalancedNudgeChoice {
    let message:String
    let source:String
}
enum BalancedNudgeSelection {
    static func choose(questionnaire:[String],context:[String],recent:[String],nextContext:inout Bool) -> BalancedNudgeChoice {
        let validContext=context.filter { !$0.isEmpty && $0.count<=110 && $0.last.map { ".?!".contains($0) } == true }
        let useContext = !validContext.isEmpty && nextContext
        if !validContext.isEmpty { nextContext.toggle() }
        return BalancedNudgeChoice(message:PersonalizedNudgeLibrary.choose(useContext ? validContext : questionnaire,recent:recent),
                                   source:useContext ? "productivity_context" : "questionnaire")
    }
    static func savedChoice(questionnaire:[String],context:[String],recent:[String],channel:String) -> BalancedNudgeChoice {
        let key="disconnect.nextContextNudge.v1."+channel
        var next=ShieldPresentationStore.defaults.bool(forKey:key)
        let choice=choose(questionnaire:questionnaire,context:context,recent:recent,nextContext:&next)
        ShieldPresentationStore.defaults.set(next,forKey:key)
        return choice
    }
}
