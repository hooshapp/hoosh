package com.hoosh.disconnect.dev;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.AtomicFile;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

/** Test APK only. Seeds one synthetic installation on a fresh owned emulator.
 * Today's occurrence ends within 45 minutes; the weekly template recurs until
 * the disposable test AVD is cleaned up. It is not a self-expiring installation.
 * This deliberately bypasses account/Apply/disclosure UI: it tests the exact standalone
 * native service after setup, not those flows. Never invoke on a personal device.
 * No R8 reflection, production keep rule or diagnostic app entry is required.
 */
public final class StandaloneLifecycleFixture extends Instrumentation {
  private static final String OWNER = "qa-lifecycle:90000000-0000-4000-8000-000000000001";
  private static final String TARGET = "com.hoosh.disconnect.dev.test";
  private Bundle arguments;
  private int stage;

  @Override public void onCreate(Bundle input) {
    super.onCreate(input);
    arguments = input;
    start();
  }
  private void require(boolean condition) { if (!condition) throw new AssertionError(); }
  @Override public void onStart() {
    Bundle result = new Bundle();
    try {
      stage = 1;
      Context context = getTargetContext();
      require(arguments != null && "I_ACCEPT_SYNTHETIC_FIXTURE".equals(arguments.getString("ownedEmulator")));
      require(Build.HARDWARE.equals("ranchu") || Build.HARDWARE.equals("goldfish"));
      require(context.getPackageName().equals("com.hoosh.disconnect.dev"));
      require(getContext().getPackageName().equals(TARGET));
      require((context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) == 0);
      File directory = new File(context.getNoBackupFilesDir(), "intervention-debug-v1");
      File marker = new File(context.getNoBackupFilesDir(), "standalone-lifecycle-fixture-v1");
      // A saved native installation is never replaced, even if its owner looks synthetic.
      require(!directory.exists() && !marker.exists());
      require(marker.createNewFile());

      stage = 2;
      long now = System.currentTimeMillis();
      SimpleDateFormat time = new SimpleDateFormat("HH:mm", Locale.US);
      time.setTimeZone(TimeZone.getTimeZone("UTC"));
      String start = time.format(new Date(now - 5 * 60000L));
      String end = time.format(new Date(now + 45 * 60000L));
      JSONArray target = new JSONArray().put(TARGET);
      JSONObject weekly = new JSONObject().put("weekdays", new JSONArray("[0,1,2,3,4,5,6]"))
        .put("start", start).put("end", end).put("nextDay", end.compareTo(start) < 0)
        .put("timezone", "UTC").put("apps", target).put("enabled", true);
      JSONObject plan = new JSONObject().put("owner", OWNER).put("revision", 1).put("selectionRevision", 1)
        .put("apps", target).put("windows", new JSONArray()).put("weekly", weekly)
        .put("quests", new JSONArray()).put("questReceipts", new JSONObject()).put("questCancelled", new JSONArray())
        .put("policy", new JSONObject().put("timezone", "UTC").put("count", 3).put("seconds", 120));
      JSONObject rewards = new JSONObject().put("installation", "90000000-0000-4000-8000-000000000002")
        .put("next", 1).put("discarded", 0).put("day", JSONObject.NULL)
        .put("wall", 0).put("elapsed", 0).put("boot", -1).put("covered", false)
        .put("exhausted", false).put("events", new JSONArray());
      JSONObject state = new JSONObject().put("version", 4).put("plan", plan).put("rewards", rewards)
        .put("allowances", new JSONArray()).put("events", new JSONArray()).put("sessions", new JSONArray())
        .put("daily", new JSONArray()).put("discardedEventCount", 0);
      require(directory.mkdir());
      AtomicFile file = new AtomicFile(new File(directory, "state.json"));
      FileOutputStream stream = file.startWrite();
      try { stream.write(state.toString().getBytes(StandardCharsets.UTF_8)); file.finishWrite(stream); }
      catch (Throwable failure) { file.failWrite(stream); throw failure; }

      stage = 3;
      // Explicit synthetic consent fixture, not acceptance of the actual product disclosure.
      require(context.getSharedPreferences("intervention-disclosure-debug-v1", Context.MODE_PRIVATE)
        .edit().putBoolean("accepted-v2", true).commit());
      result.putString("standaloneLifecycleFixture", "prepared");
      result.putInt("fixtureSessionSeconds", 120);
      finish(Activity.RESULT_OK, result);
    } catch (Throwable failure) {
      result.putInt("standaloneLifecycleFixtureFailedStage", stage);
      finish(Activity.RESULT_CANCELED, result);
    }
  }
}
