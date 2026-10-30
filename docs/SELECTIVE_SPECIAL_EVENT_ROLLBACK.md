# Selective special-event rollback — 2026-10-30

## Result

Restored previous **single-UFO immigration without lasers**, fixed the reproduced city-liftoff ground redraw/completion defect, and preserved **all1–4 opponent selection and the entire Earth extinction ending completely unchanged**. No new hostile event was introduced. Shared desktop implementation was validated and committed first at `d9d8d8f`, then synchronized here.

## History and safety

Inspected status, log, reflog, show and diff in both repositories. Desktop starting commit7efb5d7; browserdfb3dc3. Last session's browser commits327ca49/fa13536 were rebased to3f70f9f/dfb3dc3; the additional README change was preserved. Desktop comparison667af1d identifies the previous working UFO branch;405883f introduced yellow sprites/departure,7efb5d7 guarded its departure interval. a1a8327 and850da3b are protected roster/extinction milestones.

Pre-edit safety tags in both repositories: **`safety-before-special-event-rollback-20261030`**. Complete-history bundles of those snapshots at **`.git/special-event-safety-20261030.bundle`** were created and verified successfully. No reset, whole-commit revert, force push or deletion of originals.

## Exact scope

- `wasm/src/rendering/animations/special_events.hpp`: action16 is byte-for-byte its previous single-UFO landing implementation. Removed yellow secondary sprites and recent departure interpolation. Rest of special-event sprite functions match previous working source667af1d, with one intentional cleanup exception: city11 stops emitting city/exhaust at `seconds >= duration`.
- `wasm/src/rendering/renderer.hpp`: only the action-map stationary target tile condition changed. City11 shows empty/ruined tile150 while the city is airborne; normal resolved population snapshot redraws the final site afterward. No changes to the renderer's extinction block, speech layer, camera, viewport, mouse mapping or other scenes.
- `public/assets/data/animations.json`: removed only `alien yellow secondary`. All extinction frame metadata preserved. No PNG or WAV assets deleted/modified.
- `wasm/tests/frontend/tests.cpp`: restore no-laser assertions, add city completion/population tests. Existing roster and extinction tests were preserved.
- `tests/browser/restoration.spec.ts`: retain1–4 roster checks and all ten Earth stages/Hall/restart/reselection; replace UFO-laser expectations with original landing; add exact ground-tile pixel comparison at1.1s and3.1s and subsequent continuation.
- `docs/desktop-baseline.json`: intentionally advances to the separately validated desktop rollback commit; shared sources/assets still match. Reference verification passes for232tracked desktop files and unchanged HEAD/status since that snapshot.

No engine, combat, population, production, revenge, scoring or RNG algorithms were changed. No browser initialization, audio system, UI metrics, Pages settings or input code was changed.

## City issue: reproduced mechanism

History shows no city resolver/animation edit in the last session. The concrete defect was the full background redraw reintroducing a stationary pre-effect city beneath the rising sprite, plus an exhaust frame emitted exactly at the logical completion boundary. This was not a texture-cache invalidation problem.

Actual native renderer negative control: original header **16524 differing ground RGB channels** between flight1s and resolved3.2s; corrected header **0**. New native `city_refresh_tests` and browser absolute-pixel tests verify the empty/ruined site during ascent and after completion. The final population is zero through the unchanged resolver; no gameplay effects were replayed or delayed. An indefinitely stale site after all subsequent turns was not independently reproduced, so no unobserved cache failure is claimed.

## Protected roster and Earth ending

`validation/special-event-rollback/protected-features.json` verifies byte-identical hashes against the safety checkpoint for roster/initialization/AI sources, endgame header/state machine, **entire application loop including explosion sound**, all three Earth image files, explosion WAV, and renderer extinction block. Browser camera, input, speech, loading/Start Game and Pages configuration are also unchanged. The corresponding desktop JSON and captures are in its report.

All original native Earth captures remain **byte-identical** to the prior session: intact globe, three crack stages, two small explosion stages, **all FIVE bigexp frames**, and Hall against space. No timing, positioning, state transition or scoring changes. Original `exp` cue remains4998bytes,period620,volume64,once atstage3,clock3546895. Pending scene/revenge ordering remains unchanged. Endgame cannot start while its existing pending-presentation guard is active.

The unchanged engine tests cover extinction with different1–4 AI rosters. Browser tests display every stage and finish the real high-score click/fade/reset path, then start a different two-opponent game. Normal survivor endings and AI-only continuation remain exercised by existing replay suites.

## Validation actually executed

Desktop:
- Release build, **17/17** CTest suites passed.
- UBSan build, **17/17** suites passed.
- Native immigration, city-lift and all-dead SDL replays passed.
- Actual renderer captures inspected; original Earth PNG outputs match prior ones exactly.

Browser:
- `npm run build` succeeds (Emscripten/TypeScript/Vite).
- `npm run build:test-wasm` succeeds.
- `npm test`: **10/10 native suites**, **10/10 Wasm suites**, **3/3 Node parity checks** passed;2173record frozen deterministic trace remains identical.
- **87/87** Chromium, installed Chrome and Playwright WebKit checks passed: roster1–4, extinction/Hall/restart, immigration without lasers, exact city refresh pixels/continuation, revenge normal/click/hold, human-death AI-only continuation, earthquake, interception, bomber,100MTaudio timing, shutters/reverse/rapid/round re-entry and moods.
- **41/41** additional Chromium checks passed: speech clarity/emoji, responsive layout/fullscreen/DPR,200ms hold activation, measured1.5x speech/missile/bomber/revenge playback and cancellation, loading/banner/progress/Start Game/error recovery.
- Native and browser captures visually inspected for restored immigration, city launch/empty final site, Earth sequence and Hall. No actual speaker listening verification, Amiga hardware timing measurement, Safari certification, Firefox/Edge or physical iPad testing claimed.

Evidence/screenshots/logs: [validation/special-event-rollback](validation/special-event-rollback). The earlier restoration report is historical; this report supersedes its UFO presentation status.

GameReverse remained read-only. No original assets removed, no publishing/deployment/push and no shutdown. No known roster/extinction failures remain in executed tests.
