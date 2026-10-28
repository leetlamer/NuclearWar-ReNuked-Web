# Browser port report

## Reference and project isolation

The reference is desktop commit `667af1d` (full hash in `desktop-baseline.json`).
The new project is a separate local Git repository. All source, data, dependencies
and generated build outputs belong to this project. No runtime imports, symlinks,
CMake edits or asset writes point to the desktop project or GameReverse. A frozen
SHA-256 manifest records all 168 tracked reference files and its clean Git status.
`tools/verify-desktop.mjs` can recheck that source read-only.

## Audit and reuse

| Desktop component | Browser implementation |
|---|---|
| `include/nuclear/*.hpp` | Copied into `wasm/include/nuclear`; same Word/RNG/state APIs |
| `src/game/{ai,combat,revenge}` and other game modules | Compiled unchanged to Wasm; original deterministic resolution |
| `src/ui/{player_controller,turn_presentation,...}` | Same C++ command dispatch, console, moods, speech, shutter and input policies |
| `src/core` | Same names/dialogue/layout and generated data tables |
| `src/audio/audio_manager.hpp` | Unchanged WAV decode, PCM resample/mix, clock, cue and queue ownership |
| `src/rendering/renderer.hpp` | Same sprite renderer; browser software target and 320×200 backing canvas |
| `src/platform/application.cpp` | Same frame/event/presentation loop plus small browser API and cooperative yield |
| `src/platform/resources.cpp` | Browser virtual `/assets` discovery; same PNG and WAV loaders |
| Assets | Own byte-identical copies under public/assets; no redraw/conversion |
| Portable tests and replay drivers | Copied into wasm/tests; native/Wasm and browser fixtures |
| Source conversion/desktop packaging tools | Not needed by browser runtime; excluded |

The source map and checksums document exact copied provenance. Unknown native fields
and original-width arithmetic were not renamed or reinterpreted. No TypeScript AI,
revenge, combat, production or scoring implementation was added.

## Incremental phases

1. Created isolated repository, reference inventory and dependency/build setup.
2. Copied portable engine, frontend and local assets; compiled native tests.
3. Compiled Emscripten game and deterministic trace; matched reference digest.
4. Added orthographic Three.js canvas-texture presentation and inspected the actual
   character-selection screenshot. Added next-frame pointer input forwarding.
5. Connected the existing game loop, full turns, presentation/audio, high scores and
   browser persistence. No replacement battle simulation or placeholder screens.
6. Extended the copied replay harness to browser execution, including normal, skip
   and hold revenge, shutter/cursor re-entry, earthquake/city ascent and restart.
7. Built static Vite output and tested a repository subpath via a plain HTTP server.

The design deliberately preserves the SDL compositor in Wasm, rather than a new
per-sprite Three.js scene graph. Three.js owns the visible WebGL surface and camera;
SDL is a compiled browser backend, not an installed native dependency. This meets
the 2D presentation goal while keeping verified sprite boundaries/timers in one
place. A future renderer extraction should compare against the same fixtures.

## Port-specific corrections discovered in validation

- Emscripten's default small stack was insufficient for the large original fixture
  locals. The production and test targets explicitly allocate a 2 MiB stack.
- Exception-based validation requires `-fexceptions` in both production and tests;
  omitting it caused tests to reject thrown C++ exceptions. Both now use it.
- SDL's Web Audio context is exposed as `Module.SDL2.audioContext`; a closure-local
  SDL2 lookup was incorrect. The accessor now uses the backend's module property.
- Browser mute calls the existing C++ manager instead of suspending AudioContext,
  avoiding accumulated stale queued effects when unmuting.
- Shared letterbox bounds preserve 320×200 aspect ratio and pointer coordinates
  when browser/fullscreen dimensions differ. Black bars are not actionable UI.

## Validation

See `validation/` logs and [ENGINE_PARITY.md](ENGINE_PARITY.md) for executed results.
Reports distinguish game runtime checks from host tooling failures. C++ tests alone
are not used to claim visual/audio parity; browser pixel readback and Web Audio
state checks supplement them. No speaker-listening comparison was performed.

## Technical debt and limitations

- The preserved C++ frontend remains a sizeable compatibility implementation. No
  sweeping architectural refactor was attempted during a cross-platform port.
