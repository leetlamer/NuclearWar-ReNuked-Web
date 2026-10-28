// SDL2's Emscripten backend creates this module-owned Web Audio context.
Module['getAudioContext'] = () => Module['SDL2']?.audioContext ?? null;
