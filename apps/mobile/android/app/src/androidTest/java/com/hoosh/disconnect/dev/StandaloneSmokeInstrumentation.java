package com.hoosh.disconnect.dev;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Bundle;
import android.security.NetworkSecurityPolicy;
import java.io.DataInputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipFile;

/** Test APK only; plain Java deliberately avoids a dependency on the target's R8-renamed Kotlin.
 * Exact class names come from this release's local R8 mapping. Never keep test APIs in the app.
 * All checks are read-only: no account, inventory, permission grant or native configuration write.
 */
public final class StandaloneSmokeInstrumentation extends Instrumentation {
  private Bundle input;
  private int count;
  private int currentCase;
  @Override public void onCreate(Bundle arguments) { super.onCreate(arguments); input = arguments; start(); }
  private void check(boolean condition) { if (!condition) throw new AssertionError(); }
  private void next() { currentCase = ++count; }
  @Override public void onStart() {
    Bundle result = new Bundle();
    try {
      Context context = getTargetContext();
      next();
      check(context.getPackageName().equals("com.hoosh.disconnect.dev"));
      check((context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) == 0);
      PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_INSTRUMENTATION);
      check(packageInfo.instrumentation == null || packageInfo.instrumentation.length == 0);
      next();
      try (ZipFile zip = new ZipFile(context.getApplicationInfo().sourceDir)) {
        byte[] magic = new byte[8];
        try (DataInputStream stream = new DataInputStream(zip.getInputStream(zip.getEntry("assets/index.android.bundle")))) { stream.readFully(magic); }
        check(Arrays.equals(magic, new byte[] {(byte)0xc6, 0x1f, (byte)0xbc, 0x03, (byte)0xc1, 0x03, 0x19, 0x1f}));
        check(zip.stream().anyMatch(entry -> entry.getName().endsWith(".ttf") || entry.getName().endsWith(".otf")));
      }
      next();
      NetworkSecurityPolicy network = NetworkSecurityPolicy.getInstance();
      check(network.isCleartextTrafficPermitted("127.0.0.1") && network.isCleartextTrafficPermitted("localhost"));
      check(!network.isCleartextTrafficPermitted("example.invalid"));
      next();
      ClassLoader loader = context.getClassLoader();
      Class<?> provider = loader.loadClass(input.getString("provider"));
      Class<?> usage = loader.loadClass(input.getString("usage"));
      Class<?> definitionType = loader.loadClass(input.getString("definition"));
      Class<?> secureStore = loader.loadClass(input.getString("securestore"));
      Class<?> fonts = loader.loadClass(input.getString("fonts"));
      Set<Object> registered = new HashSet<>();
      for (Field field : provider.getDeclaredFields()) {
        if (Modifier.isStatic(field.getModifiers()) && Map.class.isAssignableFrom(field.getType())) {
          field.setAccessible(true); registered.addAll(((Map<?, ?>)field.get(null)).keySet());
        }
      }
      check(registered.contains(usage) && registered.contains(secureStore) && registered.contains(fonts));
      next();
      Object module = usage.getDeclaredConstructor().newInstance();
      Object definition = null;
      for (Method method : usage.getDeclaredMethods()) {
        if (method.getParameterTypes().length == 0 && method.getReturnType() == definitionType) {
          check(definition == null); method.setAccessible(true); definition = method.invoke(module);
        }
      }
      check(definition != null);
      Set<Object> functions = new HashSet<>();
      boolean named = false;
      for (Field field : definitionType.getDeclaredFields()) {
        field.setAccessible(true);
        if (field.getType() == String.class && "HooshUsage".equals(field.get(definition))) named = true;
        if (Map.class.isAssignableFrom(field.getType()) && field.get(definition) instanceof Map) functions.addAll(((Map<?, ?>)field.get(definition)).keySet());
      }
      check(named && functions.containsAll(Arrays.asList("getAuthorization", "getCapabilities", "getStatus", "scheduleRead", "schedulePreview", "scheduleApply", "questRead", "questApply", "questCancel", "selectionBegin", "selectionPick", "selectionCommit", "selectionRead", "interventionClaimOwner", "interventionProtectionRead", "historyRead", "historyStart", "rewardsRead", "rewardsAck")));
      for (String forbidden : Arrays.asList("previewPickApps", "interventionInstall", "interventionInterruptFeedback", "interventionRemoveHostTask")) check(!functions.contains(forbidden));
      next();
      PackageInfo info = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_SERVICES | PackageManager.GET_PERMISSIONS);
      boolean service = false;
      for (ServiceInfo candidate : info.services == null ? new ServiceInfo[0] : info.services) {
        if (candidate.name.equals("expo.modules.hooshusage.InterventionAccessibilityService") && "android.permission.BIND_ACCESSIBILITY_SERVICE".equals(candidate.permission)) service = true;
      }
      Set<String> permissions = new HashSet<>(Arrays.asList(info.requestedPermissions == null ? new String[0] : info.requestedPermissions));
      check(service && permissions.contains("android.permission.PACKAGE_USAGE_STATS"));
      for (String forbidden : Arrays.asList("android.permission.QUERY_ALL_PACKAGES", "android.permission.SYSTEM_ALERT_WINDOW", "android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE")) check(!permissions.contains(forbidden));
      result.putInt("standaloneChecksPassed", count);
      finish(Activity.RESULT_OK, result);
    } catch (Throwable ignored) {
      result.putString("standaloneChecks", "failed"); result.putInt("standaloneFailedCase", currentCase);
      finish(Activity.RESULT_CANCELED, result);
    }
  }
}
