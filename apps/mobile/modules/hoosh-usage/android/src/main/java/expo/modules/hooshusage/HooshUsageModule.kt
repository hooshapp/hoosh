package expo.modules.hooshusage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues

class HooshUsageModule : Module() {
  private fun reader() = UsageReader(requireNotNull(appContext.reactContext) { "Context unavailable" })
  override fun definition() = ModuleDefinition {
    Name("HooshUsage")
    AsyncFunction("probe") { minutes: Int -> reader().probe(minutes) }
    AsyncFunction("getAuthorization") { reader().authorization() }
    AsyncFunction("getCapabilities") { reader().capabilities() }
    AsyncFunction("getStatus") { reader().status() }
    AsyncFunction("openUsageAccess") { reader().openUsageAccess() }.runOnQueue(Queues.MAIN)
  }
}
