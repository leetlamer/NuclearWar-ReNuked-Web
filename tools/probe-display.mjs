import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const label = process.argv[2] || "probe";
const browser = await chromium.launch();
for (const dpr of [1, 1.25, 2]) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: dpr,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await page.waitForTimeout(700);
  const probe = await page.evaluate(() => {
    const app = window.nuclearWar,
      render = app.renderer;
    render.render();
    const c = document.querySelector("#screen"),
      s = document.querySelector("#source"),
      gl = c.getContext("webgl2");
    return {
      dpr: devicePixelRatio,
      css: c.getBoundingClientRect().toJSON(),
      buffer: [c.width, c.height],
      source: [s.width, s.height],
      sdlImage: [
        app.engine.module.SDL2?.image?.width,
        app.engine.module.SDL2?.image?.height,
      ],
      viewport: [...gl.getParameter(gl.VIEWPORT)],
      camera: {
        left: render.camera.left,
        right: render.camera.right,
        top: render.camera.top,
        bottom: render.camera.bottom,
        zoom: render.camera.zoom,
        position: render.camera.position.toArray(),
      },
      scene: render.scene.children.map((x) => ({
        position: x.position.toArray(),
        scale: x.scale.toArray(),
      })),
      sourcePNG: s.toDataURL(),
    };
  });
  writeFileSync(
    `build/display-${label}-${dpr}.json`,
    JSON.stringify({ ...probe, sourcePNG: undefined }, null, 2),
  );
  writeFileSync(
    `build/display-${label}-source-${dpr}.png`,
    Buffer.from(probe.sourcePNG.split(",")[1], "base64"),
  );
  await page.screenshot({ path: `build/display-${label}-${dpr}.png` });
  console.log({ ...probe, sourcePNG: undefined });
  await context.close();
}
await browser.close();
