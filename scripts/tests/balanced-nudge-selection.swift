import Foundation
@main struct BalanceChecks {
 static func main() {
  let answers=["One page is a small step back toward your reading goal."]
  let tasks=["Overdue: Laundry, Submit report. Get started on these."]
  var next=false
  for i in 0..<6 {
   let choice=BalancedNudgeSelection.choose(questionnaire:answers,context:tasks,recent:[],nextContext:&next)
   precondition(choice.source == (i%2==0 ? "questionnaire" : "productivity_context"))
  }
  next=true
  let fallback=BalancedNudgeSelection.choose(questionnaire:answers,context:[],recent:[],nextContext:&next)
  precondition(fallback.source=="questionnaire" && next,"Missing context must not consume its turn")
  let invalid=BalancedNudgeSelection.choose(questionnaire:answers,context:["cutoff"],recent:[],nextContext:&next)
  precondition(invalid.message==answers[0] && next)
  let resumed=BalancedNudgeSelection.choose(questionnaire:answers,context:tasks,recent:[],nextContext:&next)
  precondition(resumed.message==tasks[0] && !next)
  print("PASS: equal source alternation, questionnaire fallback, stale/invalid context handling and preserved turn")
 }
}
