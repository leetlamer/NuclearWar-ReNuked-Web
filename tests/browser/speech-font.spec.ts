import { test, expect } from "@playwright/test";
for (const actor of [0, 1, 2, 3])
  for (const message of [
    "A glyph.",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ gypqj are clear.",
  ])
    test(`speaker ${actor}: native bitmap glyphs, ${message.length > 26 ? "long" : "short"} speech and emoji coexist`, async ({
      page,
    }, info) => {
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
      const before = await page.evaluate(() =>
        (window as any).nuclearWar.engine.status(),
      );
      expect(before.speech).toBe(true);
      const ink = () =>
        page.evaluate(
          ({ actor, length }) => {
            const width = Math.min(
                144,
                8 * Math.floor((Math.min(length, 26) * 5 + 19) / 8),
              ),
              x = actor < 2 ? 63 : 257 - width,
              y = actor % 2 ? (length > 26 ? 180 : 187) : 38;
            const p = (document.querySelector("#source") as HTMLCanvasElement)
              .getContext("2d")!
              .getImageData(
                x + 1,
                y + 1,
                width - 2,
                length > 26 ? 18 : 11,
              ).data;
            let count = 0;
            for (let n = 0; n < p.length; n += 4)
              if (p[n] === 187 && p[n + 1] === 0 && p[n + 2] === 0) count++;
            return count;
          },
          { actor, length: message.length },
        );
      const initialInk = await ink();

      await page.waitForTimeout(1400);
      if (message.length > 26) expect(await ink()).toBeGreaterThan(initialInk);
      const differences = await page.evaluate(
        async ({ actor, length }) => {
          const source = document.querySelector("#source") as HTMLCanvasElement,
            ctx = source.getContext("2d")!;
          const font = new Image();
          font.src = "/assets/fonts/original_bitmap.png";
          await font.decode();
          const canvas = document.createElement("canvas");
          canvas.width = 576;
          canvas.height = 8;
          const fc = canvas.getContext("2d")!;
          fc.drawImage(font, 0, 0);
          const glyph = fc.getImageData(
            ("A".charCodeAt(0) - 32) * 6,
            0,
            5,
            8,
          ).data;
          const width = Math.min(
              144,
              8 * Math.floor((Math.min(length, 26) * 5 + 19) / 8),
            ),
            x = actor < 2 ? 63 : 257 - width,
            y = actor % 2 ? (length > 26 ? 180 : 187) : 38;
          const pixels = ctx.getImageData(x + 6, y + 3, 5, 8).data;
          let diff = 0;
          for (let i = 0; i < 40; i++) {
            const expected = glyph[i * 4 + 3] ? [187, 0, 0] : [255, 255, 255];
            for (let c = 0; c < 3; c++)
              if (pixels[i * 4 + c] !== expected[c]) diff++;
          }
          return diff;
        },
        { actor, length: message.length },
      );
      expect(differences).toBe(0);
      if (message.length > 26) {
        const d = await page.evaluate(async (actor: number) => {
          const i = new Image();
          i.src = "/assets/fonts/original_bitmap.png";
          await i.decode();
          const c = document.createElement("canvas");
          c.width = 576;
          c.height = 8;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(i, 0, 0);
          const g = ctx.getImageData(
            ("g".charCodeAt(0) - 32) * 6,
            0,
            5,
            8,
          ).data;
          const x = actor < 2 ? 63 : 113,
            y = actor % 2 ? 180 : 38;
          const pixels = (
            document.querySelector("#source") as HTMLCanvasElement
          )
            .getContext("2d")!
            .getImageData(x + 6, y + 11, 5, 8).data;
          let diff = 0;
          for (let n = 0; n < 40; n++)
            for (let k = 0; k < 3; k++)
              if (pixels[n * 4 + k] !== (g[n * 4 + 3] ? [187, 0, 0][k] : 255))
                diff++;
          return diff;
        }, actor);
        expect(d).toBe(0);
      }

      const r = (await page.locator("#screen").boundingBox())!,
        s = Math.min(r.width / 320, r.height / 200),
        x = actor < 2 ? 45 : 296,
        y = actor % 2 ? 154 : 5;
      const point = {
        x: r.x + (r.width - 320 * s) / 2 + (x + 8) * s,
        y: r.y + (r.height - 200 * s) / 2 + (y + 8) * s,
      };
      const pixels = () =>
        page.evaluate(
          ({ x, y }) =>
            Array.from(
              (document.querySelector("#source") as HTMLCanvasElement)
                .getContext("2d")!
                .getImageData(x - 3, y, 16, 16).data,
            ),
          { x, y },
        );
      const old = await pixels();
      await page.mouse.click(point.x, point.y);
      await page.waitForTimeout(50);
      expect(await pixels()).not.toEqual(old);
      expect(
        await page.evaluate(
          () => (window as any).nuclearWar.engine.status().speech,
        ),
      ).toBe(true);
      expect(
        (await page.evaluate(() => (window as any).nuclearWar.engine.status()))
          .eventIndex,
      ).toBe(before.eventIndex);
      await page.screenshot({ path: info.outputPath("speech.png") });
    });
