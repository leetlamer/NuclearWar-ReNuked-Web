import type { EngineFactory, GameStatus, WasmModule } from "./GameBridge";
export class GameEngine {
  module!: WasmModule;
  private started = false;
  async load(
    canvas: HTMLCanvasElement,
    fail: (reason: unknown) => void,
    progress: (value: number, status: string) => void = () => {},
  ) {
    const replay =
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has("testReplay");
    const base = new URL(
      replay ? "./build/browser-engine/" : `${import.meta.env.BASE_URL}engine/`,
      document.baseURI,
    );
    const manifestResponse = await fetch(
      new URL(
        `${import.meta.env.BASE_URL}assets/data/manifest.json`,
        document.baseURI,
      ),
    );
    if (!manifestResponse.ok)
      throw Error(`Asset manifest: HTTP ${manifestResponse.status}`);
    const manifest = await manifestResponse.json();
    if (!Array.isArray(manifest.images) || !Array.isArray(manifest.audio))
      throw Error("Invalid asset manifest");
    progress(4, "Loading game engine...");
    // Fetch measurable binary bytes ourselves, then supply them to Emscripten.
    // Task weights reserve 20% for instantiation, actual renderer/audio validation and saves.
    const response = await fetch(new URL("nuclearwar.js", base));
    if (!response.ok) throw Error(`Engine module: HTTP ${response.status}`);
    await response.arrayBuffer();
    progress(12, "Loading game engine...");
    const totals = new Map<
      string,
      { loaded: number; total: number; done: boolean }
    >();
    const download = async (name: string) => {
      const response = await fetch(new URL(name, base));
      if (!response.ok) throw Error(`${name}: HTTP ${response.status}`);
      const total = Number(response.headers.get("Content-Length")) || 0,
        reader = response.body?.getReader(),
        parts: Uint8Array[] = [];
      const item = { loaded: 0, total, done: false };
      totals.set(name, item);
      const update = () => {
        let sum = 0;
        for (const key of ["nuclearwar.wasm", "nuclearwar.data"]) {
          const n = totals.get(key);
          sum += n
            ? n.done
              ? 1
              : n.total
                ? Math.min(0.99, n.loaded / n.total)
                : 0
            : 0;
        }
        progress(12 + 28 * sum, "Loading game engine and graphics...");
      };
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          item.loaded += value.length;
          update();
        }
      } else {
        const bytes = new Uint8Array(await response.arrayBuffer());
        parts.push(bytes);
        item.loaded = bytes.length;
      }
      item.done = true;
      update();
      const bytes = new Uint8Array(item.loaded);
      let offset = 0;
      for (const part of parts) {
        bytes.set(part, offset);
        offset += part.length;
      }
      return bytes.buffer;
    };
    const [wasm, data] = await Promise.all([
      download("nuclearwar.wasm"),
      download("nuclearwar.data"),
    ]);
    const factory = (
      await import(/* @vite-ignore */ new URL("nuclearwar.js", base).href)
    ).default as EngineFactory;
    this.module = await factory({
      canvas,
      noInitialRun: true,
      wasmBinary: wasm,
      getPreloadedPackage: () => data,
      locateFile: (name: string) => new URL(name, base).href,
      print: console.log,
      printErr: console.warn,
      onAbort: fail,
      onGameError: fail,
    });
    progress(76, "Loading graphics and bitmap font...");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const m = this.module;
    let error = m.UTF8ToString(m._web_prepare_graphics());
    if (error) throw Error(error);
    progress(85, "Preparing audio...");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    error = m.UTF8ToString(m._web_prepare_audio());
    if (error) throw Error(error);
    progress(92, "Loading saved scores...");
    m.FS.mkdirTree("/saves");
    // A blocked/disabled storage service is optional, unlike game assets. Probe
    // opening before mounting: a late probe can only close a DB, never hydrate
    // stale scores into a game that has already started using memory storage.
    const available = await new Promise<boolean>((resolve) => {
      let finished = false;
      const done = (ok: boolean) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(ok);
        }
      };
      const timer = setTimeout(() => done(false), 3000);
      try {
        const request = indexedDB.open("/saves");
        request.onsuccess = () => {
          request.result.close();
          done(true);
        };
        request.onerror = request.onblocked = () => done(false);
      } catch {
        done(false);
      }
    });
    if (available) {
      m.FS.mount(m.IDBFS, { autoPersist: true }, "/saves");
      await new Promise<void>((resolve) =>
        m.FS.syncfs(true, (error?: Error) => {
          if (error)
            console.warn(
              "Save storage unavailable; scores persist for this visit only",
              error,
            );
          resolve();
        }),
      );
    } else
      console.warn(
        "Save storage unavailable; scores persist for this visit only",
      );
    progress(98, "Initializing game...");
  }
  start() {
    if (this.started) return;
    this.started = true;
    this.module.callMain([]);
  }
  input(kind: number, x = 0, y = 0) {
    this.module._web_input(kind, x, y);
  }
  status(): GameStatus {
    return JSON.parse(this.module.UTF8ToString(this.module._web_status()));
  }
}
