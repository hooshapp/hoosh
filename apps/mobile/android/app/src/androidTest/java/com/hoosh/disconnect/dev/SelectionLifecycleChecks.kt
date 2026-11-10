package com.hoosh.disconnect.dev

import android.app.Instrumentation
import expo.modules.hooshusage.*
import expo.modules.kotlin.Promise
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/** Controlled owners and injected catalog/lock outcomes; no real account deletion or installed-app mutation. */
internal object SelectionLifecycleChecks {
  private const val A = "qa-development:00000000-0000-4000-8000-000000000011"
  private const val B = "qa-development:00000000-0000-4000-8000-000000000012"
  private const val APP = "synthetic.alpha"
  var lastCase = 0
    private set
  private class Result : Promise {
    val ready = CountDownLatch(1)
    var value: Any? = null
    var error: String? = null
    var calls = 0
    override fun resolve(value: Any?) { this.value = value; calls++; ready.countDown() }
    override fun reject(code: String?, message: String?, cause: Throwable?) { error = code; calls++; ready.countDown() }
    fun await(code: String? = null): Result { check(ready.await(5, TimeUnit.SECONDS)); check(error == code && calls == 1); return this }
  }
  private class Memory : SelectionPersistence {
    val rows = mutableMapOf<String, SavedSelection>()
    var beforeRead: (() -> Unit)? = null
    var beforeWrite: (() -> Unit)? = null
    var afterWrite: (() -> Unit)? = null
    var failErase = false
    var writes = 0
    override fun read(owner: String): SavedSelection { beforeRead?.invoke(); return rows[owner] ?: SavedSelection(0, emptySet()) }
    override fun compareAndSet(owner: String, expectedRevision: Int, apps: Set<String>): SavedSelection {
      beforeWrite?.invoke()
      val previous = rows[owner] ?: SavedSelection(0, emptySet())
      if (previous.revision != expectedRevision) throw SelectionFailure("ERR_SELECTION_CONFLICT")
      val next = if (previous.apps == apps) previous else SavedSelection(previous.revision + 1, apps.toSet())
      rows[owner] = next; writes++; afterWrite?.invoke(); return next
    }
    override fun erase(owner: String) {
      if (failErase) throw SelectionFailure("ERR_SELECTION_STORAGE")
      rows.remove(owner)
    }
  }
  private fun id(value: Map<String, Any>) = value["draftId"] as String
  private fun failure(code: String, action: () -> Unit) {
    try { action(); error("Expected failure") } catch (error: SelectionFailure) { check(error.code == code) }
  }
  fun run(instrumentation: Instrumentation): Int {
    var count = 0; lastCase = 0
    fun case(action: () -> Unit) { lastCase = count + 1; action(); count++ }
    fun main(action: () -> Unit) = instrumentation.runOnMainSync(action)
    fun call(action: (Result) -> Unit): Result = Result().also { main { action(it) } }
    case {
      val p = Memory(); p.rows[A] = SavedSelection(1, setOf(APP)); p.rows[B] = SavedSelection(1, setOf(APP))
      val d = SelectionDrafts(p); val a = id(d.begin(A)); val b = id(d.begin(B))
      d.endOwner(A, false); check(p.rows[A]!!.apps == setOf(APP)); check(d.summary(B, b)["selectedAppCount"] == 1)
      failure("ERR_SELECTION_DRAFT_EXPIRED") { d.selected(A, a, 0) }
      d.endOwner(A, true); check(!p.rows.containsKey(A) && p.rows.containsKey(B))
    }
    case {
      val p = Memory(); val d = SelectionDrafts(p); val old = id(d.begin(A)); d.stage(A, old, 0, setOf(APP))
      d.endOwner(A, true); check(d.begin(A)["baseRevision"] == 0)
      failure("ERR_SELECTION_DRAFT_EXPIRED") { d.commit(A, old, 1, setOf(APP)) }; check(p.rows.isEmpty())
    }
    case {
      val p = Memory(); p.rows[A] = SavedSelection(1, setOf(APP)); val d = SelectionDrafts(p); val a = id(d.begin(A))
      p.failErase = true; failure("ERR_SELECTION_STORAGE") { d.endOwner(A, true) }
      failure("ERR_SELECTION_DRAFT_EXPIRED") { d.selected(A, a, 0) }; check(p.rows.containsKey(A))
      p.failErase = false; d.endOwner(A, true); d.endOwner(A, true); check(p.rows.isEmpty())
    }
    val directory = File(instrumentation.targetContext.cacheDir, "selection-lifecycle-${System.nanoTime()}")
    check(!directory.exists())
    try {
      case {
        val p = AtomicSelectionPersistence(directory); p.erase(A); check(!directory.exists())
        p.compareAndSet(A, 0, setOf(APP)); val a = directory.listFiles()!!.single()
        p.compareAndSet(B, 0, setOf(APP)); File(a.path + ".bak").writeText(a.readText()); File(a.path + ".new").writeText("interrupted")
        p.erase(A); check(!a.exists() && !File(a.path + ".bak").exists() && !File(a.path + ".new").exists())
        check(p.read(A).revision == 0 && p.read(B).revision == 1)
      }
      case {
        val isolated = File(directory, "erase-failure")
        val p = AtomicSelectionPersistence(isolated); p.compareAndSet(A, 0, setOf(APP))
        val atomic = isolated.listFiles()!!.single(); val unfinished = File(atomic.path + ".new")
        check(unfinished.mkdir()); File(unfinished, "held").writeText("synthetic")
        failure("ERR_SELECTION_STORAGE") { p.erase(A) } // AtomicFile.delete returns void, so verify all sidecars.
        check(unfinished.exists()); check(unfinished.deleteRecursively()); p.erase(A); check(p.read(A).revision == 0)
      }
      case {
        val p = Memory(); val open = AtomicBoolean(false)
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { setOf(APP) }, { open.get() })
        try { call { editor.begin(A, it) }.await("ERR_SELECTION_UNAVAILABLE"); check(p.rows.isEmpty()) }
        finally { main { editor.dispose() } }
      }
      case {
        val p = Memory(); val open = AtomicBoolean(true); p.beforeRead = { open.set(false) }
        val d = SelectionDrafts(p); val editor = NativeSelectionEditor(instrumentation.targetContext, p, { setOf(APP) }, { open.get() }, d)
        try {
          call { editor.begin(A, it) }.await("ERR_SELECTION_UNAVAILABLE")
          p.beforeRead = null; open.set(true)
          val handles = (1..8).map { d.begin(A) }; handles.forEach { d.release(A, id(it)) } // No leaked lock-race handle.
        } finally { main { editor.dispose() } }
      }
      case {
        val p = Memory(); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP))
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { emptySet() }, { true }, d)
        try { call { editor.commit(A, handle, 1, it) }.await("ERR_SELECTION_CHANGED"); check(p.writes == 0 && d.summary(A, handle)["dirty"] == true) }
        finally { main { editor.dispose() } }
      }
      case {
        val p = Memory(); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP)); val open = AtomicBoolean(true)
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { open.set(false); setOf(APP) }, { open.get() }, d)
        try { call { editor.commit(A, handle, 1, it) }.await("ERR_SELECTION_UNAVAILABLE"); check(p.writes == 0) }
        finally { main { editor.dispose() } }
      }
      case {
        val p = Memory(); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP)); val open = AtomicBoolean(true)
        p.afterWrite = { open.set(false) }
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { setOf(APP) }, { open.get() }, d)
        try { call { editor.commit(A, handle, 1, it) }.await("ERR_SELECTION_ACK_UNAVAILABLE"); check(p.rows[A]!!.revision == 1) }
        finally { main { editor.dispose() } }
      }
      // Stop during eligibility (no issued write) and during an issued write; end-owner must drain before acknowledging erase.
      for (issuedWrite in listOf(false, true)) case {
        val p = Memory(); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP))
        val entered = CountDownLatch(1); val proceed = CountDownLatch(1)
        val block = { entered.countDown(); check(proceed.await(5, TimeUnit.SECONDS)) }
        if (issuedWrite) p.beforeWrite = block
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { if (!issuedWrite) block(); setOf(APP) }, { true }, d)
        try {
          val save = call { editor.commit(A, handle, 1, it) }; check(entered.await(5, TimeUnit.SECONDS))
          val end = call { editor.endOwner(A, true, it) }; save.await("ERR_SELECTION_DRAFT_EXPIRED")
          check(end.ready.count == 1L); proceed.countDown(); end.await(); instrumentation.waitForIdleSync()
          check(!p.rows.containsKey(A) && save.calls == 1 && p.writes == if (issuedWrite) 1 else 0)
          failure("ERR_SELECTION_DRAFT_EXPIRED") { d.selected(A, handle, 1) }
        } finally { proceed.countDown(); main { editor.dispose() } }
      }
      case {
        val p = Memory(); p.rows[B] = SavedSelection(1, setOf(APP)); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP))
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { setOf(APP) }, { true }, d)
        try {
          val save = call { editor.commit(A, handle, 1, it) }; val end = call { editor.endOwner(B, true, it) }
          save.await(); end.await(); check(p.rows[A]!!.revision == 1 && !p.rows.containsKey(B))
        } finally { main { editor.dispose() } }
      }
      case {
        val p = Memory(); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP))
        val entered = CountDownLatch(1); val proceed = CountDownLatch(1)
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { entered.countDown(); check(proceed.await(5, TimeUnit.SECONDS)); setOf(APP) }, { true }, d)
        try {
          val save = call { editor.commit(A, handle, 1, it) }; check(entered.await(5, TimeUnit.SECONDS))
          main { editor.clearDrafts() }; save.await("ERR_SELECTION_DRAFT_EXPIRED"); proceed.countDown()
          call { editor.begin(B, it) }.await(); check(p.writes == 0)
          failure("ERR_SELECTION_DRAFT_EXPIRED") { d.selected(A, handle, 1) }
        } finally { proceed.countDown(); main { editor.dispose() } }
      }
      case {
        val p = Memory(); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP))
        val entered = CountDownLatch(1); val proceed = CountDownLatch(1)
        p.beforeWrite = { entered.countDown(); check(proceed.await(5, TimeUnit.SECONDS)) }
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { setOf(APP) }, { true }, d)
        try {
          val save = call { editor.commit(A, handle, 1, it) }; check(entered.await(5, TimeUnit.SECONDS))
          val end = call { editor.endOwner(A, false, it) }; save.await("ERR_SELECTION_DRAFT_EXPIRED"); proceed.countDown(); end.await()
          val restored = call { editor.begin(A, it) }.await().value as Map<*, *>
          check(restored["selectedAppCount"] == 1 && restored["baseRevision"] == 1 && p.writes == 1)
        } finally { proceed.countDown(); main { editor.dispose() } }
      }
      case {
        val p = Memory(); val d = SelectionDrafts(p); val handle = id(d.begin(A)); d.stage(A, handle, 0, setOf(APP))
        val entered = CountDownLatch(1); val proceed = CountDownLatch(1)
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { entered.countDown(); check(proceed.await(5, TimeUnit.SECONDS)); setOf(APP) }, { true }, d)
        try {
          val save = call { editor.commit(A, handle, 1, it) }; check(entered.await(5, TimeUnit.SECONDS))
          call { editor.endOwner("anonymous", true, it) }.await("ERR_SELECTION_OWNER_INVALID")
          proceed.countDown(); save.await(); check(p.rows[A]!!.revision == 1)
        } finally { proceed.countDown(); main { editor.dispose() } }
      }
      case {
        val p = Memory(); p.rows[A] = SavedSelection(1, setOf(APP)); val d = SelectionDrafts(p); val handle = id(d.begin(A))
        val editor = NativeSelectionEditor(instrumentation.targetContext, p, { setOf(APP) }, { true }, d)
        try {
          p.failErase = true; call { editor.endOwner(A, true, it) }.await("ERR_SELECTION_STORAGE")
          call { editor.commit(A, handle, 0, it) }.await("ERR_SELECTION_DRAFT_EXPIRED"); check(p.rows[A]!!.revision == 1)
          p.failErase = false; call { editor.endOwner(A, true, it) }.await(); check(!p.rows.containsKey(A))
        } finally { main { editor.dispose() } }
      }
    } finally { check(directory.deleteRecursively()) }
    return count
  }
}
