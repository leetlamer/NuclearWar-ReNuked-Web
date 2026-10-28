# Internal display-coordinate correction

## Verified root cause and previous test gap

The previous change fixed the page's available height. It did not fix the contents
of the source framebuffer on HiDPI displays. Previous high-DPI checks asserted
canvas dimensions and hitbox command results; the pixel-content comparison ran
only at DPR1. This allowed a clipped source image to pass those layout tests.

Independent before/after screenshots and JSON probes are saved in
`docs/validation/display-coordinates/`. The regression was reproduced **before
changing code**, using the local browser build at DPR1, 1.25 and 2.

| DPR | SDL software framebuffer before | Source canvas before | Framebuffer and canvas after |
|---|---|---|---|
| 1 | 320×200 | 320×200 | 320×200 / 320×200 |
| 1.25 | 400×250 | 320×200 | 320×200 / 320×200 |
| 2 | 640×400 | 320×200 | 320×200 / 320×200 |

The web copy of `renderer.hpp` still created the desktop's **960×600 resizable,
high-DPI SDL window**. The browser canvas has externally fixed 320×200 CSS/backing
bounds. SDL's resizable browser backend adopts the logical CSS size but its
`SDL_WINDOW_ALLOW_HIGHDPI` flag makes `SDL_GetWindowSizeInPixels` multiply it by DPR.
`Emscripten_CreateWindowFramebuffer` allocates that larger surface, and the software
renderer scales the logical frame to it. The browser update then calls
`putImageData` with a 640×400 image onto the 320×200 canvas at DPR2. Canvas clips the
extra right/bottom pixels. **The source PNG is already wrong before Three.js sees it.**

For example, a portrait at logical (252,150) is drawn at (504,300) at DPR2, outside
the source canvas. The first face at (13,55) becomes (26,110), explaining the apparent
right/down displacement and oversized details. These are scaled coordinates, not
a constant Three.js parent translation. The Three.js camera, scene scale and
full-frame mesh were correctly centered: no half-width/half-height offset defect
was found. Changing that camera would conceal one symptom and break correct DPR1
rendering. Texture atlas dimensions were not used as scene dimensions.

## Minimal runtime fix

The browser SDL window now uses **320×200 and flags 0**. It is a fixed logical-pixel
compositor, not the visible browser window. It must never be resizable or HiDPI.
Three.js alone handles browser layout and display pixel density. The SDL software
framebuffer and the texture source therefore remain 320×200 across DPR changes.
No SDL library, asset, game rule or animation timer was modified.

Authoritative resolution is verified from the desktop renderer's
`SDL_RenderSetLogicalSize(320,200)`, its composition rectangles and matching native
reference image. The desktop window's 960×600 is a presentation size, not the game's
logical resolution. Desktop source and configuration remain untouched.

## Complete transform trace

1. Original PNG/sprite source rectangles are copied by unchanged SDL code into
   destination rectangles in **top-left-origin 320×200 game pixels**.
2. SDL now writes precisely one framebuffer pixel per logical pixel into the fixed
   source canvas, independent of display DPR.
3. CanvasTexture uploads that complete frame. Its UV orientation preserves the
   source top row; RGB readback validates the orientation.
4. One Three.js plane has dimensions 320×200, position (0,0,0), scale (1,1,1).
   Camera bounds remain [-160,160] horizontally and [100,-100] vertically, zoom1,
   position (0,0,1). Logical (x,y) corresponds to world (x-160,100-y). Thus logical
   (0,0) is the plane's upper-left, not its center. No per-sprite center conversion
   is needed: sprites have already been composed by SDL.
5. `contentBounds` applies one fit scale, min(CSS width/320, CSS height/200), centered
   inside the available canvas. Black bars are intentional letterboxing.
6. DPR affects **only Three.js drawing-buffer dimensions**, not logical geometry,
   camera zoom, source canvas or SDL framebuffer. No CSS transform is applied.
7. Pointer coordinates subtract the canvas position/letterboxes and divide by the
   same fit scale. Shared forward/reverse helpers serve both diagnostics and input.
   Out-of-frame presses stay rejected; existing move/release/hold behavior remains.

`GAME_WIDTH`/`GAME_HEIGHT` are shared TypeScript constants matching the verified SDL
logical frame. Known rectangle corners are tested through the actual camera's
projection matrix and through reverse pointer conversion.

## Development diagnostics

Run `npm run dev`, then open `/?debugRender=1`.

The non-interactive overlay shows:

- green logical frame, magenta camera-frustum boundary, yellow logical origin;
- cyan reference title/portrait rectangles, original logical bounds and final CSS bounds;
- camera position/frustum/zoom, scene and mesh transforms;
- source canvas and SDL framebuffer sizes;
- canvas CSS size, drawing-buffer size, GPU viewport, DPR and fit scale.

`RenderDiagnostics.ts` is dynamically imported only behind `import.meta.env.DEV`.
The production build emits no diagnostics module; the production subpath test
explicitly requests the flag and asserts that no diagnostic overlay appears.
`node tools/probe-display.mjs after` saves independent framebuffer/viewport probes
against a running dev server on port5173.

## Files changed

- `wasm/src/rendering/renderer.hpp`: only the web compositor window size/flags and explanation.
- `src/rendering/viewport.ts`: named logical size and shared bidirectional coordinate helpers.
- `src/input/InputManager.ts`: use that shared reverse helper; preserve gesture semantics.
- `src/rendering/GameRenderer.ts`: use named dimensions and expose dev-only diagnostics.
- `src/rendering/RenderDiagnostics.ts`: development overlay.
- `tests/browser/coordinates.spec.ts`: actual source/GPU/native-reference and projection regressions.
- `tests/production.mjs`: assert diagnostics remain absent in production.
- `tools/probe-display.mjs`: reproducible before/after measurement utility.

## Executed validation and limitations

- `npm run build`: passed, including TypeScript and Wasm compilation.
- `npm test`: native10/10, Wasm10/10, Node parity3/3; 2,173 deterministic desktop
  trace records still match byte-for-byte; gameplay/UI/audio source and assets unchanged.
- Full browser matrix: **138/138 passed** across Chromium, installed Chrome and
  Playwright WebKit. Existing speech, menus, BUILD, missile/bomber, revenge,
  special-event, scoring and restart fixtures remain passing.
- Title comparison: native desktop reference, 53,760 non-animated pixels per image
  exactly match. Only the ten animated 32×32 face interiors are excluded from
  desktop-time comparison. Title, portrait borders and all labels are included.
- Three.js GPU readback: every logical RGB sample matches the source, including
  animated faces; DPR1, 1.25 and 2 verified. DPR2 screenshots additionally captured
  at 1920×1080, 1366×768, 1280×720 and 800×450.
- Main gameplay at DPR2: source/surface320×200 and zero GPU/source RGB differences;
  saved screenshot includes all four AI corners and full interface.
- Existing ten-size layout/fullscreen/DPR/input regression suite passed again.
- Production static repository-subpath test passed, including no debug overlay.
- Desktop's168 tracked files, Git HEAD and working-tree state unchanged. No writes
  were made to GameReverse. No deployment or shutdown.

The native reference is the desktop's existing pre-present renderer capture, reduced
from1920×1200 by sampling the centers of its exact6×6 nearest-neighbor blocks.
Conversion/checksum metadata is preserved beside it. Before/after screenshots were
actually captured and inspected. Actual Safari/Edge and audible manual comparison
retain the earlier report's limitations; WebKit is not claimed as Safari testing.
