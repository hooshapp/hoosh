package expo.modules.hooshusage

import android.app.Activity
import expo.modules.kotlin.Promise

/** Preview-only boundary; no package identities or durable/account selection API. */
interface SelectionPreview {
  fun open(activity: Activity, owner: String, promise: Promise)
  fun summary(owner: String): Map<String, Int>
  fun release(owner: String)
  fun cancelPending()
  fun clear()
  fun dispose()
}
