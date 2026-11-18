#!/bin/bash
set -eo pipefail

source "$SRCROOT/.xcode.env"
if [[ -f "$SRCROOT/.xcode.env.local" ]]; then
  source "$SRCROOT/.xcode.env.local"
fi

if [[ "$CONFIGURATION" == *Debug* ]]; then
  export SKIP_BUNDLING=1
else
  unset SKIP_BUNDLING
fi

export PROJECT_ROOT="$(cd "$SRCROOT/.." && pwd)"
cd "$PROJECT_ROOT"
export ENTRY_FILE="$("$NODE_BINARY" -e "require('expo/scripts/resolveAppEntry')" "$PROJECT_ROOT" ios absolute | tail -n 1)"
export CLI_PATH="$("$NODE_BINARY" --print "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })")"
export BUNDLE_COMMAND=export:embed
build_script="$("$NODE_BINARY" --print "require('path').join(require('path').dirname(require.resolve('react-native/package.json')), 'scripts/react-native-xcode.sh')")"
exec /bin/bash "$build_script"
