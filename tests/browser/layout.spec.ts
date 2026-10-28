import { test, expect } from "@playwright/test";

const sizes = [
  [1920, 1080],
  [2560, 1440],
  [1366, 768],
  [1280, 720],
  [1024, 600],
  [800, 450],
  [640, 360],
  [360, 640],
  [320, 240],
  [240, 640],
];
for (const [width, height] of sizes) {
  test(`fits viewport ${width}x${height} with accurate selection hitboxes`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await page.waitForTimeout(500);
    const layout = await page.evaluate(() => {
      const canvas = document.querySelector("#screen")!,
        r = canvas.getBoundingClientRect();
      const s = Math.min(r.width / 320, r.height / 200);
      return {
        scrollW: document.documentElement.scrollWidth,
        scrollH: document.documentElement.scrollHeight,
        width: innerWidth,
        height: innerHeight,
        active: {
          left: r.left + (r.width - 320 * s) / 2,
          top: r.top + (r.height - 200 * s) / 2,
          width: 320 * s,
          height: 200 * s,
        },
        footer: document.querySelector("footer")!.getBoundingClientRect()
          .bottom,
        source: [
          (document.querySelector("#source") as HTMLCanvasElement).width,
          (document.querySelector("#source") as HTMLCanvasElement).height,
        ],
      };
    });
    expect(layout.scrollW).toBeLessThanOrEqual(width);
    expect(layout.scrollH).toBeLessThanOrEqual(height);
    expect(layout.footer).toBeLessThanOrEqual(height + 0.5);
    expect(layout.source).toEqual([320, 200]);
    const a = layout.active;
    expect(a.left).toBeGreaterThanOrEqual(0);
    expect(a.top).toBeGreaterThanOrEqual(0);
    expect(a.width).toBeGreaterThan(0);
    expect(a.height).toBeGreaterThan(0);
    expect(a.left + a.width).toBeLessThanOrEqual(width + 0.5);
    expect(a.top + a.height).toBeLessThanOrEqual(height + 0.5);
    expect(a.width / a.height).toBeCloseTo(1.6, 8);
    const click = async (x: number, y: number) =>
      page.mouse.click(
        a.left + (x * a.width) / 320,
        a.top + (y * a.height) / 200,
      );
    await click(25, 65);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).nuclearWar.engine.status().selected,
        ),
      )
      .toBe(1);
    // Both horizontal and vertical letterbox bars must ignore a down/up gesture.
    const r = (await page.locator("#screen").boundingBox())!;
    if (a.top > r.y + 2) await page.mouse.click(r.x + r.width / 2, r.y + 1);
    else if (a.left > r.x + 2)
      await page.mouse.click(r.x + 1, r.y + r.height / 2);
    expect(
      await page.evaluate(
        () => (window as any).nuclearWar.engine.status().selected,
      ),
    ).toBe(1);
    await page.screenshot({ path: info.outputPath("character-selection.png") });
    await click(150, 20);
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).nuclearWar.engine.status().screen),
      )
      .toBe(2);
    await page.screenshot({ path: info.outputPath("main-game.png") });
  });
}

test("resizes a running game and enters/exits fullscreen without resetting state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await page.waitForTimeout(500);
  const initial = await page.evaluate(() =>
    (window as any).nuclearWar.engine.status(),
  );
  for (const [width, height] of [
    [1280, 720],
    [500, 800],
    [800, 450],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(100);
    expect(
      await page.evaluate(
        () => (window as any).nuclearWar.engine.status().selected,
      ),
    ).toBe(initial.selected);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.id))
    .toBe("game");
  const full = (await page.locator("#screen").boundingBox())!;
  const scale = Math.min(full.width / 320, full.height / 200);
  await page.mouse.click(
    full.x + (full.width - 320 * scale) / 2 + 25 * scale,
    full.y + (full.height - 200 * scale) / 2 + 65 * scale,
  );
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).nuclearWar.engine.status().selected),
    )
    .toBe(1);
  await page.evaluate(() => document.exitFullscreen());
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement))
    .toBeNull();
  expect(
    await page.evaluate(
      () => (window as any).nuclearWar.engine.status().selected,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
});

test("uses device pixel ratio for sharpness without enlarging CSS layout", async ({
  browser,
  browserName,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await page.waitForTimeout(500);
  const v = await page.locator("#screen").evaluate((c: HTMLCanvasElement) => ({
    w: c.width,
    h: c.height,
    cssW: c.getBoundingClientRect().width,
    cssH: c.getBoundingClientRect().height,
    dpr: devicePixelRatio,
  }));
  expect(v.dpr).toBe(2);
  expect(v.w).toBe(Math.round(v.cssW * 2));
  expect(v.h).toBe(Math.round(v.cssH * 2));
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (browserName === "chromium") {
    const session = await context.newCDPSession(page);
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1.25,
      mobile: false,
    });
    await expect
      .poll(() =>
        page.locator("#screen").evaluate((c: HTMLCanvasElement) => ({
          w: c.width,
          expected: Math.round(
            c.getBoundingClientRect().width * devicePixelRatio,
          ),
        })),
      )
      .toEqual({
        w: Math.round(v.cssW * 1.25),
        expected: Math.round(v.cssW * 1.25),
      });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await context.close();
});
