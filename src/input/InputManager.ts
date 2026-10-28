import type { GameEngine } from "../engine/GameEngine";
import { contentBounds } from "../rendering/viewport";
import type { AudioManager } from "../audio/AudioManager";
export class InputManager {
  constructor(
    canvas: HTMLCanvasElement,
    engine: GameEngine,
    audio: AudioManager,
  ) {
    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect(),
        v = contentBounds(r.width, r.height);
      return [
        Math.floor(((e.clientX - r.left - v.x) * 320) / v.width),
        Math.floor(((e.clientY - r.top - v.y) * 200) / v.height),
      ];
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      canvas.focus();
      canvas.setPointerCapture(e.pointerId);
      void audio.unlock();
      const [x, y] = point(e);
      if (x >= 0 && x < 320 && y >= 0 && y < 200) engine.input(1, x, y);
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
