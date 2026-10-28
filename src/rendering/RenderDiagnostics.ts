import { logicalToDisplay, GAME_WIDTH, GAME_HEIGHT } from "./viewport";
import type { GameRenderer } from "./GameRenderer";
/** Loaded only by a dev build with ?debugRender=1. Never takes pointer input. */
export function attachDiagnostics(
  canvas: HTMLCanvasElement,
  read: () => ReturnType<GameRenderer["diagnostics"]>,
) {
  const layer = document.createElement("div");
  layer.dataset.renderDiagnostics = "";
  layer.style.cssText =
    "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:3";
  canvas.parentElement!.append(layer);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const text = document.createElement("pre");
  text.style.cssText =
    "position:absolute;left:4px;top:4px;margin:0;background:#000c;color:white;font:10px/1.3 monospace;max-height:48%;overflow:hidden";
  layer.append(svg, text);
  const draw = () => {
    const d = read();
    if (!d) return;
    const v = d.active;
    const sdl = (window as any).nuclearWar?.engine?.module?.SDL2?.image;
    const sprites = [
      { name: "title", x: 0, y: 0, w: 320, h: 47 },
      { name: "portrait 0", x: 0, y: 50, w: 68, h: 50 },
      { name: "portrait 9", x: 252, y: 150, w: 68, h: 50 },
    ];
    svg.setAttribute("viewBox", `0 0 ${d.css.width} ${d.css.height}`);
    svg.innerHTML = `<rect x="${v.x + 0.5}" y="${v.y + 0.5}" width="${v.width - 1}" height="${v.height - 1}" fill="none" stroke="lime"/><rect x="${v.x + 2}" y="${v.y + 2}" width="${v.width - 4}" height="${v.height - 4}" fill="none" stroke="magenta" stroke-dasharray="4 4"/><path d="M${v.x},${v.y + 15} V${v.y} H${v.x + 15}" fill="none" stroke="yellow"/>`;
    const boxes = sprites.map((s) => {
      const p = logicalToDisplay(d.css.width, d.css.height, s.x, s.y);
      const q = logicalToDisplay(
        d.css.width,
        d.css.height,
        s.x + s.w,
        s.y + s.h,
      );
      svg.innerHTML += `<rect x="${p.x}" y="${p.y}" width="${q.x - p.x}" height="${q.y - p.y}" fill="none" stroke="cyan"/>`;
      return {
        ...s,
        display: { left: p.x, top: p.y, width: q.x - p.x, height: q.y - p.y },
      };
    });
    text.textContent = JSON.stringify(
      {
        logical: [GAME_WIDTH, GAME_HEIGHT],
        sdlFramebuffer: sdl ? [sdl.width, sdl.height] : null,
        origin: "top-left SDL → centered full-frame mesh",
        ...d,
        boxes,
      },
      null,
      1,
    );
    requestAnimationFrame(draw);
  };
  draw();
}
