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
    val rewards = RewardChecks.run() + HistoryUsageChecks.run() + HistoryStorageChecks.run(context)
    val pure = try { InterventionEngineChecks.run() } catch (e: Exception) { lastCase = InterventionEngineChecks.lastCase; throw e }
    val weekly = try { WeeklyScheduleChecks.run() } catch (e: Exception) { lastCase = pure + WeeklyScheduleChecks.lastCase; throw e }
    val quests = try { QuestScheduleChecks.run() } catch (e: Exception) { lastCase = pure + weekly + QuestScheduleChecks.lastCase; throw e }
    var count = pure + weekly + quests + rewards; lastCase = count
    fun case(action: () -> Unit) { lastCase = count + 1; action(); count++ }
    val directory = File(context.cacheDir, "intervention-checks-${System.nanoTime()}"); check(!directory.exists())
    try {
      case {
        val payload = QuestBridgePayload.decode("""{"policy":null,"versions":[{"effectiveUntil":null,"weekdays":[]}],"enabled":false}""")
        check(payload["policy"] == null && payload["enabled"] == false)
        val version = (payload["versions"] as List<*>).single() as Map<*, *>
        check(version["effectiveUntil"] == null && version["weekdays"] == emptyList<Any>())
      }
      case {
        listOf("[]", "{broken", "x".repeat(65537), """{"value":"${"x".repeat(257)}"}""",
          """{"value":${"[".repeat(30)}0${"]".repeat(30)}}""",
          """{"list":[${(0..512).joinToString(",") { "0" }}]}""").forEach { value ->
          failure("ERR_INTERVENTION_INVALID") { QuestBridgePayload.decode(value) }
        }
      }
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
        check(org.json.JSONObject(path.readText()).getInt("version") == 4)
      }
      case {
        val path = File(directory, "quests.json"); val store = AtomicInterventionPersistence(path); val e = InterventionEngine(store)
        val id = "00000000-0000-4000-8000-000000000051"
        val request = "00000000-0000-4000-8000-000000000052"
        val now = java.time.Instant.parse("2026-11-09T08:00:00Z").toEpochMilli()
        val q = QuestInstallation(id, 1, "2026-11-09", "daily", WeeklySchedule(listOf(0), "09:00", "10:00", false, "UTC"), now, null, setOf(APP))
        e.applyQuest(A, 0, SavedSelection(1, setOf(APP)), id, 1, request, true, listOf(q), emptySet(), SessionPolicy("UTC", 2, 60), now)
        val later = java.time.Instant.parse("2027-01-01T09:30:00Z").toEpochMilli()
        val record = e.allow(A, 1, APP, later, 1000, 1)
        check(InterventionEngine(AtomicInterventionPersistence(path)).read(A) == record)
        check(record.plan.questReceipts[id]?.requestId == request && record.discardedEventCount == 0)
      }
      case {
        val path = File(directory, "quests.json"); val original = path.readText()
        val json = org.json.JSONObject(original)
        val receipts = json.getJSONObject("plan").getJSONObject("questReceipts")
        receipts.getJSONObject(receipts.keys().next()).put("enabled", false)
        path.writeText(json.toString())
        failure("ERR_INTERVENTION_STORAGE") { AtomicInterventionPersistence(path).read() }
        path.writeText(original)
      }
      case {
        val store = OwnerInterventionPersistence(File(directory, "accounts")); val e = InterventionEngine(store)
        val now = java.time.Instant.parse("2026-11-09T09:30:00Z").toEpochMilli()
        val other = "account-b:00000000-0000-4000-8000-000000000061"
        e.install(A, 0, 1, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("account_a", now - 1000, now + 600000)), SessionPolicy("UTC", 2, 60), now)
        val original = e.allow(A, 1, APP, now, 1000, 1).let { it.copy(rewards = it.rewards.copy(covered = true)).also { value -> store.write(value) } }
        failure("ERR_INTERVENTION_OTHER_ACCOUNT") { store.claim(other, false, now + 1) }
        check(e.read(A) == original)
        store.claim(other, true, now + 2)
        check(e.read(other) == null)
        // B has not installed anything. A must not silently start over at revision0.
        failure("ERR_INTERVENTION_OWNER") { e.read(A) }
        failure("ERR_INTERVENTION_OWNER") {
          e.install(A, 0, 1, SavedSelection(1, setOf(APP)), emptyList(), SessionPolicy("UTC", 2, 60), now)
        }
        store.claim(A, true, now + 3)
        check(e.read(A)!!.daily == original.daily && e.read(A)!!.sessions == original.sessions)
        check(WeeklySchedules.windows(e.read(A)!!.plan, now).isEmpty())
        store.claim(other, true, now + 4)
        e.install(other, 0, 1, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("account_b", now, now + 600000)), SessionPolicy("UTC", 2, 60), now)
        check(e.read(other)!!.daily.isEmpty())
        store.claim(A, true, now + 3)
        val restored = e.read(A)!!
        check(restored.daily == original.daily && restored.sessions == original.sessions)
        check(restored.rewards.events == original.rewards.events && !restored.rewards.covered)
        check(restored.allowances.isEmpty() && WeeklySchedules.windows(restored.plan, now).isEmpty())
      }
      case {
        val store = OwnerInterventionPersistence(File(directory, "accounts")); val e = InterventionEngine(store)
        val other = "account-b:00000000-0000-4000-8000-000000000061"
        val before = e.read(A)
        store.eraseOwner(other)
        check(e.read(A) == before)
        store.claim(other, true, 2000)
        check(e.read(other) == null)
      }
      case {
        val path = File(directory, "quests.json"); val original = path.readText()
        val json = org.json.JSONObject(original)
        json.getJSONObject("plan").getJSONArray("quests").getJSONObject(0).put("timezone", "Not/A_Zone")
        path.writeText(json.toString())
        failure("ERR_INTERVENTION_STORAGE") { AtomicInterventionPersistence(path).read() }
        path.writeText(original)
      }
      case {
        val path = File(directory, "rewards.json"); val disk = AtomicInterventionPersistence(path); val e = InterventionEngine(disk)
        e.install(A, 0, 1, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("one", 1000, 900000)), SessionPolicy("UTC", 2, 60), 1000)
        val session = e.allow(A, 1, APP, 2000, 1000, 1).sessions.single()
        e.dismissNudge(A, 1, APP)
        val r = e.quit(A, 1, APP, session.id, "mid_session", 32000)
        check(AtomicInterventionPersistence(path).read() == r && r.rewards.events.size == 2)
        e.acknowledgeRewards(A, r.rewards.installation, 1)
        check(AtomicInterventionPersistence(path).read()!!.rewards.events.single().sequence == 2L)
      }
      case {
        val path = File(directory, "rewards.json"); val original = path.readText()
        val json = org.json.JSONObject(original)
        json.getJSONObject("rewards").put("next", true)
        path.writeText(json.toString()); failure("ERR_INTERVENTION_STORAGE") { AtomicInterventionPersistence(path).read() }; path.writeText(original)
      }
      case {
        val path = File(directory, "rewards.json"); val original = path.readText()
        val json = org.json.JSONObject(original)
        json.getJSONObject("rewards").getJSONArray("events").getJSONObject(0).put("sequence", 0)
        path.writeText(json.toString()); failure("ERR_INTERVENTION_STORAGE") { AtomicInterventionPersistence(path).read() }; path.writeText(original)
      }
      case {
        val path = File(directory, "rewards.json"); val original = path.readText()
        val json = org.json.JSONObject(original)
        json.getJSONObject("rewards").getJSONArray("events").getJSONObject(0).put("context", org.json.JSONObject.NULL)
        path.writeText(json.toString()); failure("ERR_INTERVENTION_STORAGE") { AtomicInterventionPersistence(path).read() }; path.writeText(original)
      }
      case {
        val path = File(directory, "rewards.json"); val original = path.readText()
        val json = org.json.JSONObject(original)
        json.getJSONObject("rewards").put("boot", "1")
        path.writeText(json.toString()); failure("ERR_INTERVENTION_STORAGE") { AtomicInterventionPersistence(path).read() }; path.writeText(original)
      }
      case {
        val path = File(directory, "rewards.json"); val original = path.readText()
        val json = org.json.JSONObject(original).put("version", 3); json.remove("rewards")
        path.writeText(json.toString()); val disk = AtomicInterventionPersistence(path)
        check(disk.read()!!.rewards.events.isEmpty())
        InterventionEngine(disk).cancel(A, 1, null, 40000)
        check(org.json.JSONObject(path.readText()).getInt("version") == 4)
      }
      case {
        val path = File(directory, "rewards-bounded.json"); val disk = AtomicInterventionPersistence(path); val e = InterventionEngine(disk)
        e.install(A, 0, 1, SavedSelection(1, setOf(APP)), listOf(InterventionWindow("one", 1000, 900000)), SessionPolicy("UTC", 2, 60), 1000)
        repeat(300) { e.quit(A, 1, APP, java.util.UUID.randomUUID().toString(), "initial", 2000L + it) }
        val r = AtomicInterventionPersistence(path).read()!!
        check(r.rewards.events.size == 256 && r.rewards.discarded == 44L && r.events.size == 256)
      }
    } finally { check(directory.deleteRecursively()) }
    return count
  }
}
