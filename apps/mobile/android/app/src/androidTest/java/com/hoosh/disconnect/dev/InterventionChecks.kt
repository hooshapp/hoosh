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
    var count = pure; lastCase = pure
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
    } finally { check(directory.deleteRecursively()) }
    return count
  }
}
