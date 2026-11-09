package expo.modules.hooshusage

import android.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileNotFoundException
import java.security.MessageDigest

/** Debug-only, one writer, app-private no-backup directory. Never stores labels/icons. */
class AtomicSelectionPersistence(private val directory: File) : SelectionPersistence {
  private fun file(owner: String): AtomicFile {
    SelectionDrafts.validateOwner(owner)
    val hash = MessageDigest.getInstance("SHA-256").digest(owner.toByteArray(Charsets.UTF_8))
      .joinToString("") { "%02x".format(it) }
    return AtomicFile(File(directory, "$hash.json"))
  }
  companion object { private val lock = Any() }
  override fun read(owner: String): SavedSelection = synchronized(lock) { readLocked(owner) }
  private fun readLocked(owner: String): SavedSelection {
    val atomic = file(owner)
    if (directory.exists() && !directory.isDirectory) throw SelectionFailure("ERR_SELECTION_STORAGE")
    try {
      val bytes = atomic.openRead().use { input ->
        val buffer = ByteArray(131073)
        var size = 0
        while (size < buffer.size) {
          val count = input.read(buffer, size, buffer.size - size)
          if (count < 0) break
          size += count
        }
        buffer.copyOf(size)
      }
      if (bytes.size > 131072) throw SelectionFailure("ERR_SELECTION_STORAGE")
      val json = JSONObject(bytes.toString(Charsets.UTF_8))
      if (json.get("schemaVersion") != 1 || json.getString("groupId") != "global")
        throw SelectionFailure("ERR_SELECTION_STORAGE")
      val revision = json.get("revision")
      if (revision !is Int || revision <= 0) throw SelectionFailure("ERR_SELECTION_STORAGE")
      val raw = json.getJSONArray("apps")
      if (raw.length() > 512) throw SelectionFailure("ERR_SELECTION_STORAGE")
      val apps = (0 until raw.length()).map { raw.get(it) as? String ?: throw SelectionFailure("ERR_SELECTION_STORAGE") }
      if (apps.size != apps.toSet().size) throw SelectionFailure("ERR_SELECTION_STORAGE")
      SelectionDrafts.validateApps(apps.toSet())
      return SavedSelection(revision, apps.toSet())
    } catch (_: FileNotFoundException) {
      // Absence is empty; unreadable existing files are not an empty selection.
      if (atomic.baseFile.exists() || File(atomic.baseFile.path + ".bak").exists() || (directory.exists() && !directory.canRead()))
        throw SelectionFailure("ERR_SELECTION_STORAGE")
      return SavedSelection(0, emptySet())
    } catch (_: Exception) { throw SelectionFailure("ERR_SELECTION_STORAGE") }
  }
  override fun compareAndSet(owner: String, expectedRevision: Int, apps: Set<String>): SavedSelection = synchronized(lock) {
    val current = readLocked(owner)
    if (current.revision != expectedRevision) throw SelectionFailure("ERR_SELECTION_CONFLICT")
    if (current.apps == apps) return@synchronized current
    if (current.revision == Int.MAX_VALUE) throw SelectionFailure("ERR_SELECTION_STORAGE")
    val next = SavedSelection(current.revision + 1, apps.toSet())
    writeLocked(owner, next)
    next
  }
  private fun writeLocked(owner: String, selection: SavedSelection) {
    SelectionDrafts.validateApps(selection.apps)
    val atomic = file(owner)
    if (!directory.isDirectory && !directory.mkdirs()) throw SelectionFailure("ERR_SELECTION_STORAGE")
    val bytes = JSONObject().put("schemaVersion", 1).put("groupId", "global")
      .put("revision", selection.revision).put("apps", JSONArray(selection.apps.sorted())).toString().toByteArray(Charsets.UTF_8)
    if (bytes.size > 131072) throw SelectionFailure("ERR_SELECTION_STORAGE")
    val stream = try { atomic.startWrite() } catch (_: Exception) { throw SelectionFailure("ERR_SELECTION_STORAGE") }
    try { stream.write(bytes); atomic.finishWrite(stream) }
    catch (_: Exception) { atomic.failWrite(stream); throw SelectionFailure("ERR_SELECTION_STORAGE") }
    // AtomicFile can log some filesystem failures instead of throwing. Verify acknowledgment.
    if (readLocked(owner) != selection) throw SelectionFailure("ERR_SELECTION_STORAGE")
  }
}
