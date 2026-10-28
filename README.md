# Nuclear War: Re-Nuked — Browser Edition

An independent browser port of the completed C++17 desktop recreation. Gameplay,
AI, RNG, combat, production, four-attack bomber-first revenge, scoring and the
existing presentation controller run as WebAssembly. Three.js displays the game's
preserved 320×200 sprite compositor with an orthographic camera and nearest-neighbor
sampling. SDL is compiled into Wasm/JavaScript; browser users install no native SDL.

## Run locally

Requires Node.js 22.12+ (tested with 26), npm, Python 3 and Git for Emscripten setup.

```sh
npm install
sh tools/bootstrap-emsdk.sh
npm run build:wasm
npm run dev
```

Open the printed local URL and press **Start game** to unlock audio. Click four
opponents, then the title banner to begin (or let the original selection fill the
remaining slots). Original controls and game text are preserved. Short clicks skip
eligible action movement; holding the mouse beyond 200 ms plays it at 1.5×. A fresh
click dismisses propaganda results. Fullscreen and mute controls sit outside the
game viewport. High scores are stored in browser IndexedDB for this origin.

```sh
npm run build
npm run preview
```

`dist/` is a static, deployable website. No source/reference paths are used at
runtime. See [BUILDING.md](BUILDING.md), [ARCHITECTURE.md](ARCHITECTURE.md) and the
[porting report](docs/PORTING_REPORT.md) for implementation and validation details.
Do not open index.html using file://; use an HTTP server.

The desktop project and GameReverse remain separate and unchanged. This repository
was not published. Original game assets/text are retained; no new licensing grant
for third-party artwork is implied by this port.
