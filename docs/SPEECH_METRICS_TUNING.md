# Speech font proportions and spacing

## Diagnosis

The desktop atlas uses **6×8 cells**, normally five ink columns plus one spacing
column. The desktop renders a full cell as 5×7 with advance 5 and line pitch 7.
The preceding browser fix cropped off the spacing column and copied 5×8 at 1:1,
with advance 5 and line pitch 8. This restored lost strokes but made the text taller
and let adjacent ink touch. It was a cell/spacing issue, not a camera/DPR defect.

## Metrics changed

| Metric | Previous browser | Corrected browser | Desktop reference |
|---|---|---|---|
| Source cell | cropped5×8 | complete 6×8 original atlas cell | complete 6×8 |
| Display cell |5×8 |5×6⅔ |5×7 |
| Scale |1× of cropped ink | X=Y=5/6 (0.833333…) | X=5/6, Y=7/8 |
| Character/word advance |5 |5, unchanged |5 |
| Inter-character spacing column | removed |0.833333 logical px | included in scaled cell |
| Line pitch |8 |7 |7 |
| Left/top inset |6/3 |6/3, unchanged |6/3 |
| Wrap |26 columns,2 lines |unchanged |26 columns,2 lines |

The full original glyph now retains its aspect ratio. Its height is 16.7% smaller
than the preceding browser rendering and only 4.8% below the desktop's 7px target.
The text block width and wrapping do not change. Two lines occupy about 13⅔ pixels,
compared with 16 previously and 14 on desktop, inside the same 20px bubble. No bubble
position, dimension or message-lifetime calculation changes.

## Rendering correction

Only speech ink is drawn directly from the original atlas in one small Three.js
batch. The C++ renderer still chooses every glyph, original atlas offset, revealed
character, wrapped line, bubble anchor and timing. It supplies read-only drawing
commands. The bubble background/borders and every other part of the game still use
the existing SDL 320×200 framebuffer. No text or wrapping algorithm moved into JS.

Why the small separate pass: reducing the full cell back to integer 5×7 SDL pixels
would repeat the discarded-stroke defect. Drawing its complete 6×8 texture directly
at the final display resolution lets nearest sampling preserve the source detail
at normal browser magnification. Both axes use the same scale. A single batched
mesh is reused; no additional loop or renderer is created. Only the speech texture
uses its own material, with original red tint, binary alpha, nearest min/mag filters,
no mipmaps and no tone mapping. The atlas bytes are reused from the already-loaded
C++ resource; no new font asset/download or alternative typeface is introduced.

Logical top-left coordinates use the existing camera convention once:
`worldX=x-160`, `worldY=100-y`. No camera/frustum/zoom/viewport change is made.
The shared renderer fit applies to these quads exactly as to the original full-frame
plane. All glyph batches are cleared with each native frame; hiding speech clears
the GPU draw range, preventing stale ink.

The one GameApp binding initializes the speech material after existing asset
readiness. Loading text, progress model, banner, button handling and audio unlock
are unchanged. Turn playback, typewriter clocks, emoji handlers, original dialogue,
combat and RNG code are unchanged. The previously present user edit in index.html
was preserved byte-for-byte and is not included in this task's source commit.

## Desktop visual comparison

`tools/capture_desktop_speech.cpp` was compiled against the **read-only desktop**
headers/resources and existing game library, with its output directed into this
web project's build directory. The actual native desktop renderer drew the same
message, “I will crush you!”, at its normal HiDPI output. No desktop files changed.
The native bubble was cropped without resizing for comparison with the final GPU
bubble from the browser. Metrics, crops and screenshots are under
`docs/validation/speech-metrics/`.

The desktop/native rendering applies its5×7 cell at the final window scale. The
new browser rendering now does the same final-resolution sampling, with uniform
rather than slightly nonuniform glyph proportions. Text width, advance, color,
alignment, padding and wrapping match; the intended small vertical size difference
is documented above. This is a visual/metric comparison, not a claim that every
native/browser raster pixel is identical.

## Executed verification

- `npm run build`: passed, including TypeScript and production Wasm.
- Relevant browser suite: **105/105 passed**, Chromium, installed Chrome and WebKit.
- All four speakers, short/long/multiline text, progressive reveal and emoji updates.
- Original font alpha/ink bytes match the unchanged atlas. Final GPU samples retain
  all 6×8 source positions, including descenders and the transparent spacing column.
- X/6 equals Y/8 scale; advance 5, line pitch 7; glyph bounds remain inside bubble borders.
- Same native message captured at 1366×768, 800×450 and 640×360, plus all-speaker
  tests at 1280×720/DPR2. Existing 10-size viewport/fullscreen/DPR tests pass.
- Text disappears cleanly when choosing the next action; no stale speech layer.
- Native and Wasm engine suites each 10/10; parity 3/3; 2,173 reference state records match.
- Desktop 168 tracked files and Git state unchanged. No GameReverse edits.

Crisp nearest sampling cannot preserve every source texel if a user shrinks the
whole game below its readable size; that existing pixel-art limitation is not
masked with smoothing. Actual Safari/Firefox/Edge retain the previous project's
validation limitations. No deployment or shutdown was performed.

## Files

- `wasm/src/rendering/renderer.hpp`: full-cell speech drawing commands and7px lines.
- `wasm/src/platform/application.cpp`: read-only font/frame bridge exports.
- `src/rendering/SpeechLayer.ts`: uniform final-resolution speech batch.
- `src/rendering/GameRenderer.ts`, `src/GameApp.ts`, `src/engine/GameBridge.ts`:
  attach/synchronize the speech-only pass through the existing loop.
- `tools/build-wasm.mjs`: export the two read-only functions.
- Updated speech tests and comparison tools; no assets or page markup changed.
