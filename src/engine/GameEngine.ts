import type { EngineFactory, GameStatus, WasmModule } from './GameBridge';
export class GameEngine {
  module!:WasmModule;
  private started=false;
  async load(canvas:HTMLCanvasElement, fail:(reason:unknown)=>void) {
    const replay=import.meta.env.DEV&&new URLSearchParams(location.search).has('testReplay');
    const base=new URL(replay?'./build/browser-engine/':`${import.meta.env.BASE_URL}engine/`,document.baseURI);
    const factory=(await import(/* @vite-ignore */new URL('nuclearwar.js',base).href)).default as EngineFactory;
    this.module=await factory({ canvas, noInitialRun:true, locateFile:(name:string)=>new URL(name,base).href, print:console.log, printErr:console.warn, onAbort:fail, onGameError:fail });
    const m=this.module;
    m.FS.mkdirTree('/saves');
    m.FS.mount(m.IDBFS,{autoPersist:true},'/saves');
    await new Promise<void>(resolve=>m.FS.syncfs(true,(error?:Error)=>{if(error)console.warn('Save storage unavailable; scores persist for this visit only',error);resolve();}));
  }
  start() {if(this.started)return;this.started=true;this.module.callMain([]);}
  input(kind:number,x=0,y=0) {this.module._web_input(kind,x,y);}
  status():GameStatus {return JSON.parse(this.module.UTF8ToString(this.module._web_status()));}
}
