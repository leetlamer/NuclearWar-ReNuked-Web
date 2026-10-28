import { GameEngine } from "./engine/GameEngine";
import { GameRenderer } from "./rendering/GameRenderer";
import { AudioManager } from "./audio/AudioManager";
import { InputManager } from "./input/InputManager";
export class GameApp {
  engine = new GameEngine();
  renderer!: GameRenderer;
  async initialize() {
    const canvas = document.querySelector<HTMLCanvasElement>("#screen")!;
    const source = document.querySelector<HTMLCanvasElement>("#source")!;
    const renderer = (this.renderer = new GameRenderer(canvas, source));
    const fail = (error: unknown) => {
      document.querySelector("#error")!.textContent = String(error);
      console.error(error);
    };
    await this.engine.load(source, fail);
    const audio = new AudioManager(this.engine);
    const start = document.querySelector<HTMLButtonElement>("#start")!;
    start.disabled = false;
    start.textContent = "Start game";
    start.onclick = () => {
      this.engine.start();
      void audio.mute(
        document.querySelector<HTMLInputElement>("#mute")!.checked,
      );
      new InputManager(canvas, this.engine, audio);
      void audio.unlock();
      start.disabled = true;
      start.textContent = "Game running";
      document.querySelector<HTMLElement>("#loading")!.hidden = true;
      canvas.focus();
    };
    document.querySelector("#fullscreen")!.addEventListener("click", () => {
      void document.querySelector("#game")!.requestFullscreen().catch(fail);
    });
    document.querySelector<HTMLInputElement>("#mute")!.onchange = (e) =>
      void audio.mute((e.target as HTMLInputElement).checked);
    const frame = () => {
      renderer.render();
      requestAnimationFrame(frame);
    };
    frame();
  }
}
