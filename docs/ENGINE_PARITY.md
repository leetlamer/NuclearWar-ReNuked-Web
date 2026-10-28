# Engine parity

The desktop C++ engine, not a TypeScript approximation, is authoritative. Native
and Wasm builds execute the same copied implementations and fixtures.

`tools/deterministic_trace.cpp` from the desktop is retained under
`wasm/reference_tools`. It records each phase's player/actor bytes, RNG seed,
identity, inventory, production/pass state, prepared capacities and revenge flags.
Eight fixed seeds and real human/AI elimination scenarios produce **2,173 records**.
The desktop executable, native copy and Wasm/Node trace matched byte-for-byte.
The frozen reference digest is in `validation/desktop-trace.json`.

The ten portable suites cover engine rules, endgame/scoring, resolver markers,
round planning, session coordination, resolver combat, missiles, player/frontend
state, revenge and original text. They pass both natively and compiled as Wasm.
Native UBSan is run separately. `tests/parity.test.mjs` verifies frozen trace,
byte-identical assets and unchanged gameplay/UI/audio source hashes.

Browser tests use actual Emscripten modules, real pointer gestures, the Three.js
framebuffer and Web Audio context. The optional developer-only replay module
compiles existing desktop fixture drivers and asserts their own state invariants:

- Real selection and BUILD action, no extra production acknowledgement.
- RGB readback equals the SDL source canvas at all 320×200 pixels.
- Audio context unlock, native mute flag and unmute without clock suspension.
- Human elimination and automatic AI-only continuation.
- Human, AI and airborne-bomber revenge in normal/click/hold modes; death notice
  before attacks, all events shown and final immutable resolver state preserved.
- Earthquake and rising-city effect; bomber attack and interception presentation.
- 100 MT production result; shutter transitions and three-round cursor re-entry.
- Two high-score restarts / three sessions with fresh state and RNG, preserved
  scores, cleared console/shutters and new-game-only fades.

Browser tests don't invent expected RNG states. The original fixture expectations
remain in copied C++. The production bundle excludes all developer replay drivers.
Screenshot observations and exact pixel readback verify the compositor bridge;
these do not prove every frame on every GPU or audible equivalence. Emscripten's
SDL 2.32.8 port differs from host SDL 2.32.10; the engine itself uses no SDL RNG.

Run `npm test`, `npm run build:test-wasm` and `npm run test:browser`. Optional Chrome
and WebKit matrix commands are in BUILDING.md. Final executed counts and any host
launcher failures are recorded in the porting report's validation summary.
