package expo.modules.hooshusage

import java.util.UUID

class SelectionFailure(val code: String) : RuntimeException(code)
data class SavedSelection(val revision: Int, val apps: Set<String>)
interface SelectionPersistence {
  fun read(owner: String): SavedSelection
  fun erase(owner: String)
  fun compareAndSet(owner: String, expectedRevision: Int, apps: Set<String>): SavedSelection
}

/** Synchronized transactions. Owner keys identify storage; they do not authenticate a caller. */
class SelectionDrafts(private val persistence: SelectionPersistence) {
  private data class Draft(val owner: String, var base: SavedSelection, var apps: Set<String>, var version: Int = 0)
  private val drafts = mutableMapOf<String, Draft>()
  @Synchronized fun begin(owner: String): Map<String, Any> {
    validateOwner(owner)
    if (drafts.size >= 8) throw SelectionFailure("ERR_SELECTION_BUSY")
    val saved = persistence.read(owner)
    val id = UUID.randomUUID().toString()
    drafts[id] = Draft(owner, saved.copy(apps = saved.apps.toSet()), saved.apps.toSet())
    return summary(owner, id)
  }
  private fun draft(owner: String, id: String): Draft {
    validateOwner(owner)
    return drafts[id]?.takeIf { it.owner == owner } ?: throw SelectionFailure("ERR_SELECTION_DRAFT_EXPIRED")
  }
  private fun checked(owner: String, id: String, version: Int): Draft = draft(owner, id).also {
    if (it.version != version) throw SelectionFailure("ERR_SELECTION_DRAFT_CHANGED")
  }
  @Synchronized fun selected(owner: String, id: String, version: Int): Set<String> = checked(owner, id, version).apps.toSet()
  @Synchronized fun summary(owner: String, id: String): Map<String, Any> = draft(owner, id).let {
    mapOf("draftId" to id, "groupId" to "global", "baseRevision" to it.base.revision,
      "draftVersion" to it.version, "selectedAppCount" to it.apps.size,
      "savedAppCount" to it.base.apps.size, "dirty" to (it.apps != it.base.apps))
  }
  @Synchronized fun stage(owner: String, id: String, version: Int, apps: Set<String>): Map<String, Any> {
    val draft = checked(owner, id, version)
    validateApps(apps)
    if (draft.apps != apps) { check(draft.version < Int.MAX_VALUE); draft.apps = apps.toSet(); draft.version++ }
    return summary(owner, id)
  }
  @Synchronized fun commit(owner: String, id: String, version: Int, eligible: Set<String>): Map<String, Any> {
    val draft = checked(owner, id, version)
    if (!eligible.containsAll(draft.apps)) throw SelectionFailure("ERR_SELECTION_CHANGED")
    val saved = persistence.compareAndSet(owner, draft.base.revision, draft.apps.toSet())
    draft.base = saved // Only durable acknowledgment advances the draft baseline.
    return summary(owner, id)
  }
  @Synchronized fun release(owner: String, id: String) {
    validateOwner(owner)
    if (drafts[id]?.owner == owner) drafts.remove(id)
  }
  @Synchronized fun endOwner(owner: String, erase: Boolean) {
    validateOwner(owner)
    drafts.entries.removeAll { it.value.owner == owner }
    if (erase) persistence.erase(owner)
  }
  @Synchronized fun clear() = drafts.clear() // Activity/module cleanup discards drafts, never saved records.
  companion object {
    fun validateOwner(owner: String) {
      if (!owner.matches(Regex("[a-z0-9_-]{1,64}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")))
        throw SelectionFailure("ERR_SELECTION_OWNER_INVALID")
    }
    fun validateApps(apps: Set<String>) {
      if (apps.size > 512 || apps.any { !it.matches(Regex("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)+")) || it.length > 255 })
        throw SelectionFailure("ERR_SELECTION_CHANGED")
    }
  }
}
