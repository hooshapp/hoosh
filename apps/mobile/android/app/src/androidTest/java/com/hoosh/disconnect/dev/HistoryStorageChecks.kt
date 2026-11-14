package com.hoosh.disconnect.dev
import android.content.Context
import expo.modules.hooshusage.HistoryCollector
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import org.json.JSONObject

/** Generated owner only. Never enumerates/changes the user's History or app selections. */
internal object HistoryStorageChecks {
  fun run(context:Context):Int {
    val owner="qa-history:"+UUID.randomUUID().toString()
    val hash=MessageDigest.getInstance("SHA-256").digest(owner.toByteArray()).joinToString(""){"%02x".format(it.toInt() and 255)}
    val path=File(context.noBackupFilesDir,"history-v1/$hash.json")
    check(!path.exists());val collector=HistoryCollector(context);var count=0
    try {
      check(collector.read(owner)["state"]=="not_started");count++
      check(path.parentFile!!.isDirectory || path.parentFile!!.mkdirs())
      val valid=JSONObject().put("version",1).put("owner",owner).put("series_id",UUID.randomUUID().toString()).put("timezone_id","UTC").put("selected_count",1)
        .put("selection","0".repeat(64)).put("started_on","2026-11-01").put("days",org.json.JSONArray())
      for (corrupt in listOf("{broken",valid.toString().replace("\"version\":1","\"version\":1.5"),valid.toString().replace("\"selected_count\":1","\"selected_count\":true"),"x".repeat(32769))) {
        path.writeText(corrupt)
        var failed=false;try {collector.read(owner)} catch (_:Exception){failed=true};check(failed);count++
      }
      collector.erase(owner);check(!path.exists());count++
      return count
    } finally {collector.erase(owner);check(!path.exists())}
  }
}
