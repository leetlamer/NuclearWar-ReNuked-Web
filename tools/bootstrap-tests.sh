#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 -m venv .toolchain/python
.toolchain/python/bin/python -m pip install 'cmake>=3.20' ninja
npx playwright install chromium
npm run build:test-wasm
