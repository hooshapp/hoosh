import Foundation
@main struct HistoryChecks {
 static func main() {
  var cal=Calendar(identifier:.gregorian);cal.timeZone=TimeZone(identifier:"America/New_York")!;cal.firstWeekday=2
  func date(_ s:String)->Date { ISO8601DateFormatter().date(from:s)! }
  let now=date("2026-11-05T17:00:00Z")
  let w=HistoryPeriod.week.window(now:now,calendar:cal)
  precondition(w.comparisonDays==3)
  var days:[HistoryUsageDay]=[]
  for i in 0..<3 {
   days.append(.init(date:cal.date(byAdding:.day,value:i,to:w.previousStart)!,seconds:600))
   days.append(.init(date:cal.date(byAdding:.day,value:i,to:w.currentStart)!,seconds:120))
  }
  let a=HistoryUsageComparison(days:days,period:.week,now:now,calendar:cal)
  precondition(a.beforeSeconds==1800 && a.afterSeconds==360 && a.freedCircles==8)
  let fourthBefore=cal.date(byAdding:.day,value:3,to:w.previousStart)!
  let fourthAfter=cal.date(byAdding:.day,value:3,to:w.currentStart)!
  let friday=date("2026-11-06T17:00:00Z")
  let four=HistoryUsageComparison(days:days+[.init(date:fourthBefore,seconds:600),.init(date:fourthAfter,seconds:120)],period:.week,now:friday,calendar:cal)
  precondition(four.comparedDays==4 && four.previousDates==w.previousStart...fourthBefore && four.currentDates==w.currentStart...fourthAfter)
  precondition(four.freedSeconds==1920 && four.freedCircles==8)
  let missing=HistoryUsageComparison(days:Array(days.dropLast()),period:.week,now:now,calendar:cal)
  precondition(missing.beforeSeconds==nil && missing.reductionPercent==nil)
  let zero=HistoryUsageComparison(days:days.map{.init(date:$0.date,seconds:0)},period:.week,now:now,calendar:cal)
  precondition(zero.currentSeconds==0 && zero.reductionPercent==nil)
  let increase=HistoryUsageComparison(days:days.map{.init(date:$0.date,seconds:$0.seconds==120 ? 1200:600)},period:.week,now:now,calendar:cal)
  precondition(increase.reductionPercent == -100 && increase.freedCircles==0)
  let today=HistoryUsageComparison(days:days+[.init(date:now,seconds:9999),.init(date:now,seconds:.nan),.init(date:now.addingTimeInterval(86400),seconds:9999)],period:.week,now:now,calendar:cal)
  precondition(today.afterSeconds==360 && today.currentSeconds==10359)
  let short=HistoryUsageComparison(days:days,period:.week,now:date("2026-11-04T17:00:00Z"),calendar:cal)
  precondition(short.comparedDays==2 && short.beforeSeconds==nil && short.reductionPercent==nil)
  let early = date("2026-11-10T14:00:00Z")
  let earlyWindow = HistoryPeriod.week.window(now:early,calendar:cal)
  let smallBaseline = HistoryUsageComparison(days:[
   .init(date:earlyWindow.previousStart,seconds:67),
   .init(date:earlyWindow.currentStart,seconds:2313)
  ],period:.week,now:early,calendar:cal)
  precondition(smallBaseline.currentSeconds==2313 && smallBaseline.beforeSeconds==nil && smallBaseline.reductionPercent==nil)
  precondition(HistoryPeriod.month.window(now:date("2026-03-31T16:00:00Z"),calendar:cal).comparisonDays==28)
  let id=UUID();let event=HistoryTurnOff(id:id,date:now,sessionID:"session")
  precondition(HistoryTurnOff.count([event,event,.init(id:UUID(),date:now,sessionID:"session"),.init(id:UUID(),date:w.previousStart,sessionID:nil)],period:.week,now:now,calendar:cal)==1)
  precondition(Set(HistoryPeriod.allCases.map(\.reportContext)).count==2)
  let screenshotBefore = 3*3600 + 2*60 + 23
  let screenshotNow = 2*3600 + 16*60 + 35
  let difference = screenshotBefore - screenshotNow
  precondition(HistoryUsageComparison.duration(Double(difference)) == "45m 48s")
  precondition((Double(difference) / Double(screenshotBefore) * 100).rounded() == 25)
  print("PASS: matched completed days, DST/month windows, missing versus zero, increases, current/future filtering, turn-off deduplication and two report contexts")
 }
}