- Three.js uploads one small canvas texture per display frame; software composition
  in Wasm prioritizes fidelity over GPU batching. Browser frame scheduling, display
  refresh and audio-device latency can differ from native SDL.
- Hidden tabs can be browser-throttled. Focus loss clears the existing hold gesture;
  the port does not alter simulation RNG to compensate for hidden time.
- Web Audio is reached through SDL's browser backend (currently ScriptProcessor),
  retaining original PCM/queue logic. An AudioWorklet migration is future work.
- IndexedDB is origin-scoped and subject to browser policy/site-data removal. Errors
  loading storage are logged; the game can still play with visit-local scores.
- Actual Safari/Edge and manual audible/full-game acceptance must not be inferred
  from WebKit/Chromium automation. No public deployment was performed.
- Original asset copyright/provenance is unchanged; deployment rights were not
  expanded by this technical reconstruction.

## Preservation qualification

A final read-only check matched all **168 tracked desktop files**, Git HEAD and
working-tree status. Comparing GameReverse with the older modernization inventory
(133,940 files) found only two Finder metadata differences: `.DS_Store` and
`port/.DS_Store`. No source/asset differences, additions or removals were reported.
These metadata files were not restored or edited. The older snapshot is not a
fresh byte-for-byte baseline for those metadata files; the browser port issued no
writes to GameReverse.

The revenge rules are the completed desktop's user-defined four-attack behavioral
reconstruction. This browser migration makes no new claim that all internal rules
match the original Amiga executable.

## External technical references

- [Emscripten Asyncify](https://emscripten.org/docs/porting/asyncify.html)
- [Emscripten compiler settings](https://emscripten.org/docs/tools_reference/settings_reference.html)
- [SDL2 browser Asyncify hint](https://wiki.libsdl.org/SDL2/SDL_HINT_EMSCRIPTEN_ASYNCIFY)

The adapter disables implicit SDL Asyncify yields and explicitly yields at the
frame boundary; this keeps the copied frame's event/render/completion ordering in
one place while giving control back to the browser.

## Final executed validation summary

| Check | Result |
|---|---|
| Native portable C++ suites | 10/10 passed |
| Wasm/Node versions of those suites | 10/10 passed |
| Native Debug UBSan portable suites | 10/10 passed |
| Node source/asset/trace parity tests | 3/3 passed |
| Deterministic desktop/native/Wasm trace | 2,173 records byte-identical |
| Final browser matrix | 81/81 passed: 27 checks each in Chromium, installed Chrome and Playwright WebKit |
| Native-size Three.js pixel readback | RGB exact at 320×200 on all three browser projects |
| Real browser audio API | Context running after gesture; original mute/unmute flags verified |
| Two restarts / three sessions | Fresh state/RNG and score preservation; actual high-score bytes survive page reload |
| Static repository-subpath deployment | Wasm/data/assets/game start/Web Audio passed with no page/network errors |
| Desktop tracked source/assets/Git state | 168 files and Git state unchanged |

Early development runs caught exception/stack/audio-accessor issues and recorded
transient Chrome/WebKit failures while frontend files were being changed. Those
runs were not called passing. The final complete clean run passed all 81 checks;
the initial Chrome revenge case also passed three isolated repeats. Native speaker
listening, a full manual playthrough, actual Safari and Edge remain unverified.

Firefox could not launch its test profile on this host, even with a local temporary
directory. This is a tooling failure before the page loads, not a claimed browser
compatibility pass. Safari's WebDriver explicitly rejected the session because
Allow remote automation is disabled; no settings were changed to bypass it.
Playwright WebKit is independently tested and must not be mislabeled as Safari.

Tested dependencies from package-lock: Three.js 0.180.0, Vite 7.3.7,
TypeScript 5.9.3, Playwright 1.64.1; Emscripten 4.0.23 / SDL 2.32.8 port.
The machine-readable final results, log files, reference digest, preservation
qualification and screenshots are under `docs/validation/`.

`build/nuclear-war-renuked-web-static.zip` contains the verified static deployment
artifact, with relative file paths and every entry compared back to dist. This is
a local artifact only. A source checkpoint records tracked files and the tested
static build separately. No GitHub remote or published repository was created.
