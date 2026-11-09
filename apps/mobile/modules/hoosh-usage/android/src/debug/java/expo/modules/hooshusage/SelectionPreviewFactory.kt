package expo.modules.hooshusage

import android.content.Context
import android.content.pm.ApplicationInfo

internal object SelectionPreviewFactory {
  const val enabled = true
  fun create(context: Context): SelectionPreview? =
    if (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0)
      NativeSelectionPreview(context.applicationContext)
    else null
  fun createEditor(context: Context): SelectionEditor? = if (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) NativeSelectionEditor(context.applicationContext) else null
}
