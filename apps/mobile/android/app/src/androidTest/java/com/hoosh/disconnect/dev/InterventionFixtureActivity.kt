package com.hoosh.disconnect.dev

import android.app.Activity
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/** Disposable target in the separate test APK; avoids inspecting or launching personal apps. */
class InterventionFixtureActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL; setPadding(48, 100, 48, 48)
      addView(TextView(this@InterventionFixtureActivity).apply { text = "Disconnect intervention test target"; textSize = 24f })
      addView(Button(this@InterventionFixtureActivity).apply {
        text = "Return to Hoosh"
        setOnClickListener { packageManager.getLaunchIntentForPackage("com.hoosh.disconnect.dev")?.let { startActivity(it) }; finish() }
      })
    })
  }
}
