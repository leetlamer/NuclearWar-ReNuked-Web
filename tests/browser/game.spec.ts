import { test, expect } from "@playwright/test";
test("loads actual WASM game and accepts character-selection input", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator("#loading")).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const app = (window as any).nuclearWar;
        return app.engine.status().screen;
      }),
    )
    .toBe(1);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/character-selection.png" });
  expect(
    await page.locator("#source").evaluate((c: HTMLCanvasElement) =>
      c
        .getContext("2d")!
        .getImageData(0, 0, 320, 200)
        .data.some((x) => x !== 0),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("selects opponents, enters game, and completes a build turn without extra acknowledgement", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  const status = () =>
    page.evaluate(() => (window as any).nuclearWar.engine.status());
  await expect.poll(async () => (await status()).screen).toBe(1);
  await page.waitForTimeout(600);
  const canvas = page.locator("#screen");
  const click = async (x: number, y: number) => {
    const r = (await canvas.boundingBox())!;
    await page.mouse.click(
      r.x + (x * r.width) / 320,
      r.y + (y * r.height) / 200,
    );
  };
  await click(25, 65);
  await expect.poll(async () => (await status()).selected).toBe(1);
  await click(280, 65);
  await click(25, 115);
  await click(25, 165);
  await expect.poll(async () => (await status()).selected).toBe(4);
  await click(150, 20);
  await expect.poll(async () => (await status()).screen).toBe(2);
  await page.screenshot({ path: "test-results/main-game.png" });
  // Keep the production sequence automatic; a first click after it must be actionable.
  await expect
    .poll(async () => (await status()).active, { timeout: 30000 })
    .toBe(false);
  await click(85, 20);
  await click(150, 20);
  const before = await status();
  await expect
    .poll(async () => (await status()).active, { timeout: 10000 })
    .toBe(true);
  // Skip the current building presentation through the same physical mouse gesture.
  await page.waitForTimeout(300);
  await click(160, 100);
  await expect
    .poll(async () => (await status()).round, { timeout: 90000 })
    .toBeGreaterThan(before.round);
  expect(errors).toEqual([]);
});
test("Three.js output is pixel-identical at native size and audio unlock/mute works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 352, height: 500 });
  await page.goto("/");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await page.waitForTimeout(600);
  const result = await page.evaluate(() => {
    const app = (window as any).nuclearWar;
    app.renderer.render();
    const canvas = document.querySelector("#screen") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2")!;
    const pixels = new Uint8Array(320 * 200 * 4);
    gl.readPixels(0, 0, 320, 200, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const source = (document.querySelector("#source") as HTMLCanvasElement)
      .getContext("2d")!
      .getImageData(0, 0, 320, 200).data;
    let different = 0;
    for (let y = 0; y < 200; y++)
      for (let x = 0; x < 320; x++)
        for (let c = 0; c < 3; c++)
          if (
            pixels[((199 - y) * 320 + x) * 4 + c] !==
            source[(y * 320 + x) * 4 + c]
          )
            different++;
    return {
      different,
      width: canvas.width,
      height: canvas.height,
      audio: app.engine.module.getAudioContext()?.state,
    };
  });
  expect(result).toEqual({
    different: 0,
    width: 320,
    height: 200,
    audio: "running",
  });
  await page.locator("#mute").check();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).nuclearWar.engine.module._web_audio_muted(),
      ),
    )
    .toBe(1);
  await page.locator("#mute").uncheck();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).nuclearWar.engine.module._web_audio_muted(),
      ),
    )
    .toBe(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).nuclearWar.engine.module.getAudioContext()?.state,
      ),
    )
    .toBe("running");
});
test("persists score storage across a page reload", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start game", exact: true }),
  ).toBeEnabled();
  await page.evaluate(async () => {
    const fs = (window as any).nuclearWar.engine.module.FS;
    fs.writeFile("/saves/persistence-fixture", new Uint8Array([78, 87, 82]));
    await new Promise<void>((resolve, reject) =>
      fs.syncfs(false, (error: any) => (error ? reject(error) : resolve())),
    );
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start game", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() =>
      Array.from(
        (window as any).nuclearWar.engine.module.FS.readFile(
          "/saves/persistence-fixture",
        ),
      ),
    ),
  ).toEqual([78, 87, 82]);
});
test("honors mute selected before game start", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start game", exact: true }),
  ).toBeEnabled();
  await page.locator("#mute").check();
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).nuclearWar.engine.module._web_audio_muted(),
      ),
    )
    .toBe(1);
  await page.locator("#mute").uncheck();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).nuclearWar.engine.module._web_audio_muted(),
      ),
    )
    .toBe(0);
});
