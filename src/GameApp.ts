import { GameEngine } from "./engine/GameEngine";
import { GameRenderer } from "./rendering/GameRenderer";
import { AudioManager } from "./audio/AudioManager";
import { InputManager } from "./input/InputManager";
import { LoadingScreen } from "./ui/LoadingScreen";
export class GameApp {
  engine = new GameEngine();
  renderer!: GameRenderer;
  async initialize() {
    const canvas = document.querySelector<HTMLCanvasElement>("#screen")!;
    const source = document.querySelector<HTMLCanvasElement>("#source")!;
    const renderer = (this.renderer = new GameRenderer(canvas, source));
    const loading = new LoadingScreen();
    const fail = (error: unknown) => {
      loading.fail(error);
      document.querySelector("#error")!.textContent = String(error);
      console.error(error);
    };
    const banner = document.querySelector<HTMLImageElement>("#loading-banner")!;
    banner.src = new URL(
      `${import.meta.env.BASE_URL}assets/branding/nuclear-war-renuked-banner.png`,
      document.baseURI,
    ).href;
    const bannerReady = banner.decode().catch(() => {
      throw Error("Official banner could not be loaded");
    });
    try {
      await Promise.all([
        bannerReady,
        this.engine.load(source, fail, (value, status) =>
          loading.update(value, status),
        ),
      ]);
    } catch (error) {
      fail(error);
      return;
    }
    renderer.attachSpeech(this.engine.module);
    loading.ready();
    const audio = new AudioManager(this.engine);
    const start = document.querySelector<HTMLButtonElement>("#start")!;

    start.onclick = () => {
      if (start.disabled) return;
      start.disabled = true;
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
