import { test, expect } from "@playwright/test";
test("real resource loading gates readiness, shows supplied banner and starts only on click", async ({
  page,
}, info) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/nuclearwar.wasm", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await expect(page.locator("#start")).toBeDisabled();
  await expect(page.locator("#loading-banner")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("#load-progress")
        .evaluate((p: HTMLProgressElement) => p.value),
    )
    .toBeGreaterThan(0);
  expect(
    await page
      .locator("#load-progress")
      .evaluate((p: HTMLProgressElement) => p.value),
  ).toBeLessThan(100);
  await page.screenshot({ path: info.outputPath("loading.png") });
  release();
  await expect(page.locator("#load-status")).toHaveText(
    "Ready to Play — Click Start Game",
  );
  await expect(page.locator("#load-percent")).toHaveText("100%");
  await expect(page.locator("#start")).toBeEnabled();
  expect(
    await page.evaluate(() => (window as any).nuclearWar.engine.status()),
  ).toEqual({});
  await page.screenshot({ path: info.outputPath("ready.png") });
  await page.locator("#start").click();
  await expect(page.locator("#loading")).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).nuclearWar.engine.status().screen),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).nuclearWar.engine.module.getAudioContext().state,
      ),
    )
    .toBe("running");
});
for (const resource of ["nuclearwar.data", "nuclear-war-renuked-banner.png"]) {
  test(`critical ${resource} failure is visible and retry restores loading`, async ({
    page,
  }) => {
    await page.route(`**/${resource}`, (r) =>
      r.fulfill({ status: 404, body: "missing" }),
    );
    await page.goto("/");
    await expect(page.locator("#load-status")).toContainText("Unable to load");
    await expect(page.locator("#start")).toBeDisabled();
    await expect(page.locator("#retry")).toBeVisible();
    expect(
      await page
        .locator("#load-progress")
        .evaluate((p: HTMLProgressElement) => p.value),
    ).toBeLessThan(100);
    await page.unroute(`**/${resource}`);
    await page.locator("#retry").click();
    await expect(page.locator("#load-status")).toHaveText(
      "Ready to Play — Click Start Game",
    );
  });
}
for (const [width, height] of [
  [1920, 1080],
  [1366, 768],
  [1280, 720],
  [800, 450],
  [360, 640],
])
  test(`banner and start fit ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator("#start")).toBeEnabled();
    const v = await page.evaluate(() => {
      const b = document.querySelector("#loading-banner") as HTMLImageElement,
        s = document.querySelector("#start")!;
      return {
        natural: [b.naturalWidth, b.naturalHeight],
        banner: b.getBoundingClientRect().toJSON(),
        button: s.getBoundingClientRect().toJSON(),
        scroll: [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ],
      };
    });
    expect(v.natural).toEqual([1983, 793]);
    expect(v.scroll[0]).toBeLessThanOrEqual(width);
    expect(v.scroll[1]).toBeLessThanOrEqual(height);
    expect(v.button.bottom).toBeLessThanOrEqual(height);
    expect(v.banner.top).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: info.outputPath("ready.png") });
  });
test("blocked optional saved-score storage does not block readiness forever", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      value: { open: () => ({}) },
      configurable: true,
    });
  });
  await page.goto("/");
  await expect(page.locator("#load-status")).toHaveText(
    "Ready to Play — Click Start Game",
    { timeout: 10000 },
  );
  await expect(page.locator("#start")).toBeEnabled();
});
