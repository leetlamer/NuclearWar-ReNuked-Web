# Building and testing

## Requirements

Node.js 22.12 or newer, npm, Git and Python 3. Emscripten **4.0.23** is pinned for the
Wasm build. Native C++ and CMake 3.20+ are needed only for the regression harness.
The browser runtime does not require any compiler, Python, Amiga binary or native
SDL installation. WebGL2, WebAssembly, Canvas 2D and Web Audio are required.

```sh
npm install
sh tools/bootstrap-emsdk.sh
npm run build:wasm
npm run dev
npm run build               # recompiles Wasm, type-checks, builds static dist/
npm run preview
```

The local SDK is ignored under `.toolchain/emsdk`. Alternatively activate an
Emscripten 4.0.23 environment or set `EMXX` to em++. The direct build script requires
no CMake. It compiles local sources only, uses Emscripten's SDL2/libpng/zlib ports,
and packages this project's own assets at `/assets` in the virtual filesystem.

`npm run dev` serves existing Wasm outputs; after C++ changes run
`npm run build:wasm`. TypeScript and styles hot reload. Don't serve stale Wasm from
a previous source version. Missing engine files produce a visible loading error.

## Engine regression tests

Install CMake and a native C++17 toolchain, then:

```sh
npm test
```

This builds/runs the same ten portable suites natively and as Wasm in Node, then
compares all deterministic trace records to the frozen desktop digest and validates
copied game-source and asset hashes. The CMake build is in `wasm/CMakeLists.txt`.
Set `CMAKE` to an alternate executable and `EMSDK` to an alternate SDK root if needed.
The test runner also detects `.toolchain/python/bin/cmake` for a local Python venv.
For UBSan, configure a separate native tree with `-fsanitize=undefined` compiler and
linker flags. No original workspace is required to run these fixtures.

## Browser replay tests

```sh
npm run build:test-wasm
npx playwright install chromium
npm run test:browser
```

The developer-only Wasm replay executable is placed under `build/browser-engine`,
served by Vite in development. It contains the copied desktop deterministic replay
drivers; it is **not included in dist/**. `?testReplay=1` is honored only in Vite dev
mode. Normal production builds contain only the playable game.

Optional installed Chrome and Playwright WebKit checks:

```sh
npx playwright install webkit
npm run test:browsers
```

Firefox is separately configured (`npx playwright test --project=firefox`). Its
launcher failed to find its temporary profile on the test host; see the report.
WebKit tests do not certify the actual Safari application. Edge was not installed.
Browser-test screenshots and traces are written under ignored `test-results/`.

## Static deployment / GitHub Pages

`npm run build` creates `dist/` with JavaScript, Wasm, preloaded PNG/WAV/data resources
and direct asset copies. Upload the complete directory, retaining relative paths.
Vite `base: './'` plus relative module/data resolution supports repository subpaths
such as `/NuclearWar-ReNuked-Web/`. Serve `.wasm` as `application/wasm`, JavaScript as
JavaScript, and `.data` as binary. HTTPS or localhost enables normal browser APIs.
No shared-memory threads or cross-origin isolation headers are required.

A Pages workflow would build and upload dist; none is published or automatically
deployed here. Keep large generated `.data`/`.wasm` files in the deployment artifact,
not hand-edited. Browser scores are per origin and can disappear when site data is
cleared or storage access is denied. Private browsing may limit persistence.
