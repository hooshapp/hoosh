"""Inspect a built shared .app without installing it or exposing signing profiles."""

import argparse
import hashlib
import json
import plistlib
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HOST = "com.AnishaDasgupta.DisconnectApp"
GROUP = "group.com.AnishaDasgupta.DisconnectApp"
EXTENSIONS = {
    "Disconnect": "com.apple.deviceactivityui.report-extension",
    "DisconnectDeviceActivityMonitorExtension": "com.apple.deviceactivity.monitor-extension",
    "DisconnectShieldActionExtension": "com.apple.ManagedSettings.shield-action-service",
    "DisconnectShieldConfigurationExtension": "com.apple.ManagedSettingsUI.shield-configuration-service",
}


def command(*args):
    result = subprocess.run(args, capture_output=True, check=False)
    if result.returncode:
        raise ValueError(
            "Apple tool verification failed; inspect the local build/signing separately."
        )
    return result.stdout


def entitlements(path):
    data = command("/usr/bin/codesign", "-d", "--entitlements", ":-", str(path))
    return plistlib.loads(data) if data.strip() else {}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect(app, require_device=False):
    info = plistlib.loads((app / "Info.plist").read_bytes())
    if (
        info.get("CFBundleIdentifier") != HOST
        or info.get("CFBundleDisplayName") != "Hoosh"
    ):
        raise ValueError("Unexpected shared host identity/display name.")
    platform = info.get("DTPlatformName")
    if (
        platform not in ("iphoneos", "iphonesimulator")
        or require_device
        and platform != "iphoneos"
    ):
        raise ValueError(
            "A simulator product cannot pass physical-device packaging acceptance."
        )
    schemes = [
        s
        for entry in info.get("CFBundleURLTypes", [])
        for s in entry.get("CFBundleURLSchemes", [])
    ]
    if "disconnect-dev" not in schemes:
        raise ValueError("Expected development Auth callback scheme is missing.")
    scenes = info.get("UIApplicationSceneManifest", {}).get("UISceneConfigurations", {})
    if not any(
        c.get("UISceneDelegateClassName", "").endswith(".SceneDelegate")
        for group in scenes.values()
        for c in group
    ):
        raise ValueError("Shared Expo scene configuration is missing.")
    if info.get("NSAppTransportSecurity", {}).get("NSAllowsArbitraryLoads"):
        raise ValueError("Unrestricted network transport is not accepted.")
    bundle = app / "main.jsbundle"
    if not bundle.is_file() or bundle.stat().st_size < 1024:
        raise ValueError(
            "Embedded JavaScript is missing; a Metro-dependent build is not standalone."
        )
    js = bundle.read_bytes()
    markers = (
        "HOOSH_PLAN_DESIGN_REVIEW_ONLY",
        "RN10_NATIVE_QA_ONLY",
        "RN09_APP_JOURNEY_QA_ONLY",
        "RN08_INTERVENTION_QA_ONLY",
        "RN08_WEEKLY_SCHEDULE_QA_ONLY",
        "RN05_ACCOUNT_SPECIMEN_ONLY",
        "disconnect-ui-specimens",
        "RN-01 component specimen",
    )
    if any(marker.encode() in js for marker in markers) or re.search(
        rb"RN[0-9][0-9A-Z_]*_ONLY", js
    ):
        raise ValueError("A developer preview entry leaked into the packaged app.")
    private_names = {"NativeSupabaseConfig.plist", "GoogleService-Info.plist"}
    if any(p.name in private_names for p in app.rglob("*")):
        raise ValueError(
            "Pilot private configuration was included in the shared product."
        )
    executable = app / info["CFBundleExecutable"]
    native = executable.read_bytes()
    if b"HooshScreenTimeModule" not in native or b"ExpoModulesProvider" not in native:
        raise ValueError("Shared Expo/native Screen Time registration was not found.")
    if b"DisconnectAppApp" in native:
        raise ValueError(
            "The pilot SwiftUI app entry was included in the shared executable."
        )
    products = [(app, HOST, True)]
    found = list(app.glob("PlugIns/*.appex")) + list(app.glob("Extensions/*.appex"))
    if len(found) != len(EXTENSIONS):
        raise ValueError("Expected exactly four embedded Screen Time extensions.")
    remaining = set(EXTENSIONS)
    for extension in found:
        item = plistlib.loads((extension / "Info.plist").read_bytes())
        name = item.get("CFBundleIdentifier", "").removeprefix(HOST + ".")
        if name not in remaining:
            raise ValueError("Unexpected or duplicate embedded extension identity.")
        remaining.remove(name)
        point = item.get("NSExtension", {}).get("NSExtensionPointIdentifier")
        point = point or item.get("EXAppExtensionAttributes", {}).get(
            "EXExtensionPointIdentifier"
        )
        if point != EXTENSIONS[name]:
            raise ValueError("Unexpected Screen Time extension point.")
        products.append((extension, HOST + "." + name, name != "Disconnect"))
    signing = []
    host_team = None
    for path, identifier, requires_controls in products:
        command("/usr/bin/codesign", "--verify", "--deep", "--strict", str(path))
        values = entitlements(path)
        checks = {
            "bundle_id": identifier,
            "signature_valid": True,
            "family_controls": values.get("com.apple.developer.family-controls")
            is True,
            "app_group": GROUP
            in values.get("com.apple.security.application-groups", []),
            "apple_sign_in": "Default"
            in values.get("com.apple.developer.applesignin", []),
            "provisioning_verified": False,
        }
        if platform == "iphoneos":
            profile = plistlib.loads(
                command(
                    "/usr/bin/security",
                    "cms",
                    "-D",
                    "-i",
                    str(path / "embedded.mobileprovision"),
                )
            )
            approved = profile.get("Entitlements", {})
            expires = profile.get("ExpirationDate")
            if not expires or expires.replace(tzinfo=timezone.utc) <= datetime.now(
                timezone.utc
            ):
                raise ValueError("A provisioning profile is missing or expired.")
            team = values.get("com.apple.developer.team-identifier")
            if path == app:
                host_team = team
            if (
                not team
                or team != host_team
                or team not in profile.get("TeamIdentifier", [])
            ):
                raise ValueError(
                    "Host/extension signing teams do not match the provisioning profile."
                )
            actual_id = values.get("application-identifier", "")
            profile_id = approved.get("application-identifier", "")
            if not actual_id.endswith("." + identifier) or profile_id not in (
                actual_id,
                actual_id.split(".")[0] + ".*",
            ):
                raise ValueError(
                    "Profile and signed application identifiers do not match."
                )
            if requires_controls and not (
                checks["family_controls"]
                and checks["app_group"]
                and approved.get("com.apple.developer.family-controls") is True
                and GROUP in approved.get("com.apple.security.application-groups", [])
            ):
                raise ValueError("Signed Screen Time entitlements are not provisioned.")
            if path == app and not (
                checks["apple_sign_in"]
                and "Default" in approved.get("com.apple.developer.applesignin", [])
            ):
                raise ValueError("Sign in with Apple is not provisioned for the host.")
            checks["provisioning_verified"] = True
        signing.append(checks)
    tree = hashlib.sha256()
    files = [p for p in app.rglob("*") if p.is_file()]
    for path in sorted(files):
        tree.update(
            str(path.relative_to(app)).encode() + b"\0" + bytes.fromhex(digest(path))
        )
    return {
        "schema_version": 1,
        "platform": platform,
        "acceptance": "packaging_only_not_device_behavior",
        "physical_journey_verified": False,
        "embedded_js_sha256": digest(bundle),
        "hermes_bytecode": js[:8] == bytes.fromhex("c61fbc03c103191f"),
        "product_tree_sha256": tree.hexdigest(),
        "file_count": len(files),
        "callback_scheme_present": True,
        "native_module_registration_present": True,
        "developer_preview_markers_absent": True,
        "pilot_configuration_absent": True,
        "signing": signing,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("app", type=Path)
    parser.add_argument("--require-device", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        result = inspect(args.app.resolve(), args.require_device)
    except (ValueError, KeyError, OSError, plistlib.InvalidFileException):
        parser.exit(
            1,
            "iOS product inspection failed. Check bundle identity, embedded JS, extensions and local signing. No device acceptance was granted.\n",
        )
    rendered = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered)
    print(rendered, end="")


if __name__ == "__main__":
    main()
