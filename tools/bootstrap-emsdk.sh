#!/bin/sh
# Toolchain files live entirely within this independent web project.
set -eu
cd "$(dirname "$0")/.."
if [ ! -d .toolchain/emsdk ]; then
  git clone --depth 1 https://github.com/emscripten-core/emsdk.git .toolchain/emsdk
fi
.toolchain/emsdk/emsdk install 4.0.23
.toolchain/emsdk/emsdk activate 4.0.23
