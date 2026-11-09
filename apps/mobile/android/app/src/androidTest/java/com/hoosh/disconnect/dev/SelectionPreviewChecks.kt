package com.hoosh.disconnect.dev

import expo.modules.hooshusage.VolatileSelection

/** Pure temporary-session semantics; synthetic IDs never appear in diagnostic output. */
internal object SelectionPreviewChecks {
  fun run(): Int {
    val state = VolatileSelection()
    check(state.summary("owner_a")["selectedAppCount"] == 0)
    check(state.begin("owner_a").isEmpty())
    val draft = mutableSetOf("synthetic.alpha", "synthetic.beta")
    val accepted = state.confirm("owner_a", draft)
    check(accepted == mapOf("selectionRevision" to 1, "selectedAppCount" to 2))
    check(!accepted.toString().contains("synthetic"))
    draft.clear()
    check(state.summary("owner_a")["selectedAppCount"] == 2)
    check(state.confirm("owner_a", state.begin("owner_a"))["selectionRevision"] == 1)
    val canceledDraft = state.begin("owner_a").toMutableSet()
    canceledDraft.clear()
    check(state.summary("owner_a")["selectedAppCount"] == 2)
    check(state.summary("owner_b")["selectedAppCount"] == 0)
    check(state.begin("owner_a").size == 2)
    state.release("owner_b")
    check(state.summary("owner_a")["selectedAppCount"] == 2)
    check(state.begin("owner_b").isEmpty())
    check(state.summary("owner_b")["selectionRevision"] == 0)
    state.confirm("owner_b", setOf("synthetic.gamma"))
    state.release("owner_a")
    check(state.summary("owner_b")["selectedAppCount"] == 1)
    check(state.confirm("owner_b", emptySet()) == mapOf("selectionRevision" to 2, "selectedAppCount" to 0))
    try { state.begin("invalid owner"); error("invalid owner accepted") } catch (_: IllegalArgumentException) { }
    check(state.summary("owner_b")["selectionRevision"] == 2)
    state.release("owner_b")
    check(state.summary("owner_b")["selectionRevision"] == 0)
    state.begin("owner_a"); state.confirm("owner_a", setOf("synthetic.alpha")); state.clear()
    check(state.summary("owner_a")["selectedAppCount"] == 0)
    return 12
  }
}
