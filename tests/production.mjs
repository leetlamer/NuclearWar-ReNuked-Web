import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [],
    missing = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(r.url());
  });
  await page.goto(
    "http://127.0.0.1:4173/NuclearWar-ReNuked-Web/?debugRender=1",
  );
  await page
    .locator("#load-status")
    .filter({ hasText: "Ready to Play — Click Start Game" })
    .waitFor();
  assert.equal(
    await page
      .locator("#loading-banner")
      .evaluate((i) => i.complete && i.naturalWidth === 1983),
    true,
  );
  assert.equal(
    await page.locator("#load-progress").evaluate((p) => p.value),
    100,
  );
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  await page.waitForTimeout(800);
  assert.equal(
    await page.evaluate(() => window.nuclearWar.engine.status().screen),
    1,
  );
  assert.equal(await page.locator("[data-render-diagnostics]").count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(missing, []);
  const r = await page.locator("#screen").boundingBox();
  const scale = Math.min(r.width / 320, r.height / 200);
  await page.mouse.click(
    r.x + (r.width - 320 * scale) / 2 + 128 * scale,
    r.y + (r.height - 200 * scale) / 2 + 16 * scale,
  );
  await page.waitForTimeout(500);
  assert.equal(
    await page.evaluate(() => window.nuclearWar.engine.status().screen),
    2,
  );
  assert.equal(
    await page.evaluate(
      () => window.nuclearWar.engine.module.getAudioContext().state,
    ),
    "running",
  );
  console.log(
    "PASS static production subpath: Wasm/data/assets loaded, character selection, game start, Web Audio running, no page/network errors",
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
