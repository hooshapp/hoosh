import Foundation
@main struct LocalContextChecks {
 static func main() throws {
  let now=Date(timeIntervalSince1970:1_800_000_000)
  let item=LocalProductivityNudge(provider:"calendar",title:"Biology review",dueAt:now.addingTimeInterval(3600),refreshedAt:now)
  precondition(item.messages(now:now).first!.contains("Biology review"))
  precondition(item.messages(now:now.addingTimeInterval(3601)).isEmpty,"Past events must not keep nudging")
  precondition(item.messages(now:now.addingTimeInterval(-1)).isEmpty)
  let stale=LocalProductivityNudge(provider:"reminders",title:"Task",dueAt:now.addingTimeInterval(3600),refreshedAt:now.addingTimeInterval(-5*3600))
  precondition(stale.messages(now:now).isEmpty)
  let long=LocalProductivityNudge(provider:"reminders",title:String(repeating:"private title ",count:30),dueAt:now.addingTimeInterval(60),refreshedAt:now)
  precondition(!long.messages(now:now).first!.contains("private title"),"Do not clip titles into sentence fragments")
  for provider in ["calendar","reminders"] {
   let sample=LocalProductivityNudge(provider:provider,title:String(repeating:"a",count:48),dueAt:now.addingTimeInterval(60),refreshedAt:now)
   for message in sample.messages(now:now) { precondition(message.count<=110 && message.last=="?") }
  }
  let overdue=LocalProductivityNudge(provider:"reminders",title:"Submit report",dueAt:now.addingTimeInterval(-86400),refreshedAt:now)
  precondition(overdue.messages(now:now).first!.contains("Past due: “Submit report”"))
  let undated=LocalProductivityNudge(provider:"reminders",title:"Call Sam",dueAt:nil,refreshedAt:now)
  precondition(undated.messages(now:now).first!.contains("On your list: “Call Sam”"))
  let timed=LocalProductivityNudge(provider:"reminders",title:"Send notes",dueAt:now.addingTimeInterval(1200),refreshedAt:now)
  precondition(timed.messages(now:now).first!.hasPrefix("Due at "))
  precondition(timed.priority(now:now)<item.priority(now:now))
  precondition(item.priority(now:now)<overdue.priority(now:now))
  precondition(overdue.priority(now:now)<undated.priority(now:now))
  var calendar=Calendar(identifier:.gregorian);calendar.timeZone=TimeZone(secondsFromGMT:0)!
  var day=calendar.dateComponents([.year,.month,.day],from:now);day.calendar=calendar
  let normalized=LocalProductivityNudge.reminderDueDate(day,calendar:calendar)!
  precondition(calendar.component(.hour,from:normalized)==23 && calendar.component(.minute,from:normalized)==59)
  let restored=try JSONDecoder().decode(LocalProductivityNudge.self,from:JSONEncoder().encode(undated))
  precondition(restored.dueAt==nil && !restored.messages(now:now).isEmpty)
  let grouped=LocalProductivityNudge.selectReminders([
    LocalReminderTask(title:"Laundry",dueAt:now.addingTimeInterval(-7200)),
    LocalReminderTask(title:"Submit report",dueAt:now.addingTimeInterval(-3600)),
    LocalReminderTask(title:"Read",dueAt:nil)],now:now)!
  precondition(grouped.messages(now:now)==["Overdue: Laundry, Submit report. Get started on these."])
  let noDates=LocalProductivityNudge.selectReminders([LocalReminderTask(title:"Call Sam",dueAt:nil),LocalReminderTask(title:"Read",dueAt:nil)],now:now)!
  precondition(noDates.messages(now:now)==["On your list: Call Sam, Read. Make time to get these done."])
  let prioritized=LocalProductivityNudge.selectReminders([
    LocalReminderTask(title:"Later",dueAt:now.addingTimeInterval(3600)),
    LocalReminderTask(title:"First",dueAt:now.addingTimeInterval(600)),
    LocalReminderTask(title:"Old",dueAt:now.addingTimeInterval(-3600))],now:now)!
  precondition(prioritized.title=="First" && prioritized.reminderTasks==nil)
  let many=LocalProductivityNudge.selectReminders((1...20).map { LocalReminderTask(title:"Task \($0)",dueAt:nil) },now:now)!
  precondition(many.messages(now:now).first!.count<=110 && many.messages(now:now).first!.contains("more"))
  precondition(LocalProductivityNudge.selectReminders([],now:now)==nil)
  let roundTrip=try JSONDecoder().decode(LocalProductivityNudge.self,from:JSONEncoder().encode(grouped))
  precondition(roundTrip.messages(now:now)==grouped.messages(now:now))
  print("PASS: local calendar/reminder messages, expiry, stale snapshots, future-clock protection, long-title fallback and bounded sentences")
 }
}
