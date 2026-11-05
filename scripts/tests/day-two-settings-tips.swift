import Foundation
@main struct SettingsTipChecks {
 static func main() throws {
  var cal=Calendar(identifier:.gregorian);cal.timeZone=TimeZone(identifier:"America/New_York")!
  let start=cal.date(from:DateComponents(year:2026,month:10,day:31,hour:12))!
  let second=cal.date(byAdding:.day,value:1,to:start)!
  var state=DayTwoSettingsTips(startedAt:start)
  precondition(state.take(session:"one",now:start,calendar:cal)==nil)
  precondition(state.take(session:"one",now:second,calendar:cal)==DayTwoSettingsTips.messages[0])
  precondition(state.take(session:"two",now:second.addingTimeInterval(60),calendar:cal)==nil)
  precondition(state.take(session:"one",now:second.addingTimeInterval(7200),calendar:cal)==nil)
  precondition(state.take(session:"two",now:second.addingTimeInterval(7200),calendar:cal)==DayTwoSettingsTips.messages[1])
  var restored=try JSONDecoder().decode(DayTwoSettingsTips.self,from:JSONEncoder().encode(state))
  precondition(restored.take(session:"three",now:second.addingTimeInterval(14400),calendar:cal)==DayTwoSettingsTips.messages[2])
  precondition(restored.take(session:"four",now:second.addingTimeInterval(21600),calendar:cal)==nil)
  var missed=DayTwoSettingsTips(startedAt:start)
  precondition(missed.take(session:"late",now:cal.date(byAdding:.day,value:2,to:start)!,calendar:cal)==nil)
  print("PASS: second calendar day across DST, three-tip cap, two-hour spacing, one per session, persisted count and no later catch-up")
 }
}
