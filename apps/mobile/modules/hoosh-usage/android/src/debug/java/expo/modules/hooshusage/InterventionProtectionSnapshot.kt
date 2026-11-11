package expo.modules.hooshusage

/** One actor read, projected to the shared read contract. Never contains installed-app identities. */
object InterventionProtectionSnapshot {
  fun read(record: InterventionRecord?, authorized: Boolean, consented: Boolean, failed: Boolean, now: Long): Map<String, Any?> {
    val authorization = when { authorized -> "authorized"; consented -> "denied"; else -> "not_requested" }
    val active = record?.plan?.windows?.any { now >= it.startsAt && now < it.endsAt } == true
    val state = when { failed -> "failed"; !authorized -> "needs_permission"; active -> "active"; else -> "inactive" }
    return mapOf(
      "capabilities" to mapOf("platform" to "android", "selectionUI" to "unavailable", "mode" to "overlay",
        "supportsUsageThreshold" to false, "supportsScheduledRestriction" to true,
        "supportsTemporaryAllowance" to true, "supportsAdvanceWarning" to false, "supportsUsageSummary" to false),
      "authorization" to authorization,
      "status" to mapOf("authorization" to authorization, "state" to state,
        "installedRevision" to record?.plan?.revision, "installedReasonIds" to record?.plan?.windows.orEmpty().map { it.reasonId }),
    )
  }
}
