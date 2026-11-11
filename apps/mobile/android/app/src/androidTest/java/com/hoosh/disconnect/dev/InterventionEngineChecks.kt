package com.hoosh.disconnect.dev

import expo.modules.hooshusage.*

/** Native pure-controller and actual AtomicFile evidence; no user account or installed-app mutation. */
internal object InterventionEngineChecks {
  private const val A = "qa-development:00000000-0000-4000-8000-000000000021"
  private const val B = "qa-development:00000000-0000-4000-8000-000000000022"
  private const val APP = "synthetic.alpha"
  private const val OTHER = "synthetic.beta"
  var lastCase = 0
    private set
  private class Memory : InterventionPersistence {
    var value: InterventionRecord? = null
    var fail = false
    override fun read() = value
    override fun write(value: InterventionRecord) { if (fail) throw InterventionFailure("ERR_INTERVENTION_STORAGE"); this.value = value }
    override fun erase() { if (fail) throw InterventionFailure("ERR_INTERVENTION_STORAGE"); value = null }
  }
  private fun failure(code: String, action: () -> Unit) {
    try { action(); error("Expected failure") } catch (e: InterventionFailure) { check(e.code == code) }
  }
  private fun fixture(windows: List<InterventionWindow> = listOf(InterventionWindow("one", 1000, 900000)), policy: SessionPolicy = SessionPolicy("UTC", 2, 10)): Pair<Memory, InterventionEngine> {
    val disk = Memory(); val engine = InterventionEngine(disk)
    engine.install(A, 0, 1, SavedSelection(1, setOf(APP, OTHER)), windows, policy, 1000)
    return disk to engine
  }
  fun run(): Int {
    var count = 0; lastCase = 0
    fun case(action: () -> Unit) { lastCase = count + 1; action(); count++ }
    case { val (_, e) = fixture(); check(e.read(A)!!.plan.revision == 1 && e.read(A)!!.plan.apps.size == 2) }
    case { val (_, e) = fixture(); failure("ERR_INTERVENTION_CONFLICT") { e.install(A, 0, 2, SavedSelection(1, setOf(APP)), emptyList(), SessionPolicy("UTC", 2, 10), 1000) }; check(e.read(A)!!.plan.revision == 1) }
    case { val (_, e) = fixture(); failure("ERR_INTERVENTION_OWNER") { e.read(B) }; failure("ERR_INTERVENTION_OWNER") { e.erase(B) }; check(e.read(A) != null) }
    case { failure("ERR_INTERVENTION_OWNER") { InterventionEngine(Memory()).read("anonymous") } }
    case { val (d, e) = fixture(); d.fail = true; failure("ERR_INTERVENTION_STORAGE") { e.cancel(A, 1, null, 1000) }; check(d.value!!.plan.windows.size == 1) }
    case { val (_, e) = fixture(); val r = e.read(A)!!; check(e.needed(r, APP, 999, 1, 1).isEmpty()); check(e.needed(r, APP, 1000, 1, 1).size == 1); check(e.needed(r, APP, 900000, 1, 1).isEmpty()) }
    case { val (_, e) = fixture(); check(e.needed(e.read(A)!!, "synthetic.other", 2000, 100, 1).isEmpty()) }
    case { val (_, e) = fixture(); val r = e.allow(A, 1, APP, 2000, 1000, 1); check(e.needed(r, APP, 3000, 2000, 1).isEmpty()); check(r.daily.single().count == 1) }
    case { val (_, e) = fixture(); val r = e.allow(A, 1, APP, 2000, 1000, 1); check(e.needed(r, APP, 12000, 11000, 1).size == 1) }
    case { val (_, e) = fixture(); val r = e.allow(A, 1, APP, 2000, 1000, 1); check(e.needed(r, OTHER, 3000, 2000, 1).size == 1) }
    case { val (_, e) = fixture(); e.allow(A, 1, APP, 2000, 1000, 1); val r = e.allow(A, 1, OTHER, 3000, 2000, 1); check(r.sessions.size == 2 && r.daily.all { it.count == 1 }); check(r.sessions.first { it.app == APP }.wallEnd == 12000L) }
    case { val (_, e) = fixture(); e.allow(A, 1, APP, 2000, 1000, 1); val r = e.allow(A, 1, APP, 12000, 11000, 1); check(r.daily.single().count == 2); check(r.events.last().exhausted == false) }
    case { val (_, e) = fixture(); e.allow(A, 1, APP, 2000, 1000, 1); e.allow(A, 1, APP, 12000, 11000, 1); val r = e.allow(A, 1, APP, 22000, 21000, 1); check(r.daily.single().count == 3 && r.events.last().exhausted == true) }
    case { val (_, e) = fixture(); val r = e.allow(A, 1, APP, 2000, 1000, 1); check(e.needed(r, APP, 3000, 2000, 2).size == 1) }
    case { val (_, e) = fixture(); val r = e.allow(A, 1, APP, 2000, 1000, 1); check(e.needed(r, APP, 1500, 2000, 1).size == 1) }
    case { val (_, e) = fixture(); val r = e.allow(A, 1, APP, 2000, 1000, 1); check(e.needed(r, APP, 3000, 11000, 1).size == 1) }
    case {
      val (_, e) = fixture(listOf(InterventionWindow("one", 1000, 900000), InterventionWindow("two", 1000, 900000)))
      val r = e.allow(A, 1, APP, 2000, 1000, 1); check(r.allowances.size == 2 && r.daily.single().count == 1 && r.events.count { it.kind == "override_selected" } == 1)
    }
    case {
      val (_, e) = fixture(listOf(InterventionWindow("one", 1000, 900000), InterventionWindow("two", 4000, 900000)))
      e.allow(A, 1, APP, 2000, 1000, 1); check(e.needed(e.read(A)!!, APP, 4000, 3000, 1).single().reasonId == "two")
      val r = e.allow(A, 1, APP, 4000, 3000, 1); check(r.daily.single().count == 1 && r.sessions.single().wallEnd == 12000L && r.events.last().sessionIndex == null)
    }
    case {
      val (_, e) = fixture(listOf(InterventionWindow("one", 1000, 900000), InterventionWindow("two", 1000, 900000)))
      e.allow(A, 1, APP, 2000, 1000, 1); val r = e.cancel(A, 1, "one", 3000)
      check(r.plan.windows.single().reasonId == "two" && e.needed(r, APP, 4000, 3000, 1).isEmpty())
    }
    case { val (_, e) = fixture(); val r = e.cancel(A, 1, null, 2000); check(r.plan.revision == 2 && r.plan.windows.isEmpty()) }
    case { val (_, e) = fixture(); failure("ERR_INTERVENTION_CONFLICT") { e.allow(A, 2, APP, 2000, 1000, 1) } }
    case {
      val (_, e) = fixture(listOf(InterventionWindow("one", 1000, 900000), InterventionWindow("future", 5000, 900000)))
      val r = e.install(A, 1, 2, SavedSelection(2, setOf(OTHER)), listOf(InterventionWindow("one", 1000, 900000), InterventionWindow("future", 5000, 900000)), SessionPolicy("UTC", 2, 10), 2000)
      check(APP in r.plan.windows.first().apps && APP !in r.plan.windows.last().apps)
    }
    case {
      val (_, e) = fixture(); e.allow(A, 1, APP, 2000, 1000, 1)
      val r = e.install(A, 1, 2, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("one", 1000, 900000)), SessionPolicy("UTC", 4, 5), 3000)
      check(r.sessions.single().wallEnd == 12000L && r.daily.single().count == 1 && e.needed(r, APP, 4000, 3000, 1).isEmpty())
    }
    case {
      val (_, e) = fixture(); failure("ERR_INTERVENTION_TIMEZONE_MIGRATION") { e.install(A, 1, 2, SavedSelection(1, setOf(APP)), emptyList(), SessionPolicy("America/New_York", 2, 10), 2000) }
    }
    case {
      val (_, e) = fixture(listOf(InterventionWindow("day", 0, 172800000)), SessionPolicy("UTC", 1, 10))
      e.allow(A, 1, APP, 86395000, 1000, 1)
      check(e.needed(e.read(A)!!, APP, 86401000, 7000, 1).isEmpty())
      val r = e.allow(A, 1, APP, 86405000, 11000, 1); check(r.daily.single().day == "1970-01-02" && r.daily.single().count == 1 && r.events.last().exhausted == false)
    }
    case {
      val (_, e) = fixture(listOf(InterventionWindow("day", 0, 172800000)), SessionPolicy("UTC", 1, 1))
      e.allow(A, 1, APP, 86401000, 1000, 1); val r = e.allow(A, 1, APP, 86399000, 3000, 1)
      check(r.daily.single().day == "1970-01-02" && r.daily.single().count == 2)
    }
    case {
      val (_, e) = fixture(listOf(InterventionWindow("day", 0, 172800000)), SessionPolicy("America/New_York", 1, 1))
      val r = e.allow(A, 1, APP, 1000, 1000, 1); check(r.daily.single().day == "1969-12-31")
    }
    case {
      val (_, e) = fixture(); val before = e.read(A)!!.events; check(e.read(A)!!.events == before)
      e.acknowledge(A, before.map { it.id }); check(e.read(A)!!.events.isEmpty()); e.acknowledge(A, before.map { it.id }); check(e.read(A)!!.events.isEmpty())
    }
    case {
      val (d, e) = fixture(); repeat(255) { e.action(A, 1, "shield_presented", 2000) }
      check(d.value!!.events.size == 256); val old = d.value
      failure("ERR_INTERVENTION_JOURNAL_FULL") { e.allow(A, 1, APP, 2000, 1000, 1) }; check(d.value == old)
    }
    case { val (_, e) = fixture(); e.erase(A); check(e.read(A) == null); e.erase(A); check(e.read(B) == null) }
    case { failure("ERR_INTERVENTION_INVALID") { InterventionValidation.windows(listOf(InterventionWindow("one", 2, 1))) }; failure("ERR_INTERVENTION_INVALID") { InterventionValidation.policy(SessionPolicy("Missing/Zone", 1, 1)) } }
    case { failure("ERR_INTERVENTION_INVALID") { InterventionValidation.windows(listOf(InterventionWindow("one", 1, 2), InterventionWindow("one", 1, 2))) } }
    for ((first, second) in listOf("2026-03-08T06:59:59Z" to "2026-03-08T07:00:01Z", "2026-11-01T05:30:00Z" to "2026-11-01T06:30:00Z")) case {
      val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
      val start = format.parse(first)!!.time; val end = format.parse(second)!!.time
      val (_, e) = fixture(listOf(InterventionWindow("dst", start - 1000, end + 10000)), SessionPolicy("America/New_York", 2, 1))
      e.allow(A, 1, APP, start, 1000, 1); val r = e.allow(A, 1, APP, end, 1000 + end - start, 1)
      check(r.daily.single().count == 2 && r.events.last().exhausted == false)
    }
    case { val (d, e) = fixture(); e.allow(A, 1, APP, 2000, 1000, 1); check(InterventionEngine(d).read(A) == e.read(A)) }
    case {
      val leases = InterventionLeases(); val bridge = leases.bridge(); val a = leases.open(bridge, A); val b = leases.open(bridge, B)
      leases.end(A, false); failure("ERR_INTERVENTION_LEASE_EXPIRED") { leases.check(A, a) }; leases.check(B, b)
    }
    case {
      val leases = InterventionLeases(); val bridge = leases.bridge(); val old = leases.open(bridge, A)
      leases.end(A, true); failure("ERR_INTERVENTION_LEASE_EXPIRED") { leases.open(bridge, A) }
      failure("ERR_INTERVENTION_CLEANUP_PENDING") { leases.end(A, false) }; leases.erased(A)
      val next = leases.open(bridge, A); leases.check(A, next); failure("ERR_INTERVENTION_LEASE_EXPIRED") { leases.check(A, old) }
    }
    case {
      val leases = InterventionLeases(); val one = leases.bridge(); val two = leases.bridge()
      val old = leases.open(one, A); val next = leases.open(two, A); leases.close(one)
      failure("ERR_INTERVENTION_LEASE_EXPIRED") { leases.check(A, old) }; leases.check(A, next)
      failure("ERR_INTERVENTION_LEASE_EXPIRED") { leases.open(one, A) }
    }
    case {
      val leases = InterventionLeases(); val bridge = leases.bridge(); val token = leases.open(bridge, A)
      leases.release(B, token); leases.check(A, token); leases.release(A, token); leases.release(A, token)
      failure("ERR_INTERVENTION_LEASE_EXPIRED") { leases.check(A, token) }
    }
    case {
      val leases = InterventionLeases(); val bridge = leases.bridge(); repeat(8) { leases.open(bridge, A) }
      failure("ERR_INTERVENTION_BUSY") { leases.open(bridge, B) }; leases.close(bridge)
      val replacement = leases.bridge(); leases.open(replacement, B)
    }
    return count
  }
}
