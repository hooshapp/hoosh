package expo.modules.hooshusage

import android.content.Context

/** Release has no collector/dialog implementation or preview method registrations. */
internal object SelectionPreviewFactory {
  const val enabled = false
  fun create(context: Context): SelectionPreview? = null
  fun createEditor(context: Context): SelectionEditor? = null
  fun createIntervention(context: Context): InterventionCoordinator? = null
}
