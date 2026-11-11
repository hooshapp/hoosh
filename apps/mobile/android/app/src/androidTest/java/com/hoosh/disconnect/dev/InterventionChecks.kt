package com.hoosh.disconnect.dev

import android.content.Context
import expo.modules.hooshusage.*
import java.io.File

/** Adds actual Android persistence checks to the same reproducible JVM controller suite. */
internal object InterventionChecks {
  private const val A = "qa-development:00000000-0000-4000-8000-000000000021"
  private const val APP = "synthetic.alpha"
  var lastCase = 0
    private set
  private fun failure(code: String, action: () -> Unit) {
    try { action(); error("Expected failure") } catch (e: InterventionFailure) { check(e.code == code) }
  }
  fun run(context: Context): Int {
    val pure = try { InterventionEngineChecks.run() } catch (e: Exception) { lastCase = InterventionEngineChecks.lastCase; throw e }
    val weekly = try { WeeklyScheduleChecks.run() } catch (e: Exception) { lastCase = pure + WeeklyScheduleChecks.lastCase; throw e }
    var count = pure + weekly; lastCase = count
    fun case(action: () -> Unit) { lastCase = count + 1; action(); count++ }
    val directory = File(context.cacheDir, "intervention-checks-${System.nanoTime()}"); check(!directory.exists())
    try {
      case {
        val store = AtomicInterventionPersistence(File(directory, "state.json")); val e = InterventionEngine(store)
        e.install(A, 0, 1, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("one", 1000, 900000)), SessionPolicy("UTC", 2, 10), 1000)
        val r = e.allow(A, 1, APP, 2000, 1000, 1); check(InterventionEngine(AtomicInterventionPersistence(File(directory, "state.json"))).read(A) == r)
      }
      case {
        val path = File(directory, "state.json"); val store = AtomicInterventionPersistence(path); val original = path.readText()
        path.writeText("{broken"); failure("ERR_INTERVENTION_STORAGE") { store.read() }; path.writeText(original)
        check(store.read() != null)
      }
      case {
        val path = File(directory, "state.json"); val store = AtomicInterventionPersistence(path); val original = path.readText()
        path.writeText(org.json.JSONObject(original).put("version", 1.5).toString()); failure("ERR_INTERVENTION_STORAGE") { store.read() }; path.writeText(original)
      }
      case {
        val path = File(directory, "state.json"); val store = AtomicInterventionPersistence(path); val original = path.readText()
        path.writeBytes(ByteArray(262145)); failure("ERR_INTERVENTION_STORAGE") { store.read() }; path.writeText(original)
      }
      case {
        val path = File(directory, "state.json"); val store = AtomicInterventionPersistence(path)
        val sidecar = File(path.path + ".new"); check(sidecar.mkdir()); File(sidecar, "held").writeText("synthetic")
        failure("ERR_INTERVENTION_STORAGE") { store.erase() }; check(sidecar.deleteRecursively())
      }
      case {
        val path = File(directory, "state.json"); val store = AtomicInterventionPersistence(path)
        InterventionEngine(store).install(A, 0, 1, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("one", 1000, 900000)), SessionPolicy("UTC", 2, 10), 1000)
        File(path.path + ".bak").writeText(path.readText()); File(path.path + ".new").writeText("interrupted"); store.erase()
        check(listOf(path, File(path.path + ".bak"), File(path.path + ".new")).none { it.exists() })
      }
      case {
        val path = File(directory, "weekly.json"); val store = AtomicInterventionPersistence(path); val e = InterventionEngine(store)
        val s = WeeklySchedule(listOf(0), "09:00", "17:00", false, "UTC")
        val first = java.time.Instant.parse("2026-11-09T10:00:00Z").toEpochMilli()
        e.install(A, 0, 1, SavedSelection(1, setOf(APP)), WeeklySchedules.compile(s, first), SessionPolicy("UTC", 2, 60), first, WeeklyInstallation(s, setOf(APP)))
        val later = java.time.Instant.parse("2026-12-28T10:00:00Z").toEpochMilli()
        val result = e.allow(A, 1, APP, later, 1000, 1)
        check(InterventionEngine(AtomicInterventionPersistence(path)).read(A) == result)
        val stopped = e.cancel(A, 1, null, later + 1000)
        check(AtomicInterventionPersistence(path).read() == stopped && stopped.plan.weekly?.enabled == false)
      }
      case {
        val path = File(directory, "weekly.json"); val original = path.readText()
        val json = org.json.JSONObject(original); val p = json.getJSONObject("plan")
        p.getJSONObject("weekly").put("timezone", "Invalid/Zone"); path.writeText(json.toString())
        failure("ERR_INTERVENTION_STORAGE") { AtomicInterventionPersistence(path).read() }; path.writeText(original)
      }
      case {
        val path = File(directory, "legacy.json"); val store = AtomicInterventionPersistence(path); val e = InterventionEngine(store)
        e.install(A, 0, 1, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("one", 1000, 900000)), SessionPolicy("UTC", 2, 10), 1000)
        val json = org.json.JSONObject(path.readText()).put("version", 1); json.getJSONObject("plan").remove("weekly"); path.writeText(json.toString())
        check(store.read()?.plan?.weekly == null); e.cancel(A, 1, null, 2000)
        check(org.json.JSONObject(path.readText()).getInt("version") == 2)
      }
    } finally { check(directory.deleteRecursively()) }
    return count
  }
}
