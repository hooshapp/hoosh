package expo.modules.hooshusage

/** One ephemeral QA owner, accessed on the main thread; no storage, account or rule meaning. */
class VolatileSelection {
  private var owner: String? = null
  private var selected = emptySet<String>()
  private var revision = 0

  fun begin(nextOwner: String): Set<String> {
    require(nextOwner.matches(Regex("[A-Za-z0-9_-]{1,80}")))
    if (owner != nextOwner) { clear(); owner = nextOwner }
    return selected.toSet()
  }
  fun confirm(expectedOwner: String, next: Set<String>): Map<String, Int> {
    check(owner == expectedOwner)
    if (selected != next) {
      check(revision < Int.MAX_VALUE)
      selected = next.toSet()
      revision++
    }
    return summary(expectedOwner)
  }
  fun summary(expectedOwner: String): Map<String, Int> = mapOf(
    "selectionRevision" to if (owner == expectedOwner) revision else 0,
    "selectedAppCount" to if (owner == expectedOwner) selected.size else 0,
  )
  fun release(expectedOwner: String) {
    if (owner == expectedOwner) clear()
  }
  fun clear() { owner = null; selected = emptySet(); revision = 0 }
}
