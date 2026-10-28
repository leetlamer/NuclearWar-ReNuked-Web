import type {GameEngine} from '../engine/GameEngine';
/** SDL's Emscripten audio driver mixes the unchanged C++ PCM into Web Audio. */
export class AudioManager {
  private muted=false;
  constructor(private engine:GameEngine){}
  async unlock(){const ctx=this.engine.module?.getAudioContext();if(ctx&&!this.muted)await ctx.resume();}
  async mute(value:boolean){this.muted=value;const ctx=this.engine.module?.getAudioContext();if(ctx)await (value?ctx.suspend():ctx.resume());}
}
