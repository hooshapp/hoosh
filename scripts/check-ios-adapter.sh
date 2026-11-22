#!/bin/bash
# SDK construction + mutation-gate checks only; never physical enforcement proof.
set -euo pipefail
if [[ $# -ne 1 ]]; then
  echo 'Usage: scripts/check-ios-adapter.sh BOOTED_SIMULATOR_UUID' >&2
  exit 2
fi
cd "$(dirname "$0")/.."
hoosh_probe_dir="$(mktemp -d "${TMPDIR:-/tmp}/hoosh-ios-adapter.XXXXXX")"
trap 'rm -rf "$hoosh_probe_dir"' EXIT
hoosh_core=(
  apps/mobile/modules/hoosh-screen-time/ios/SharedProtectionStore.swift
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionSchedules.swift
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionSessions.swift
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionTransactions.swift
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionRuntimePlanner.swift
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionExpiryPlanner.swift
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionRuntimeCoordinator.swift
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionCommands.swift
)
for hoosh_check in RuntimePlannerChecks TransactionChecks RuntimeCoordinatorChecks CommandChecks StoreChecks; do
  swiftc "${hoosh_core[@]}" apps/mobile/modules/hoosh-screen-time/ios/ProtectionInstallation.swift \
    apps/mobile/modules/hoosh-screen-time/ios/SelectionTransactions.swift \
    "apps/mobile/modules/hoosh-screen-time/tests/$hoosh_check.swift" -o "$hoosh_probe_dir/$hoosh_check"
  "$hoosh_probe_dir/$hoosh_check"
done
swiftc "${hoosh_core[@]}" \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionDeviceClock.swift \
  apps/mobile/modules/hoosh-screen-time/tests/DeviceClockChecks.swift \
  -o "$hoosh_probe_dir/clock-checks"
"$hoosh_probe_dir/clock-checks"
hoosh_sim_sdk="$(xcrun --sdk iphonesimulator --show-sdk-path)"
hoosh_sim_arch="$(uname -m)"
xcrun swiftc -sdk "$hoosh_sim_sdk" -target "$hoosh_sim_arch-apple-ios16.4-simulator" \
  "${hoosh_core[@]}" \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionOSAdapter.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionDeviceClock.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionNativeDriver.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionNativeEngine.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionBridge.swift \
  apps/mobile/modules/hoosh-screen-time/tests/OSAdapterChecks.swift \
  -o "$hoosh_probe_dir/adapter-checks"
xcrun simctl spawn "$1" "$hoosh_probe_dir/adapter-checks"
