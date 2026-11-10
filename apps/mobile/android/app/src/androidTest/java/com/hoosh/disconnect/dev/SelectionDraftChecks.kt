package com.hoosh.disconnect.dev

import android.content.Context
import expo.modules.hooshusage.AtomicSelectionPersistence
import expo.modules.hooshusage.SavedSelection
import expo.modules.hooshusage.SelectionDrafts
import expo.modules.hooshusage.SelectionFailure
import expo.modules.hooshusage.SelectionPersistence
import java.io.File

/** Synthetic identities only; storage tests have a dedicated temporary directory. */
internal object SelectionDraftChecks {
  var lastCase = 0
    private set
  private const val A = "qa-development:00000000-0000-4000-8000-000000000001"
  private const val B = "qa-development:00000000-0000-4000-8000-000000000002"
  private const val APP = "synthetic.alpha"
  private class Memory : SelectionPersistence {
    val rows = mutableMapOf<String, SavedSelection>()
    var fail = false
    var loseAck = false
    override fun read(owner: String) = rows[owner] ?: SavedSelection(0, emptySet())
    override fun erase(owner: String) { rows.remove(owner) }
    override fun compareAndSet(owner: String, expectedRevision: Int, apps: Set<String>): SavedSelection {
      val old = read(owner)
      if (old.revision != expectedRevision) throw SelectionFailure("ERR_SELECTION_CONFLICT")
      if (fail) throw SelectionFailure("ERR_SELECTION_STORAGE")
      val next = if (apps == old.apps) old else SavedSelection(old.revision + 1, apps.toSet())
      rows[owner] = next
      if (loseAck) throw SelectionFailure("ERR_SELECTION_STORAGE")
      return next
    }
  }
  private fun id(value: Map<String, Any>) = value["draftId"] as String
  private fun failure(code: String, action: () -> Unit) {
    try { action(); error("Expected failure") } catch (error: SelectionFailure) { check(error.code == code) }
  }
  fun run(context: Context): Int {
    var count = 0
    lastCase = 0
    fun case(action: () -> Unit) { lastCase = count + 1; action(); count++ }
    val memory = Memory(); val drafts = SelectionDrafts(memory)
    val initial = drafts.begin(A); val first = id(initial)
    case { check(initial["baseRevision"] == 0 && initial["dirty"] == false && memory.rows.isEmpty()) }
    case {
      val mutable = mutableSetOf(APP)
      val staged = drafts.stage(A, first, 0, mutable); mutable.clear()
      check(staged["dirty"] == true && memory.rows.isEmpty() && drafts.selected(A, first, 1) == setOf(APP))
    }
    case { failure("ERR_SELECTION_DRAFT_CHANGED") { drafts.stage(A, first, 0, emptySet()) } }
    case {
      drafts.release(B, first)
      failure("ERR_SELECTION_DRAFT_EXPIRED") { drafts.selected(B, first, 1) }
      check(drafts.selected(A, first, 1).size == 1)
    }
    case {
      failure("ERR_SELECTION_CHANGED") { drafts.commit(A, first, 1, emptySet()) }
      check(memory.rows.isEmpty())
    }
    case {
      val saved = drafts.commit(A, first, 1, setOf(APP))
      check(saved["baseRevision"] == 1 && saved["dirty"] == false)
      check(saved.keys == setOf("draftId", "groupId", "baseRevision", "draftVersion", "selectedAppCount", "savedAppCount", "dirty"))
      check(!saved.toString().contains(APP))
    }
    case { check(drafts.commit(A, first, 1, setOf(APP))["baseRevision"] == 1) }
    case {
      drafts.stage(A, first, 1, emptySet()); drafts.release(A, first)
      check(memory.read(A).apps == setOf(APP))
      failure("ERR_SELECTION_DRAFT_EXPIRED") { drafts.commit(A, first, 2, setOf(APP)) }
    }
    case { drafts.clear(); check(SelectionDrafts(memory).begin(A)["selectedAppCount"] == 1 && drafts.begin(B)["selectedAppCount"] == 0) }
    case {
      val other = SelectionDrafts(memory); val a = id(drafts.begin(A)); val b = id(other.begin(A))
      drafts.stage(A, a, 0, emptySet()); drafts.commit(A, a, 1, emptySet())
      failure("ERR_SELECTION_CONFLICT") { other.commit(A, b, 0, setOf(APP)) }
      check(memory.read(A).revision == 2 && memory.read(A).apps.isEmpty())
    }
    case {
      val a = id(drafts.begin(A)); drafts.stage(A, a, 0, setOf(APP)); memory.fail = true
      failure("ERR_SELECTION_STORAGE") { drafts.commit(A, a, 1, setOf(APP)) }
      check(drafts.summary(A, a)["dirty"] == true && memory.read(A).revision == 2)
      memory.fail = false
    }
    case {
      val a = id(drafts.begin(A)); drafts.stage(A, a, 0, setOf(APP)); memory.loseAck = true
      failure("ERR_SELECTION_STORAGE") { drafts.commit(A, a, 1, setOf(APP)) }; memory.loseAck = false
      failure("ERR_SELECTION_CONFLICT") { drafts.commit(A, a, 1, setOf(APP)) }
      check(SelectionDrafts(memory).begin(A)["selectedAppCount"] == 1)
    }
    case { failure("ERR_SELECTION_OWNER_INVALID") { drafts.begin("anonymous") } }
    case {
      val bounded = SelectionDrafts(Memory()); repeat(8) { bounded.begin(A) }
      failure("ERR_SELECTION_BUSY") { bounded.begin(A) }; bounded.clear(); bounded.begin(A)
    }
    val directory = File(context.cacheDir, "selection-draft-checks-${System.nanoTime()}")
    check(!directory.exists())
    try {
      val disk = AtomicSelectionPersistence(directory)
      case { check(disk.read(A) == SavedSelection(0, emptySet()) && !directory.exists()) }
      case {
        disk.compareAndSet(A, 0, setOf(APP))
        check(AtomicSelectionPersistence(directory).read(A) == SavedSelection(1, setOf(APP)))
        check(disk.read(B) == SavedSelection(0, emptySet()))
        check(directory.listFiles()!!.all { it.name.matches(Regex("[0-9a-f]{64}\\.json")) })
      }
      case {
        disk.compareAndSet(A, 1, emptySet())
        check(disk.read(A).revision == 2)
        failure("ERR_SELECTION_CONFLICT") { AtomicSelectionPersistence(directory).compareAndSet(A, 1, setOf(APP)) }
      }
      case {
        val file = directory.listFiles()!!.single(); val backup = File(file.path + ".bak")
        check(file.renameTo(backup)); file.writeText("truncated")
        check(disk.read(A) == SavedSelection(2, emptySet()))
      }
      case {
        directory.listFiles()!!.single().writeText("{\"schemaVersion\":99}")
        failure("ERR_SELECTION_STORAGE") { disk.read(A) }
        failure("ERR_SELECTION_STORAGE") { disk.compareAndSet(A, 0, emptySet()) }
      }
      case {
        directory.listFiles()!!.single().writeBytes(ByteArray(131073))
        failure("ERR_SELECTION_STORAGE") { disk.read(A) }
      }
      case {
        val bounded = AtomicSelectionPersistence(File(directory, "bounded"))
        bounded.compareAndSet(A, 0, setOf(APP))
        val huge = (0 until 512).map { "synthetic." + "a".repeat(241) + it }.toSet()
        failure("ERR_SELECTION_STORAGE") { bounded.compareAndSet(A, 1, huge) }
        check(bounded.read(A) == SavedSelection(1, setOf(APP)))
      }
      case {
        val race = File(directory, "race")
        val results = java.util.Collections.synchronizedList(mutableListOf<String>())
        val ready = java.util.concurrent.CountDownLatch(2)
        val go = java.util.concurrent.CountDownLatch(1)
        val threads = (0..1).map { index -> Thread {
          ready.countDown(); go.await()
          try {
            AtomicSelectionPersistence(race).compareAndSet(A, 0, setOf("synthetic.app$index"))
            results.add("saved")
          } catch (error: SelectionFailure) { results.add(error.code) }
        }.apply { start() } }
        check(ready.await(5, java.util.concurrent.TimeUnit.SECONDS)); go.countDown()
        threads.forEach { it.join(5000); check(!it.isAlive) }
        check(results.sorted() == listOf("ERR_SELECTION_CONFLICT", "saved").sorted())
        check(AtomicSelectionPersistence(race).read(A).revision == 1)
      }
    } finally { check(directory.deleteRecursively()) }
    return count
  }
}
