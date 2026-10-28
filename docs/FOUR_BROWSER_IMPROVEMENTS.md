# Speech, turn playback and loading-screen improvements

## Scope and preservation

Only the independent browser project changed. Its fixed 320×200 SDL compositor,
orthographic camera, viewport fit, shared coordinate mapping, native asset payloads
and desktop reference remain intact. No gameplay, AI, combat, production, revenge,
RNG or audio-rate rules changed. The banner supplied in this project was used as-is.

## 1. Speech text: root cause and correction

The original atlas stores 6×8 character cells with five principal ink columns and
a sixth spacing column. The copied desktop speech renderer shrank each **6×8**
cell to **5×7** through SDL_RenderCopy. Nearest scaling is not harmless here: it
samples away thin stems, crossbars and bottom rows. This defect is in the bitmap
composition, not a Three.js transparency or DPR problem. Three.js still uses the
same nearest-filtered, sRGB, complete-frame texture.

An executed native SDL software-renderer probe (`tools/probe_speech_font.cpp`)
confirmed the original operation damages an A:

```
original scaled       native ink columns
..#..                 ..#..
.#...                 .#.#.
#..#.                 #...#
####.                 #####
#..#.                 #...#
.....                 #...#
```

Speech now copies the five ink columns at **5×8, 1:1**, retaining the original
bitmap, red color, transparency and five-pixel character advance. Lines remain
wrapped at 26 characters. Line pitch is8 rather than7, eliminating vertical
resampling/overlap and preserving descenders. Both lines fit inside the unchanged
20px two-line bubble: start offsets3 and11, final ink row18, bottom border19.
Single-line bubbles also fit unchanged. Normal character timing, message wording,
wrap order, lifetime and emoji behavior are not changed. This is an intentional
legibility correction to the desktop's compressed speech raster, not a claim of
pixel identity to that defective compression. All other text rendering is untouched.

Browser tests check native atlas pixels for A and second-line g descenders, all
four speaker anchors, short/long text, no bubble dismissal and live emoji updates.

## 2. Hold playback: root cause and correction

The original click/hold integrator was correct, but its **eligibility policy was
movement-only**. Input was accepted only while scene.input_eligible() held, and the
capture key included the current action index. Pressing during speech/doors did
not arm a hold; animation completion and action-index changes cancelled it. Text
and the post-animation result wait could therefore dominate the perceived turn
at normal speed even when travel briefly accelerated.

The browser adapter now distinguishes timeline hold coverage from click-skip
eligibility. It captures eligible visible turn presentations at the existing 200ms
threshold, keeps a hold across event indices within one presentation generation,
and passes 1.5× elapsed time to the existing boundary-aware playback_tick. Speech,
console typewriter work belonging to that presentation, turn transitions, travel,
impact/result presentation and automatic waits use the same scaled delta.
Authoritative resolution still runs once through its existing engine path. No
simulation clock, AI computation, RNG, damage or sample playback rate is multiplied.

Short release retains the existing instant-completion contract for eligible
attacks/deployment, or the appropriate normal message click elsewhere. An event
key prevents a short click from acting on an unrelated event that appeared meanwhile.
A sustained hold release is consumed and never becomes a skip. The current hold
is cancelled on pointercancel, lost capture, blur and hidden-document state.
Normal implicit capture loss after pointerup is ignored rather than clearing a
queued UI selection. Focus/scene changes retain the original drain protection.

Human decision controls remain immediate, including emoji clicks over active
speech; they are not swallowed by the broader hold policy. Human decision prompts
and the persistent manually dismissed propaganda result are not accelerated into
an automatic dismissal. Idle selection shutters, cursors, new-game fades, audio
pitch and high-score entry remain on their normal clocks. A fresh pointer gesture
is required after leaving the eligible presentation generation.

Real-time browser fixtures use --browser-realtime, distinct from the desktop
replay driver's synthetic .1s per frame. Timing tests compare actual wall duration
for the same 3s presentation interval in speech, missiles, bombers and revenge,
excluding loading. Measured intervals and pass/fail results are retained in logs.
The held target includes the200ms threshold, so the expected duration is about
(3+.5×.2)/1.5 = 2.067s rather than exactly 2.000s. Once armed, playbackRate is 1.5;
release/cancellation restores 1.0. Revenge tests also hold across attack boundaries.

## 3. Real loading progress and Start Game

The old single loading label was replaced by an accessible progress element,
percentage, status, supplied banner, disabled-until-ready **Start Game** button and
error/Retry flow. The exact ready status is:

