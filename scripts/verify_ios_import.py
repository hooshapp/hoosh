"""Verify the preserved import without cloud access, dependencies, or source secrets."""
from pathlib import Path
import hashlib
import json
import sys

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'apps/mobile/ios/import-manifest.json').read_text())
failures = []
for entry in manifest['files']:
    path = root / entry['destination']
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
        failures.append(entry['destination'])
if failures:
    print('Changed or missing source paths: ' + ', '.join(failures), file=sys.stderr)
    raise SystemExit(1)
print(f"Verified {len(manifest['files'])} retained source/configuration files against {manifest['source_commit'][:7]}.")
