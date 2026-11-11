"""Run Android's actual pure controller tests on the JVM, without a connected phone.

No downloads or fake Android implementations. Run a native Gradle build once to
populate Kotlin's compiler cache, and supply JAVA_HOME if Java is not on PATH.
The six platform AtomicFile tests remain Android instrumentation, not JVM passes.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = (
    Path(os.environ.get("GRADLE_USER_HOME", str(Path.home() / ".gradle")))
    / "caches/modules-2/files-2.1"
)


def jar(group: str, artifact: str, *, optional: bool = False) -> Path | None:
    files = list((CACHE / group / artifact).glob("*/*/*.jar"))
    if not files:
        if optional:
            return None
        raise SystemExit("Kotlin cache missing. Run the Android Gradle build first.")
    return max(
        files,
        key=lambda p: tuple(int(n) for n in re.findall(r"\d+", p.parents[1].name)),
    )


def main() -> None:
    java_home = os.environ.get("JAVA_HOME")
    java = str(Path(java_home) / "bin/java") if java_home else shutil.which("java")
    if not java:
        raise SystemExit("Java missing. Set JAVA_HOME to the native build JDK.")
    stdlib = jar("org.jetbrains.kotlin", "kotlin-stdlib")
    compiler = jar("org.jetbrains.kotlin", "kotlin-compiler-embeddable")
    dependencies = [
        compiler,
        stdlib,
        jar("org.jetbrains.kotlin", "kotlin-reflect"),
        jar("org.jetbrains", "annotations"),
        jar("org.jetbrains.kotlinx", "kotlinx-coroutines-core-jvm"),
        jar("org.jetbrains.intellij.deps", "trove4j", optional=True),
    ]
    output = ROOT / "apps/mobile/.expo/intervention-jvm"
    output.mkdir(parents=True, exist_ok=True)
    entry = output / "InterventionCheckMain.kt"
    entry.write_text(
        "package com.hoosh.disconnect.dev\n"
        'fun main() { println("interventionEngineJvmCases=" + '
        "InterventionEngineChecks.run()) }\n"
    )
    source = (
        ROOT
        / "apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage"
    )
    tests = (
        ROOT
        / "apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/InterventionEngineChecks.kt"
    )
    classes = output / "classes"
    classes.mkdir(exist_ok=True)
    subprocess.run(
        [
            java,
            "-cp",
            os.pathsep.join(str(p) for p in dependencies if p),
            "org.jetbrains.kotlin.cli.jvm.K2JVMCompiler",
            "-no-stdlib",
            "-no-reflect",
            "-classpath",
            str(stdlib),
            "-d",
            str(classes),
            *(
                str(source / name)
                for name in [
                    "SelectionDrafts.kt",
                    "InterventionModel.kt",
                    "InterventionEngine.kt",
                    "InterventionLeases.kt",
                ]
            ),
            str(tests),
            str(entry),
        ],
        check=True,
        cwd=ROOT,
    )
    subprocess.run(
        [
            java,
            "-cp",
            str(classes) + os.pathsep + str(stdlib),
            "com.hoosh.disconnect.dev.InterventionCheckMainKt",
        ],
        check=True,
        cwd=ROOT,
    )


if __name__ == "__main__":
    main()
