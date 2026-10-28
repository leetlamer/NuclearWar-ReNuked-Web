# Fit-to-window correction

## Root cause

The internal game resolution is **320×200**, verified in the copied SDL renderer's
`SDL_RenderSetLogicalSize`, its software backing canvas, the Three.js 320×200 plane
and the orthographic camera (-160…160, -100…100).

The renderer already letterboxed correctly **inside its canvas**. The page did not
bound that canvas to the remaining browser height: body used only `min-height`,
while the game used width-derived `aspect-ratio: 8/5` and `max-height: 80vh` without
subtracting the header, footer, text wrapping and page padding. The sum could exceed
the viewport, producing page overflow despite correct internal camera framing.

## Small correction

- `src/style.css`: bound the page to 100dvh (100vh fallback); use grid rows
  `auto minmax(0,1fr) auto` for header/game/footer. Let the game use the remaining
  row, including on narrow windows where chrome wraps. Reduce/limit page padding
  and text margins; allow zero minimum track sizes; hide an empty error row.
  Page overflow is disabled, but tests independently verify that the actual active
  frame **and footer bounds** fit: this is not simply hiding overflowing content.
- `src/rendering/GameRenderer.ts`: retain the same fixed camera, plane, nearest
  filtering and shared `contentBounds`. Observe available canvas dimensions and
  window/visual-viewport resize. Detect a changed DPR during rendering even if
  CSS bounds didn't change; skip unchanged drawing-buffer allocations.
- `tests/browser/game.spec.ts` and `tests/production.mjs`: update test click helpers
  to include letterbox offsets; isolate the native-size pixel-readback fixture
  from the responsive page layout.
- `tests/browser/layout.spec.ts`: add ten viewport sizes, pointer/bar rejection,
  live resize, fullscreen selection/exit, DPR2 and live DPR1.25 checks.

There is only one game scale:

```
scale = min(canvasCSSWidth / 320, canvasCSSHeight / 200)
left = (canvasCSSWidth - 320 * scale) / 2
top  = (canvasCSSHeight - 200 * scale) / 2
```

The shared calculation is applied in the GPU drawing buffer for rendering and in
CSS coordinates by the **existing unchanged** InputManager. Pointer down outside
the active rectangle is ignored; moves/releases retain existing drag/hold cleanup.
No camera zoom, scene scaling or CSS transform is added. The canvas occupies its
layout row, while only the centered active frame preserves 8:5. Letterboxes are
black. DPR multiplies backing pixels only; Three.js pixel ratio stays at one to
avoid multiplying DPR twice. `setSize(..., false)` never changes CSS dimensions,
so ResizeObserver cannot create a sizing feedback loop.

## Validation

Tested viewport sizes (CSS pixels):

- 1920×1080, 2560×1440, 1366×768, 1280×720
- 1024×600, 800×450, 640×360
- 360×640, 320×240, 240×640

Each size checks no document overflow, full active-frame bounds, 8:5 aspect,
320×200 source resolution, real selection hitboxes, rejected letterbox clicks,
and captures character-selection/main-game screenshots. Resize/fullscreen tests
preserve selection state and click a portrait while fullscreen. DPR2 is tested
on all three browser projects; live DPR1.25 device-metrics changes on Chromium and
Chrome exercise density/zoom-equivalent changes. Actual browser zoom hotkeys and
physical monitor moves were not manually tested; they use the same CSS/DPR paths.

The complete browser suite also covers speech/console, BUILD, menus, missile/bomber
and revenge presentation, earthquake/city ascent, shutters, cursor re-entry, native
RGB pixel parity, audio state, high scores and restart. No C++ game, animation,
audio, source assets, camera frustum or input timing was changed.

Final executed counts and logs are in `docs/validation/viewport-results.json` and
`viewport-browser-matrix.log`. Firefox/Safari/Edge retain the prior port's documented
validation limitations. No deployment or shutdown is performed.

Final executed results: **117/117 browser checks passed** across Chromium, installed
Chrome and Playwright WebKit. Native and Wasm C++ suites each passed 10/10; Node
parity tests passed 3/3. The production build and static-subpath startup passed.
All 168 desktop tracked files and Git state remain unchanged. This patch does not
modify GameReverse. Representative main-game screenshots are retained under
`docs/validation/viewport-1280x720.png` and `viewport-240x640.png`.
