import type { GameEngine } from "../engine/GameEngine";
import {
  displayToLogical,
  GAME_WIDTH,
  GAME_HEIGHT,
} from "../rendering/viewport";
import type { AudioManager } from "../audio/AudioManager";
export class InputManager {
  constructor(
    canvas: HTMLCanvasElement,
    engine: GameEngine,
    audio: AudioManager,
  ) {
    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const p = displayToLogical(
        r.width,
        r.height,
        e.clientX - r.left,
        e.clientY - r.top,
      );
      return [p.x, p.y];
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      canvas.focus();
      canvas.setPointerCapture(e.pointerId);
      void audio.unlock();
      const [x, y] = point(e);
      if (x >= 0 && x < GAME_WIDTH && y >= 0 && y < GAME_HEIGHT)
        engine.input(1, x, y);
    });
    canvas.addEventListener("pointerup", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const [x, y] = point(e);
      engine.input(2, x, y);
    });
    canvas.addEventListener("pointermove", (e) => {
      const [x, y] = point(e);
      engine.input(0, x, y);
    });
    canvas.addEventListener("pointercancel", () => engine.input(3));
    window.addEventListener("blur", () => engine.input(3));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
