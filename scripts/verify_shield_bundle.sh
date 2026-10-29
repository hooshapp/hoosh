#!/usr/bin/env bash
set -euo pipefail

app_path="${1:-}"

if [[ -z "$app_path" ]]; then
  echo "Usage: scripts/verify_shield_bundle.sh /path/to/DisconnectApp.app"
  echo
  echo "Tip: after an Xcode device build, the app is usually under:"
  echo "  ~/Library/Developer/Xcode/DerivedData/.../Build/Products/Debug-iphoneos/DisconnectApp.app"
  exit 2
fi

if [[ ! -d "$app_path" ]]; then
  echo "FAIL: app bundle not found: $app_path"
  exit 1
fi

plug_ins="$app_path/PlugIns"
if [[ ! -d "$plug_ins" ]]; then
  echo "FAIL: app bundle has no PlugIns directory: $plug_ins"
  exit 1
fi

failures=0

check_extension() {
  local appex_name="$1"
  local bundle_id="$2"
  local extension_point="$3"
  local principal_class="$4"
  local entitlements_substring="$5"
  local appex="$plug_ins/$appex_name.appex"
  local info="$appex/Info.plist"

  echo "Checking $appex_name..."

  if [[ ! -d "$appex" ]]; then
    echo "  FAIL: missing $appex"
    failures=$((failures + 1))
    return
  fi

  if [[ ! -f "$info" ]]; then
    echo "  FAIL: missing Info.plist"
    failures=$((failures + 1))
    return
  fi

  local actual_bundle_id
  actual_bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$info" 2>/dev/null || true)"
  if [[ "$actual_bundle_id" != "$bundle_id" ]]; then
    echo "  FAIL: bundle id is '$actual_bundle_id', expected '$bundle_id'"
    failures=$((failures + 1))
  else
    echo "  OK bundle id: $actual_bundle_id"
  fi

  local bundle_name
  bundle_name="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleName' "$info" 2>/dev/null || true)"
  if [[ -z "$bundle_name" ]]; then
    echo "  FAIL: CFBundleName is empty"
    failures=$((failures + 1))
  else
    echo "  OK CFBundleName: $bundle_name"
  fi

  local actual_extension_point
  actual_extension_point="$(/usr/libexec/PlistBuddy -c 'Print :NSExtension:NSExtensionPointIdentifier' "$info" 2>/dev/null || /usr/libexec/PlistBuddy -c 'Print :EXAppExtensionAttributes:EXExtensionPointIdentifier' "$info" 2>/dev/null || true)"
  if [[ "$actual_extension_point" != "$extension_point" ]]; then
    echo "  FAIL: extension point is '$actual_extension_point', expected '$extension_point'"
    failures=$((failures + 1))
  else
    echo "  OK extension point: $actual_extension_point"
  fi

  if [[ -n "$principal_class" ]]; then
    local actual_principal_class
    actual_principal_class="$(/usr/libexec/PlistBuddy -c 'Print :NSExtension:NSExtensionPrincipalClass' "$info" 2>/dev/null || true)"
    if [[ "$actual_principal_class" != "$principal_class" ]]; then
      echo "  FAIL: principal class is '$actual_principal_class', expected '$principal_class'"
      failures=$((failures + 1))
    else
      echo "  OK principal class: $actual_principal_class"
    fi
  fi

  if ! codesign -d --entitlements :- "$appex" 2>/dev/null | grep -q "$entitlements_substring"; then
    echo "  FAIL: signed entitlements do not include $entitlements_substring"
    failures=$((failures + 1))
  else
    echo "  OK entitlement includes: $entitlements_substring"
  fi
}

check_extension \
  "DisconnectShieldConfigurationExtension" \
  "com.AnishaDasgupta.DisconnectApp.DisconnectShieldConfigurationExtension" \
  "com.apple.ManagedSettingsUI.shield-configuration-service" \
  "DisconnectShieldConfigurationExtension.ShieldConfigurationExtension" \
  "com.apple.developer.family-controls"

check_extension \
  "DisconnectShieldActionExtension" \
  "com.AnishaDasgupta.DisconnectApp.DisconnectShieldActionExtension" \
  "com.apple.ManagedSettings.shield-action-service" \
  "DisconnectShieldActionExtension.ShieldActionExtension" \
  "com.apple.developer.family-controls"

check_extension \
  "DisconnectDeviceActivityMonitorExtension" \
  "com.AnishaDasgupta.DisconnectApp.DisconnectDeviceActivityMonitorExtension" \
  "com.apple.deviceactivity.monitor-extension" \
  "DisconnectDeviceActivityMonitorExtension.DeviceActivityMonitorExtension" \
  "com.apple.developer.family-controls"

if [[ "$failures" -gt 0 ]]; then
  echo
  echo "FAIL: $failures shield bundle check(s) failed."
  exit 1
fi

echo
echo "PASS: shield/action/monitor extensions are embedded and signed in this app bundle."
