> Historical 2026-10-29 report. Later UFO rollback: SELECTIVE_SPECIAL_EVENT_ROLLBACK.md. Roster and complete extinction ending remain intact.

# Roster, Earth extinction and UFO restoration — browser synchronization

## Delivery status

**Complete in desktop and browser:** explicitly selected1–4 AI opponents; original recovered Earth cracking/explosion ending before space Hall.

**Partial:** original UFO and four yellow sprites restored to the existing natural alien event. A distinct hostile alien city attack remains **UNKNOWN / not implemented**. The recovered routine adds population, so no arbitrary loss, new event probability or invented dialogue was introduced to manufacture the requested attack.

Desktop evidence and full frame map are in `NuclearWar-ReNuked/docs/RESTORATION_REPORT.md`, `EXTINCTION_EVIDENCE.md` and `ALIEN_ATTACK_EVIDENCE.md`. Browser runtime is independent; these are documentation references, not runtime paths.

## Shared implementation

- `wasm/include/nuclear/engine.hpp`: explicit roster occupancy, defaulting to five for existing fixtures.
- `wasm/src/ui/player_controller.{hpp,cpp}`: confirm only1–4 explicit portraits; no random vacancy filling; no absent-slot selection.
- `wasm/src/game/game_rules.cpp`, `game/ai/ai_controller.cpp`: absent slots initialize empty/action88 and do not plan. Existing population guards exclude them from production, target choice, revenge and survival.
- `wasm/src/rendering/renderer.hpp`: hide absent portrait/name/emoji/cities; compose original ending overlays. Browser-specific speech layer and320×200 SDL compositor remain intact.
- `wasm/src/ui/endgame.hpp`, `rendering/animations/extinction.hpp`: wait for resolved gameplay/presentation, show all ten recovered stages once, then clean space/Hall. Slow frames lengthen presentation instead of dropping stages.
- `wasm/src/platform/application.cpp`: original explosion cue once at stage3; reset its one-shot on new game. Added read-only participant count/extinction-stage/Hall diagnostics; no TypeScript gameplay copy.
- `wasm/src/rendering/animations/special_events.hpp`: original four yellow frame rectangles and host descent/exit. No RNG/damage changes.
- Original assets `expmap.png`320×200, `smallexp.png`320×176 and `bigexp.png`320×432 copied into `public/assets/images/effects/`; manifest, frame metadata and generated C++ registry synchronized.
- Regression fixtures now explicitly select opponents. Browser-specific speaker/message fixture overrides preserved.

`expmap` is a static intact Earth. Three crack overlays and two early explosion frames come from `smallexp`; **five** irregular160pixelwide frames come from `bigexp` at `(0,0,160,128)`, `(160,0,160,144)`, `(0,128,160,160)`, `(160,144,160,160)`, `(0,288,160,144)`. Original opaque blits accumulate. Never draw the whole explosion sheet as one image.

Wait-count-derived PAL timing is provisional: intact0.18s, stages0–2each0.20s, stages3–8each0.22s, stage9approximately0.04s, clean space0.60s. Native sound evidence: exp4998bytes, period620, volume64, once at stage3; clock3546895 unchanged.

UFO sprites are eight32×10 frames atx0..224step32,y210. Yellow16×16 frames arex256/272/288/304,y208, positioned craftx+12,y+3. Existing action16 announces `Space Aliens land on %s.` and effect69 doubles the first strictly-largest positive own city, preserving16bit arithmetic. Marker23000 says `%s gains %d Million people.` Natural action3 gate<30 and event bins7–8 are unchanged. Neither this event nor city-liftoff was repurposed into hostile damage.

## Validation actually executed

- `npm run build`: succeeds, including Emscripten, TypeScript and production Vite bundle. `npm run build:test-wasm`: succeeds.
- `npm test`:10/10 native suites,10/10 Wasm suites and3/3 Node parity checks passed. Existing2173record deterministic desktop trace remains byte-identical; shared gameplay sources and runtime assets match the intentionally updated desktop reference.
- Clean three-browser run: **39/39** coordinate/restoration checks across Chromium, installed Chrome and Playwright WebKit. All1–4 rosters, all ten Earth stages, space Hall, UFO presentation; title pixel parity, highDPI and reverse pointer mapping.
- Final rebuilt/revised-fixture presentation run: **18/18** (sixcases×threebrowsers), including a lower-screen UFO target for capture; the extinction Hall click/reset/fade then starts a new game against a different two-opponent roster.
- Chromium hold/startup: **18/18**. Measured3second presentation intervals: speech2.059sheld vs2.999snormal, missile2.075vs3.002, bomber2.071vs3.007, revenge2.068vs3.006 (includes200ms hold threshold). Cancellation, banner, readiness, Start Game, audio unlock/mute and optional storage fallback passed.
- Other executed regressions: game+existing replay checks27/27 passed in the initial44test run; speech8old tests failed due root-relative test atlas URLs, then all33speech matrix checks passed after test-only basepath correction. Layout36/36passed across threebrowsers. Old coordinate tests similarly used root-relative test fixtures/imports; corrected to document-base URLs and confirmed by clean39/39run. One overlapping test-run server teardown invalidated an intermediate retest; it was superseded by the isolated clean run. These were test harness issues; camera, input geometry and runtime filtering were not changed.
- Desktop final optimized16/16, UBSan16/16, native renderer captures, all-dead/human-death/alien/revenge replays passed before web synchronization.

Screenshots/logs in [validation/restoration](validation/restoration). Actual native and browser images were inspected: blank opponent positions, cracking globe, expanding original explosions, space Hall, original yellow UFO graphics. Browser captures include every extinction stage and UFO entry/secondary/exit. Original Amiga elapsed-time playback and audible listening parity were **not** verified. WebKit is not an installed Safari certification; Firefox, Edge and actual iPad Brave were not exercised.

Viewport tests include1920×1080,2560×1440,1366×768,1280×720,1024×600,800×450,640×360,360×640,320×240,240×640 plus fullscreen, resize andDPR. No scene/camera/viewport/pointer transforms changed. Speech metrics, loading/banner/start, audio pipeline, scoring, user-defined revenge and input acceleration remain their existing implementations.

## Preservation and remaining work

Desktop was changed first and committed locally. `docs/desktop-baseline.json` intentionally advances from the original667af1d baseline to the restored desktop commit; this is an authorized reference update, not an assertion that desktop was unchanged during this task. Previous frozen deterministic trace is retained. GameReverse was read-only. No GitHub push, deployment or shutdown.

Remaining blocker is **a separate original hostile UFO dispatch/damage/dialogue path**. No credible damage value or trigger was recovered in the bounded evidence review. Current yellow-frame event is immigration; do not advertise a fully restored damaging alien attack. PAL seconds and UFO upward departure remain documented host approximations.
