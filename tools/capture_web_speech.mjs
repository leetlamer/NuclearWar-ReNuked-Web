import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch(),
  page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });
await page.goto("http://127.0.0.1:5173/?testReplay=1");
await page.waitForFunction(() => !document.querySelector("#start").disabled);
await page.evaluate(() => {
  const m = window.nuclearWar.engine.module,
    f = m.callMain;
  m.callMain = () =>
    f([
      "--smoke-test",
      "/test",
      "--media-fixture",
      "speech",
      "--browser-realtime",
      "--typing-cps",
      "1000",
      "--browser-speech",
      "I will crush you!",
    ]);
});
await page.locator("#start").click();
await page.waitForTimeout(700);
const capture = await page.evaluate(() => {
  const a = window.nuclearWar;
  a.renderer.render();
  const c = document.querySelector("#screen"),
    gl = c.getContext("webgl2"),
    v = gl.getParameter(gl.VIEWPORT),
    data = new Uint8Array(c.width * c.height * 4);
  gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  const message = "I will crush you!",
    bw = 8 * Math.floor((message.length * 5 + 19) / 8),
    x = Math.round(v[0] + (63 * v[2]) / 320),
    top = Math.round(c.height - v[1] - ((200 - 38) * v[3]) / 200),
    w = Math.round((bw * v[2]) / 320),
    h = Math.round((13 * v[3]) / 200);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d"),
    image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let xx = 0; xx < w; xx++)
      for (let k = 0; k < 4; k++)
        image.data[(y * w + xx) * 4 + k] =
          data[((c.height - 1 - (top + y)) * c.width + x + xx) * 4 + k];
  ctx.putImageData(image, 0, 0);
  return {
    png: canvas.toDataURL(),
    cells: JSON.parse(
      a.engine.module.UTF8ToString(a.engine.module._web_speech_frame()),
    ),
    size: [w, h],
    logicalBubble: [63, 38, bw, 13],
  };
});
writeFileSync(
  "build/web-speech-bubble.png",
  Buffer.from(capture.png.split(",")[1], "base64"),
);
writeFileSync(
  "build/web-speech-metrics.json",
  JSON.stringify({ ...capture, png: undefined }, null, 2),
);
await page.screenshot({ path: "build/web-speech-comparison.png" });
await browser.close();
