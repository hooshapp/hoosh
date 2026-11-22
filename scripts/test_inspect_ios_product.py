"""Fault checks for the packaged-product inspector; fixtures are not signing proof."""

import importlib.util
import plistlib
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "inspector", Path(__file__).with_name("inspect-ios-product.py")
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ProductFaultChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.app = Path(self.temp.name) / "Fixture.app"
        self.app.mkdir()
        self.info = {
            "CFBundleIdentifier": module.HOST,
            "CFBundleDisplayName": "Hoosh",
            "CFBundleExecutable": "Host",
            "DTPlatformName": "iphonesimulator",
            "CFBundleURLTypes": [{"CFBundleURLSchemes": ["disconnect-dev"]}],
            "UIApplicationSceneManifest": {
                "UISceneConfigurations": {
                    "window": [{"UISceneDelegateClassName": "Fixture.SceneDelegate"}]
                }
            },
        }
        self.write_info()
        (self.app / "Host").write_bytes(b"HooshScreenTimeModule ExpoModulesProvider")
        (self.app / "main.jsbundle").write_bytes(
            bytes.fromhex("c61fbc03c103191f") + b"_" * 2048
        )
        for name, point in module.EXTENSIONS.items():
            directory = (
                self.app
                / ("Extensions" if name == "Disconnect" else "PlugIns")
                / (name + ".appex")
            )
            directory.mkdir(parents=True)
            (directory / "Info.plist").write_bytes(
                plistlib.dumps(
                    {
                        "CFBundleIdentifier": module.HOST + "." + name,
                        "NSExtension": {"NSExtensionPointIdentifier": point},
                    }
                )
            )

    def write_info(self):
        (self.app / "Info.plist").write_bytes(plistlib.dumps(self.info))

    @patch.object(module, "command", return_value=b"")
    def test_inspection_is_only_packaging_and_never_device_acceptance(self, command):
        result = module.inspect(self.app)
        self.assertTrue(result["hermes_bytecode"])
        self.assertFalse(result["physical_journey_verified"])
        self.assertEqual(len(result["signing"]), 5)
        self.assertTrue(all(not v["provisioning_verified"] for v in result["signing"]))
        with self.assertRaises(ValueError):
            module.inspect(self.app, require_device=True)

    @patch.object(module, "command", return_value=b"")
    def test_debug_or_preview_bundle_is_refused(self, command):
        (self.app / "main.jsbundle").unlink()
        with self.assertRaises(ValueError):
            module.inspect(self.app)
        (self.app / "main.jsbundle").write_bytes(
            b"_" * 2048 + b"HOOSH_PLAN_DESIGN_REVIEW_ONLY"
        )
        with self.assertRaises(ValueError):
            module.inspect(self.app)

    @patch.object(module, "command", return_value=b"")
    def test_pilot_configuration_and_entry_are_refused(self, command):
        private = self.app / "NativeSupabaseConfig.plist"
        private.write_bytes(b"fixture")
        with self.assertRaises(ValueError):
            module.inspect(self.app)
        private.unlink()
        (self.app / "Host").write_bytes(
            b"HooshScreenTimeModule ExpoModulesProvider DisconnectAppApp"
        )
        with self.assertRaises(ValueError):
            module.inspect(self.app)

    @patch.object(module, "command", return_value=b"")
    def test_extension_and_callback_mismatches_are_refused(self, command):
        self.info["CFBundleURLTypes"] = []
        self.write_info()
        with self.assertRaises(ValueError):
            module.inspect(self.app)
        self.info["CFBundleURLTypes"] = [{"CFBundleURLSchemes": ["disconnect-dev"]}]
        self.write_info()
        next(self.app.glob("PlugIns/*.appex/Info.plist")).write_bytes(
            plistlib.dumps({"CFBundleIdentifier": "wrong"})
        )
        with self.assertRaises(ValueError):
            module.inspect(self.app)

    @patch.object(module, "command", side_effect=ValueError("Invalid signature"))
    def test_invalid_signature_is_not_a_passing_report(self, command):
        with self.assertRaises(ValueError):
            module.inspect(self.app)

    def device_tools(self, *args):
        path = Path(args[-1])
        if args[0] == "/usr/bin/codesign" and "-d" in args:
            identifier = plistlib.loads((path / "Info.plist").read_bytes())[
                "CFBundleIdentifier"
            ]
            return plistlib.dumps(
                {
                    "application-identifier": "TEAM." + identifier,
                    "com.apple.developer.team-identifier": "TEAM",
                    "com.apple.developer.family-controls": True,
                    "com.apple.security.application-groups": [module.GROUP],
                    "com.apple.developer.applesignin": ["Default"],
                }
            )
        if args[0] == "/usr/bin/security":
            identifier = plistlib.loads((path.parent / "Info.plist").read_bytes())[
                "CFBundleIdentifier"
            ]
            return plistlib.dumps(
                {
                    "ExpirationDate": datetime(2099, 1, 1),
                    "TeamIdentifier": ["TEAM"],
                    "Entitlements": {
                        "application-identifier": "TEAM." + identifier,
                        "com.apple.developer.family-controls": True,
                        "com.apple.security.application-groups": [module.GROUP],
                        "com.apple.developer.applesignin": ["Default"],
                    },
                }
            )
        return b""

    def test_matching_device_profiles_still_do_not_prove_behavior(self):
        self.info["DTPlatformName"] = "iphoneos"
        self.write_info()
        with patch.object(module, "command", side_effect=self.device_tools):
            result = module.inspect(self.app, require_device=True)
        self.assertTrue(all(v["provisioning_verified"] for v in result["signing"]))
        self.assertFalse(result["physical_journey_verified"])

    def test_expired_foreign_or_unentitled_device_profiles_are_refused(self):
        self.info["DTPlatformName"] = "iphoneos"
        self.write_info()
        for fault in ("expired", "team", "group", "family", "apple"):

            def tool(*args, fault=fault):
                data = self.device_tools(*args)
                if args[0] == "/usr/bin/security":
                    profile = plistlib.loads(data)
                    if fault == "expired":
                        profile["ExpirationDate"] = datetime(2000, 1, 1)
                    elif fault == "team":
                        profile["TeamIdentifier"] = ["OTHER"]
                    else:
                        key = {
                            "group": "com.apple.security.application-groups",
                            "family": "com.apple.developer.family-controls",
                            "apple": "com.apple.developer.applesignin",
                        }[fault]
                        profile["Entitlements"].pop(key)
                    return plistlib.dumps(profile)
                return data

            with (
                self.subTest(fault=fault),
                patch.object(module, "command", side_effect=tool),
                self.assertRaises(ValueError),
            ):
                module.inspect(self.app, require_device=True)


if __name__ == "__main__":
    unittest.main()
