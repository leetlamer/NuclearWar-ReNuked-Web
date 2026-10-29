import { test, expect } from "@playwright/test";

for (const [dpr, width, height] of [
  [1, 1280, 720],
  [1.25, 1280, 720],
  [2, 1280, 720],
  [2, 1920, 1080],
  [2, 1366, 768],
  [2, 800, 450],
]) {
  test(`title ${width}x${height} source and Three.js pixels match desktop at DPR ${dpr}`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Start Game", exact: true }).click();
    await page.waitForTimeout(600);
    const result = await page.evaluate(async () => {
      const app = (window as any).nuclearWar,
        m = app.engine.module;
      const s = document.querySelector("#source") as HTMLCanvasElement,
        c = document.querySelector("#screen") as HTMLCanvasElement;
      const expected = new Image();
      expected.src = new URL(
        "docs/validation/display-coordinates/desktop-selection.png",
        document.baseURI,
      ).href;
      await expected.decode();
      const ref = document.createElement("canvas");
      ref.width = 320;
      ref.height = 200;
      const ctx = ref.getContext("2d")!;
      ctx.drawImage(expected, 0, 0);
      const baseline = ctx.getImageData(0, 0, 320, 200).data;
      // Animated 32x32 faces have variable time poses; the title, labels and all portrait bounds must match exactly.
      const portraits = (
        await (
          await fetch(
            new URL("assets/data/interface_layout.json", document.baseURI),
          )
        ).json()
      ).portraits as number[][];
      app.renderer.render();
      const source = s.getContext("2d")!.getImageData(0, 0, 320, 200).data;
      const gl = c.getContext("webgl2")!,
        vp = gl.getParameter(gl.VIEWPORT) as Int32Array;
      const displayed = new Uint8Array(c.width * c.height * 4);
      gl.readPixels(
        0,
        0,
        c.width,
        c.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        displayed,
      );
      let nativeDifferences = 0,
        displayDifferences = 0,
        checked = 0;
      for (let y = 0; y < 200; y++)
        for (let x = 0; x < 320; x++) {
          const face = portraits.some(
            (r) =>
              x >= r[0] + 13 && x < r[0] + 45 && y >= r[1] + 5 && y < r[1] + 37,
          );
          const gx = vp[0] + Math.floor(((x + 0.5) * vp[2]) / 320),
            gy = vp[1] + Math.floor(((199 - y + 0.5) * vp[3]) / 200);
          for (let channel = 0; channel < 3; channel++) {
            const value = source[(y * 320 + x) * 4 + channel];
            if (!face) {
              checked++;
              if (value !== baseline[(y * 320 + x) * 4 + channel])
                nativeDifferences++;
            }
            if (value !== displayed[(gy * c.width + gx) * 4 + channel])
              displayDifferences++;
          }
        }
      return {
        source: [s.width, s.height],
        sdl: [m.SDL2.image.width, m.SDL2.image.height],
        nativeDifferences,
        displayDifferences,
        checked,
      };
    });
    expect(result.source).toEqual([320, 200]);
    expect(result.sdl).toEqual([320, 200]);
    expect(result.checked).toBeGreaterThan(150000);
    expect(result.nativeDifferences).toBe(0);
    expect(result.displayDifferences).toBe(0);
    await page.screenshot({ path: info.outputPath("title.png") });
    await context.close();
  });
}

test("logical sprite corners project correctly and pointer mapping reverses the transform", async ({
  page,
}) => {
  await page.goto("/?debugRender=1");
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  await page.waitForTimeout(500);
  await expect(page.locator("[data-render-diagnostics]")).toBeVisible();
  const result = await page.evaluate(async () => {
    const { logicalToDisplay, displayToLogical } = await import(
      new URL("src/rendering/viewport.ts", document.baseURI).href
    );
    const { Vector3 } = await import(
      new URL("node_modules/.vite/deps/three.js", document.baseURI).href
    );
    const renderer = (window as any).nuclearWar.renderer,
      d = renderer.diagnostics();
    const points = [
      [0, 0],
      [320, 200],
      [0, 50],
      [68, 100],
      [252, 150],
      [320, 200],
    ];
    return points.map(([x, y]) => {
      const projected = new Vector3(x - 160, 100 - y, 0).project(
        renderer.camera,
      );
      const p = {
        x: d.active.x + ((projected.x + 1) * d.active.width) / 2,
        y: d.active.y + ((1 - projected.y) * d.active.height) / 2,
      };
      const direct = logicalToDisplay(d.css.width, d.css.height, x, y);
      const reverse = displayToLogical(
        d.css.width,
        d.css.height,
        direct.x + 0.001,
        direct.y + 0.001,
      );
      return { x, y, projected: p, direct, reverse };
    });
  });
  for (const p of result) {
    expect(p.projected.x).toBeCloseTo(p.direct.x, 6);
    expect(p.projected.y).toBeCloseTo(p.direct.y, 6);
    expect(p.reverse).toEqual({ x: p.x, y: p.y });
  }
});
