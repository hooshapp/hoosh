#!/usr/bin/env python3
"""Copy public client config from the ignored Expo .env into an ignored iOS resource.
Never copies service-role/secret keys, account passwords or bearer tokens.
"""
from pathlib import Path
import plistlib
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
values = {}
for line in (root / 'apps/mobile/.env').read_text().splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        name, value = line.split('=', 1)
        values[name.strip()] = value.strip().strip('\"\'')
url = values.get('EXPO_PUBLIC_SUPABASE_URL', '')
key = values.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
parts = urlsplit(url)
if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password or not key.startswith('sb_publishable_'):
    raise SystemExit('Valid HTTPS project URL and publishable client key are required. No values were copied.')
output = root / 'apps/mobile/ios/DisconnectApp/NativeSupabaseConfig.plist'
output.write_bytes(plistlib.dumps({'url': url, 'publishableKey': key}))
print('Configured native Supabase public client settings. The generated plist must remain ignored by Git.')
