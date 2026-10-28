import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => console.log(m.text()));
await page.goto("http://127.0.0.1:5173/?testReplay=1");
await page.getByRole("button", { name: "Start Game", exact: true }).waitFor();
await page.waitForFunction(() => !document.querySelector("#start").disabled);
await page.evaluate(() => {
  const m = window.nuclearWar.engine.module,
    f = m.callMain;
  m.callMain = () =>
    f([
      "--smoke-test",
      "/test",
      "--media-fixture",
      "bomber-attack",
      "--browser-realtime",
    ]);
});
await page.getByRole("button", { name: "Start Game", exact: true }).click();
await page.waitForTimeout(500);
console.log(
  "before",
  await page.evaluate(() => window.nuclearWar.engine.status()),
);
await page.locator("#screen").hover();
await page.mouse.down();
await page.waitForTimeout(1200);
console.log(
  "held",
  await page.evaluate(() => window.nuclearWar.engine.status()),
);
await page.mouse.up();
await page.waitForTimeout(100);
console.log(
  "released",
  await page.evaluate(() => window.nuclearWar.engine.status()),
);
await browser.close();
