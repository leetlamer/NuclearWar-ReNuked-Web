import { test, expect } from "@playwright/test";
for (const actor of [0, 1, 2, 3])
  for (const message of [
    "A glyph.",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ gypqj are clear.",
  ])
    test(`speaker ${actor}: proportional original font, ${message.length > 26 ? "long" : "short"} speech and emoji`, async ({
      browser,
    }, info) => {
      const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          deviceScaleFactor: 2,
        }),
        page = await context.newPage();
      await page.goto("/?testReplay=1");
      await expect(page.locator("#start")).toBeEnabled();
      await page.evaluate(
        ({ actor, message }) => {
          const m = (window as any).nuclearWar.engine.module,
            f = m.callMain;
          m.callMain = () =>
            f([
              "--smoke-test",
              "/test",
              "--media-fixture",
              "speech",
              "--browser-realtime",
              "--replay-actor",
              String(actor),
              "--browser-speech",
              message,
            ]);
        },
        { actor, message },
      );
      await page.locator("#start").click();
      await page.waitForTimeout(200);
      const frame = () =>
        page.evaluate(() => {
          const m = (window as any).nuclearWar.engine.module;
          return JSON.parse(
            m.UTF8ToString(m._web_speech_frame()),
          ) as number[][];
        });
      const early = (await frame()).length;
      expect(early).toBeGreaterThan(0);
      await page.waitForTimeout(1400);
      const cells = await frame();
      if (message.length > 26) expect(cells.length).toBeGreaterThan(early);
      expect(cells.length).toBe(
        message.replace(/ /g, " ").length - (message.length > 26 ? 1 : 0),
      ); // wrapping consumes the separator space
      for (const cell of cells) {
        expect(cell[3]).toBe(5);
        expect(cell[4]).toBeCloseTo((8 * 5) / 6, 5);
        expect(cell[3] / 6).toBeCloseTo(cell[4] / 8, 6);
      }
      const rows = [...new Set(cells.map((c) => c[2]))];
      if (rows.length > 1) expect(rows[1] - rows[0]).toBe(7);
      const difference = await page.evaluate(
        async ({ long }) => {
          const app = (window as any).nuclearWar,
            m = app.engine.module;
          const cells = JSON.parse(
            m.UTF8ToString(m._web_speech_frame()),
          ) as number[][];
          const atlas = JSON.parse(m.UTF8ToString(m._web_speech_font()));
          const image = new Image();
          image.src = new URL(
            "assets/fonts/original_bitmap.png",
            document.baseURI,
          ).href;
          await image.decode();
          const fc = document.createElement("canvas");
          fc.width = 576;
          fc.height = 8;
          const fctx = fc.getContext("2d")!;
          fctx.drawImage(image, 0, 0);
          const original = fctx.getImageData(0, 0, 576, 8).data;
          let originalDifferences = 0;
          for (let n = 0; n < original.length; n++)
            if (
              (n % 4 === 3 || original[n - (n % 4) + 3] !== 0) &&
              original[n] !== atlas.pixels[n]
            )
              originalDifferences++;
          app.renderer.render();
          const c = document.querySelector("#screen") as HTMLCanvasElement,
            gl = c.getContext("webgl2")!,
            v = gl.getParameter(gl.VIEWPORT),
            pixels = new Uint8Array(c.width * c.height * 4);
          gl.readPixels(
            0,
            0,
            c.width,
            c.height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels,
          );
          let differences = 0;
          const selected = [cells[0]];
          if (long) selected.push(cells.find((c) => c[2] !== cells[0][2])!);
          for (const [source, x, y, w, h] of selected)
            for (let sy = 0; sy < 8; sy++)
              for (let sx = 0; sx < 6; sx++) {
                const alpha = original[(sy * 576 + source + sx) * 4 + 3];
                const color = alpha ? [187, 0, 0] : [255, 255, 255];
                const gx =
                    v[0] +
                    Math.floor(((x + ((sx + 0.5) * w) / 6) * v[2]) / 320),
                  gy =
                    v[1] +
                    Math.floor(((200 - y - ((sy + 0.5) * h) / 8) * v[3]) / 200);
                for (let channel = 0; channel < 3; channel++)
                  if (
                    pixels[(gy * c.width + gx) * 4 + channel] !== color[channel]
                  )
                    differences++;
              }
          return { originalDifferences, differences };
        },
        { long: message.length > 26 },
      );
      expect(difference).toEqual({ originalDifferences: 0, differences: 0 });
      const r = (await page.locator("#screen").boundingBox())!,
        scale = Math.min(r.width / 320, r.height / 200),
        x = actor < 2 ? 45 : 296,
        y = actor % 2 ? 154 : 5;
      const emoji = () =>
        page.evaluate(
          ({ x, y }) =>
            Array.from(
              (document.querySelector("#source") as HTMLCanvasElement)
                .getContext("2d")!
                .getImageData(x, y, 16, 16).data,
            ),
          { x, y },
        );
      const old = await emoji();
      await page.mouse.click(
        r.x + (r.width - 320 * scale) / 2 + (x + 8) * scale,
        r.y + (r.height - 200 * scale) / 2 + (y + 8) * scale,
      );
      await page.waitForTimeout(50);
      expect(await emoji()).not.toEqual(old);
      expect(
        await page.evaluate(
          () => (window as any).nuclearWar.engine.status().speech,
        ),
      ).toBe(true);
      // Every glyph fits inside the unchanged bubble; no border pixels are overdrawn.
      const width = Math.min(
          144,
          8 * Math.floor((Math.min(message.length, 26) * 5 + 19) / 8),
        ),
        bx = actor < 2 ? 63 : 257 - width,
        by = actor % 2 ? (message.length > 26 ? 180 : 187) : 38;
      for (const [, gx, gy, w, h] of await frame()) {
        expect(gx).toBeGreaterThan(bx);
        expect(gx + w).toBeLessThan(bx + width - 1);
        expect(gy).toBeGreaterThan(by);
        expect(gy + h).toBeLessThan(by + (message.length > 26 ? 20 : 13) - 1);
      }
      await page.screenshot({ path: info.outputPath("speech.png") });
      await context.close();
    });
for (const [width, height] of [
  [1366, 768],
  [800, 450],
  [640, 360],
])
  test(`same desktop speech message fits ${width}x${height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto("/?testReplay=1");
    await expect(page.locator("#start")).toBeEnabled();
    await page.evaluate(() => {
      const m = (window as any).nuclearWar.engine.module,
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
    await page.waitForTimeout(500);
    const glyphs = await page.evaluate(() => {
      const m = (window as any).nuclearWar.engine.module;
      return JSON.parse(m.UTF8ToString(m._web_speech_frame())) as number[][];
    });
    expect(glyphs).toHaveLength("I will crush you!".length);
    for (let n = 1; n < glyphs.length; n++)
      expect(glyphs[n][1] - glyphs[n - 1][1]).toBe(5);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath("speech-message.png") });
    const r = (await page.locator("#screen").boundingBox())!,
      scale = Math.min(r.width / 320, r.height / 200);
    await page.mouse.click(
      r.x + (r.width - 320 * scale) / 2 + 85 * scale,
      r.y + (r.height - 200 * scale) / 2 + 20 * scale,
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          const m = (window as any).nuclearWar.engine.module;
          return JSON.parse(m.UTF8ToString(m._web_speech_frame())).length;
        }),
      )
      .toBe(0);
  });
