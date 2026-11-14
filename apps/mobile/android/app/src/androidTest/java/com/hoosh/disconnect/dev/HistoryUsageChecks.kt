package com.hoosh.disconnect.dev
import expo.modules.hooshusage.*

/** Pure production interval reducer: no substituted scoring/measurement formula. */
internal object HistoryUsageChecks {
  fun run(): Int {
    var count=0
    fun case(run:()->Unit){run();count++}
    val app="synthetic.target"; val other="synthetic.other"
    fun e(at:Long,kind:Int,packageName:String?=null,activity:String?="A")=HistoryUsageEvent(at,kind,packageName,activity)
    fun measured(vararg events:HistoryUsageEvent,capped:Boolean=false)=HistoryUsage.measure("2026-11-13",100,200,events.toList(),setOf(app),capped)
    case {check(measured(e(90,15),e(100,1,app),e(150,2,app),e(210,0)).usage==50L)}
    case {check(measured(e(90,15),e(100,1,app),e(120,1,app,"B"),e(150,2,app),e(170,2,app,"B"),e(210,0)).usage==70L)}
    case {check(measured(e(90,15),e(95,1,app),e(210,2,app)).usage==100L)}
    case {check(measured(e(90,15),e(100,1,other),e(150,2,other),e(210,0)).usage==0L)}
    case {check(measured(e(90,15),e(100,1,app),e(150,16),e(210,0)).usage==50L)}
    case {check(measured(e(90,15),e(100,1,app),e(150,17),e(170,18),e(210,0)).usage==80L)}
    case {check(measured().usage==null)}
    case {check(measured(e(101,15),e(210,0)).coverage=="missing")}
    case {check(measured(e(90,15),e(199,0)).usage==null)}
    case {check(measured(e(90,15),e(210,0),capped=true).coverage=="capped")}
    case {check(measured(e(90,15),e(150,26),e(160,27),e(210,0)).coverage=="interrupted")}
    case {check(measured(e(90,0),e(210,0)).usage==null)}
    case {check(measured(e(90,15),e(150,2,app),e(210,0)).usage==null)}
    case {check(measured(e(90,15),e(160,1,app),e(150,2,app),e(210,0)).usage==null)}
    case {check(measured(e(90,15),e(95,1,app),e(150,23,app),e(160,2,app),e(210,0)).usage==60L)}
    return count
  }
}
