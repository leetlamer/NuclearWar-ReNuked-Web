export interface WasmModule {
  _web_input(kind: number, x: number, y: number): void;
  _web_status(): number;
  _web_prepare_graphics(): number;
  _web_prepare_audio(): number;
  _web_mute(value: number): void;
  _web_audio_muted(): number;
  UTF8ToString(address: number): string;
  callMain(args: string[]): void;
  FS: {
    mkdirTree(path: string): void;
    mount(type: unknown, options: object, path: string): void;
    syncfs(populate: boolean, done: (error?: Error) => void): void;
  };
  IDBFS: unknown;
  getAudioContext(): AudioContext | null;
}
export interface GameStatus {
  screen: number;
  round: number;
  stage: number;
  selected: number;
  active: boolean;
  eligible: boolean;
  ending: boolean;
  phase: string;
  revengePending?: boolean;
}
export type EngineFactory = (
  options: Record<string, unknown>,
) => Promise<WasmModule>;
