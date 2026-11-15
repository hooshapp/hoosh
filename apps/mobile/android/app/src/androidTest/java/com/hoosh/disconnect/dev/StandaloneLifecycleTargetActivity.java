package com.hoosh.disconnect.dev;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

/** Separate test APK target; plain Android Java also runs beside an R8 Kotlin app. */
public final class StandaloneLifecycleTargetActivity extends Activity {
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    TextView label = new TextView(this);
    label.setText("Standalone lifecycle target\nSynthetic test app only");
    label.setTextSize(24);
    label.setPadding(40, 100, 40, 40);
    setContentView(label);
  }
}