**Ready to Play — Click Start Game**

No timer advances progress. Completed work is weighted as follows:

| Range | Actual operation |
|---|---|
| 0–4 | Fetch/parse/validate the local asset manifest |
| 4–12 | Download the JS engine module |
| 12–68 | Stream Wasm and data package; 28 points each, measured against Content-Length where available; unknown lengths advance on stream completion |
| 68–76 | Instantiate Emscripten/Wasm, install actual preloaded files |
| 76–85 | Construct the actual reusable C++ SDL renderer and decode/load all critical graphics and bitmap font |
| 85–92 | Decode/validate original WAV samples through the C++ resource loader |
| 92–98 | Initialize optional saved-score storage |
| 98–100 | Join with the parallel banner decode and complete readiness |

No 100% is shown until every critical task succeeds. The banner is independently
decoded, not assumed loaded just because a request was queued. A failed banner,
manifest, binary or C++ resource initialization leaves Start disabled, shows a
useful error and offers Retry (a clean reload, avoiding duplicate module/window/
listener initialization). Status updates cannot overwrite an already-shown error.

Optional IndexedDB availability has a bounded 3s open probe before mounting. A
blocked/disabled open falls back to visit-local scores with a console warning;
a late probe only closes its database and cannot hydrate stale data into a running
game. Usual IndexedDB-backed score loading/persistence remains unchanged.

The engine factory is instantiated once. C++ graphics preparation constructs one
renderer that main later reuses, not a second SDL window. No game starts at 100%:
Player/session initialization and the actual main loop wait for the button click.
The click creates/resumes SDL's Web Audio context, applies mute preference and adds
one input manager. Both button and engine have one-start guards. WAV prevalidation
does not start audio or create an autoplaying context. Fullscreen/mute still work.

## 4. Official banner

`public/assets/branding/nuclear-war-renuked-banner.png`, 1983×793, unchanged SHA-256:
`68fc5ac1a54999d209615113de05f8593d007065f71da4191c75305c17ab07ca`.

The supplied beach/blimp/surfer artwork was inspected; nothing was generated or
substituted. The URL is resolved from import.meta.env.BASE_URL/document.baseURI,
including static repository subpaths. The loader uses object-fit:contain and a
flexible image area so the progress/status/button remain visible on laptop and
portrait windows. The banner is loaded by HTML and excluded from the Wasm preload
package to avoid downloading it twice. Original game artwork is not replaced.

## Changed components

- `src/ui/LoadingScreen.ts`, `index.html`, loading-only CSS, `GameApp.ts`, `main.ts`.
- `src/engine/GameEngine.ts`, bridge preparation exports in `GameBridge.ts`.
- `src/input/InputManager.ts`: cancellation lifecycle; coordinate conversion unchanged.
- `wasm/src/platform/application.cpp`, `presentation_controls.hpp`: preparation and
  presentation-only hold policy, diagnostics; original engine remains untouched.
- `wasm/src/rendering/renderer.hpp`: speech glyph copies and eligible console delta.
- `wasm/src/platform/launch_options.hpp` and replay fixture setup: real-time/speech
  test controls; these do not alter normal game's default arguments or dialogue.
- Build exports/preload exclusion, browser tests and diagnostic probes.

## Verification

Final executed counts, timings and screenshots are under
`docs/validation/four-improvements/`. No automatic deployment, publishing or
shutdown. Native speaker listening and actual Safari/Firefox/Edge retain the
previous browser port's documented limitations; WebKit is not claimed as Safari.
The progress ranges are task weights, not an ETA. Byte progress uses available
response lengths; compressed/unknown lengths are capped until the stream finishes.

Final executed results: **216/216 browser checks passed** across Chromium, installed
Chrome and Playwright WebKit. Native/Wasm/UBSan suites each passed 10/10, Node parity
passed 3/3 and all 2,173 state records still match the desktop digest. Three-second
intervals measured 3.000–3.015s normally and 2.068–2.087s held in the final matrix.
The initial full run had one WebKit assertion reading AudioContext.state before
its asynchronous resume completed; that assertion now awaits the state and the
entire clean matrix passed. The production subpath test passed with the official
banner, 100% readiness and actual audio unlock. Representative loading and all-four-
speaker screenshots were captured and inspected. Desktop tracked-file/Git checks
pass. No manual audible comparison, actual Safari, Firefox or Edge certification
is claimed. Existing documented host tooling limitations remain.
