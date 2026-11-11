package com.hoosh.disconnect.dev

import android.content.Context
import android.content.ContextWrapper
import android.content.pm.ActivityInfo
import android.content.pm.ApplicationInfo
import android.content.pm.ResolveInfo
import android.graphics.drawable.ColorDrawable
import android.os.Process

/** Synthetic cases run on Android; they neither query nor expose the owner's app catalog. */
internal object SelectionDiscoveryProbeChecks {
  fun run(context: Context): Int {
    fun candidate(name: String, enabled: Boolean = true, exported: Boolean = true) = ResolveInfo().apply {
      activityInfo = ActivityInfo().apply {
        packageName = name
        this.enabled = enabled
        this.exported = exported
        applicationInfo = ApplicationInfo().apply { uid = Process.myUid(); this.enabled = true }
      }
    }
    fun probe(
      rows: List<ResolveInfo> = emptyList(),
      unlocked: () -> Boolean? = { true },
      limit: Int = 64,
    ) = SelectionDiscoveryProbe(
      context, query = { rows }, label = { "Synthetic private label" },
      icon = { ColorDrawable(0) }, unlocked = unlocked, resourceLimit = limit, manifest = { ProbeManifestSafety(false, false, false) },
    ).read()
    fun hidden(result: Map<String, Any?>, state: String) {
      check(result["state"] == state)
      check(SelectionDiscoveryProbe.COUNT_KEYS.all { result[it] == null })
    }

    val empty = probe()
    check(empty["state"] == "ready" && empty["uniquePackageCount"] == 0)
    val alpha = candidate("synthetic.alpha")
    val beta = candidate("synthetic.beta")
    val filtered = probe(listOf(
      alpha, alpha, beta, candidate(context.packageName),
      candidate("synthetic.disabled", enabled = false),
      candidate("synthetic.internal", exported = false), ResolveInfo(),
    ))
    check(filtered["uniquePackageCount"] == 2 && filtered["duplicateActivityCount"] == 1)
    check(filtered["selfActivityCount"] == 1 && filtered["excludedActivityCount"] == 3)
    check(filtered["labelResolutionSuccessCount"] == 2 && filtered["iconResolutionSuccessCount"] == 2)
    check(!filtered.toString().contains("synthetic") && !filtered.toString().contains("private label"))

    val capped = probe(listOf(alpha, beta), limit = 1)
    check(capped["uniquePackageCount"] == 2 && capped["sampledPackageCount"] == 1)
    check(capped["resourceChecksCapped"] == true)
    val failures = SelectionDiscoveryProbe(
      context, query = { listOf(alpha, beta) },
      label = { if (it === alpha) " " else throw IllegalStateException("synthetic private error") },
      icon = { throw IllegalStateException("synthetic private icon") }, unlocked = { true }, manifest = { ProbeManifestSafety(false, false, false) },
    ).read()
    check(failures["state"] == "ready" && failures["labelResolutionFailureCount"] == 2)
    check(failures["blankLabelCount"] == 1 && failures["iconResolutionFailureCount"] == 2)
    check(!failures.toString().contains("synthetic"))

    hidden(probe(listOf(alpha), unlocked = { false }), "locked")
    hidden(probe(listOf(alpha), unlocked = { null }), "unavailable")
    var reads = 0
    hidden(probe(listOf(alpha), unlocked = { ++reads == 1 }), "locked")
    val denied = SelectionDiscoveryProbe(
      context, query = { throw SecurityException("synthetic package identity") }, unlocked = { true }, manifest = { ProbeManifestSafety(false, false, false) },
    ).read()
    hidden(denied, "unavailable")
    check(denied["failureCode"] == "query_denied" && !denied.toString().contains("synthetic"))
    val wrongContext = object : ContextWrapper(context) {
      override fun getApplicationInfo() = ApplicationInfo(context.applicationInfo).apply { uid++ }
    }
    val wrongUid = SelectionDiscoveryProbe(wrongContext, query = { error("must not query") }).read()
    hidden(wrongUid, "error")
    check(wrongUid["failureCode"] == "wrong_context" && wrongUid["targetUidVerified"] == false)
    val nonDebug = object : ContextWrapper(context) {
      override fun getApplicationInfo() = ApplicationInfo(context.applicationInfo).apply {
        flags = flags and ApplicationInfo.FLAG_DEBUGGABLE.inv()
      }
    }
    val refused = SelectionDiscoveryProbe(nonDebug, query = { error("must not query") }).read()
    hidden(refused, "error")
    check(refused["failureCode"] == "not_debuggable")
    val unsafe = SelectionDiscoveryProbe(context, query = { error("must not query unsafe manifest") },
      manifest = { ProbeManifestSafety(false, false, true) }).read()
    hidden(unsafe, "error")
    check(unsafe["failureCode"] == "unsafe_manifest" && unsafe["accessibilityServiceDeclared"] == true)
    return 11
  }
}
