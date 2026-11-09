package expo.modules.hooshusage

import android.app.Activity
import expo.modules.kotlin.Promise

/** Explicit owner/draft transaction port; current implementation is debug-only. */
interface SelectionEditor {
  fun begin(owner: String, promise: Promise)
  fun pick(activity: Activity, owner: String, draft: String, version: Int, promise: Promise)
  fun commit(owner: String, draft: String, version: Int, promise: Promise)
  fun release(owner: String, draft: String, promise: Promise)
  fun cancelPicker()
  fun clearDrafts()
  fun dispose()
}
