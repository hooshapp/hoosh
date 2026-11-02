#!/usr/bin/env python3
"""Sign in a development test user and copy only its access token locally."""
import base64
import getpass
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENV = Path(__file__).resolve().parents[1] / 'apps/mobile/.env'
PROJECT = 'https://eaisvwqfbgdkzdfmxkvm.supabase.co'


def public_config():
    values = {}
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            if key in ('EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'):
                values[key] = value.strip().strip('"\'')
    if values.get('EXPO_PUBLIC_SUPABASE_URL', '').rstrip('/') != PROJECT:
        raise ValueError('The local configuration does not point to the expected development project.')
    key = values.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    if not key or key.startswith('sb_secret_'):
        raise ValueError('A publishable client key is required; do not use a secret key.')
    if key.count('.') == 2:
        try:
            payload = key.split('.')[1]
            role = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4))).get('role')
        except (ValueError, UnicodeDecodeError):
            raise ValueError('The configured key is not a valid public client key.') from None
        if role != 'anon':
            raise ValueError('Use the public anon key, not an elevated key.')
    return key


def main():
    key = public_config()
    email = input('Test account email: ').strip()
    password = getpass.getpass('Test account password (hidden): ')
    body = json.dumps({'email': email, 'password': password}).encode()
    req = urllib.request.Request(PROJECT + '/auth/v1/token?grant_type=password', data=body,
        headers={'apikey': key, 'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            session = json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'Sign-in failed (HTTP {error.code}); check the account and confirmation status.') from None
    token = session.get('access_token')
    if not isinstance(token, str) or not token:
        raise RuntimeError('No access token was returned.')
    subprocess.run(['pbcopy'], input=token.encode(), check=True)
    print('Access token copied to clipboard. Share it privately with the intended tester; it expires.')
    print('After sharing, clear your clipboard if it is no longer needed.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, RuntimeError, urllib.error.URLError) as exc:
        print(f'Unable to copy token: {exc}', file=sys.stderr)
        sys.exit(1)
