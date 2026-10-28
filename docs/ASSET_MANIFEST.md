# Runtime assets

All assets are local copies from the completed desktop source. PNG/WAV/data bytes
are unchanged; the parity test checks their reference SHA-256 values. The bitmap
font and text IDs/order are preserved. Browser resources are preloaded at virtual
`/assets`; Vite also includes direct asset copies for favicon/inspection. No raw
Amiga binary, `.s8`, native library or external asset server is required.

| Asset | Format / size |
|---|---|
| `assets/audio/effects/ai_victory.wav` | WAV PCM 9586 Hz, 1ch, 5914 samples |
| `assets/audio/effects/bomber_engine.wav` | WAV PCM 5911 Hz, 1ch, 7818 samples |
| `assets/audio/effects/cow.wav` | WAV PCM 4961 Hz, 1ch, 11862 samples |
| `assets/audio/effects/defector_steps.wav` | WAV PCM 5067 Hz, 1ch, 5060 samples |
| `assets/audio/effects/explosion.wav` | WAV PCM 17734 Hz, 1ch, 4998 samples |
| `assets/audio/effects/factory.wav` | WAV PCM 27284 Hz, 1ch, 20032 samples |
| `assets/audio/effects/falling_weight.wav` | WAV PCM 4961 Hz, 1ch, 5406 samples |
| `assets/audio/effects/missile_launch.wav` | WAV PCM 4961 Hz, 1ch, 6468 samples |
| `assets/audio/effects/propaganda.wav` | WAV PCM 3550 Hz, 1ch, 5400 samples |
| `assets/audio/effects/selection_bleep.wav` | WAV PCM 5067 Hz, 1ch, 506 samples |
| `assets/audio/effects/shutter.wav` | WAV PCM 8547 Hz, 1ch, 8820 samples |
| `assets/audio/effects/typewriter.wav` | WAV PCM 27928 Hz, 1ch, 128 samples |
| `assets/audio/effects/warhead_exclamation.wav` | WAV PCM 5358 Hz, 1ch, 12904 samples |
| `assets/branding/linux/128x128/nuclear-war-renuked.png` | PNG 128×128 |
| `assets/branding/linux/16x16/nuclear-war-renuked.png` | PNG 16×16 |
| `assets/branding/linux/256x256/nuclear-war-renuked.png` | PNG 256×256 |
| `assets/branding/linux/32x32/nuclear-war-renuked.png` | PNG 32×32 |
| `assets/branding/linux/48x48/nuclear-war-renuked.png` | PNG 48×48 |
| `assets/branding/linux/512x512/nuclear-war-renuked.png` | PNG 512×512 |
| `assets/branding/linux/64x64/nuclear-war-renuked.png` | PNG 64×64 |
| `assets/branding/manifest.json` | JSON |
| `assets/branding/nuclear-war-renuked-icon.png` | PNG 1254×1254 |
| `assets/branding/nuclear-war-renuked.icns` | ICNS |
| `assets/branding/nuclear-war-renuked.ico` | ICO |
| `assets/data/animations.json` | JSON |
| `assets/data/dialogue.json` | JSON |
| `assets/data/interface_layout.json` | JSON |
| `assets/data/manifest.json` | JSON |
| `assets/fonts/original_bitmap.png` | PNG 576×8 |
| `assets/images/backgrounds/character_selection.png` | PNG 320×200 |
| `assets/images/backgrounds/desolate_ending.png` | PNG 320×200 |
| `assets/images/backgrounds/space_ending.png` | PNG 320×200 |
| `assets/images/backgrounds/world_map.png` | PNG 320×200 |
| `assets/images/characters/leader_portraits.png` | PNG 320×160 |
| `assets/images/characters/victory_body.png` | PNG 320×112 |
| `assets/images/effects/large_sprites.png` | PNG 320×432 |
| `assets/images/effects/small_sprites.png` | PNG 320×272 |
| `assets/images/interface/control_tiles.png` | PNG 320×272 |
| `assets/images/interface/main_window.png` | PNG 320×200 |
| `assets/images/interface/selection_backdrops.png` | PNG 320×432 |
| `assets/images/missiles/flight_and_effects.png` | PNG 320×288 |

Totals: {'.wav': 13, '.png': 21, '.json': 5, '.icns': 1, '.ico': 1}. The canonical WAV rate is not a replacement for the original
cue's effective rate: C++ still uses audio clock 3546895 / cue period and the existing
sample-specific ooo multiplier. The full original WAV may be longer than a played cue.

The master branding PNG, ICO and ICNS are retained as copied provenance; the web
favicon uses the 64px PNG and the preserved SDL window setup reads the 256px PNG.
They do not replace original in-game artwork. Frame rectangles/timing remain in
`wasm/src/rendering/animations` and `assets/data/animations.json`.
