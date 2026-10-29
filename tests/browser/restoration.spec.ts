import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
async function status(page: any) {
  return page.evaluate(() => (window as any).nuclearWar.engine.status());
}
async function click(page: any, x: number, y: number) {
  const box = (await page.locator("#screen").boundingBox())!;
  const scale = Math.min(box.width / 320, box.height / 200);
  await page.mouse.click(
    box.x + (box.width - 320 * scale) / 2 + x * scale,
    box.y + (box.height - 200 * scale) / 2 + y * scale,
  );
}
for (const count of [1, 2, 3, 4])
  test(`exactly ${count} selected AI participate`, async ({ page }, info) => {
    await page.goto("/");
    await page.locator("#start").click();
    await expect.poll(async () => (await status(page)).screen).toBe(1);
    await page.waitForTimeout(600);
    for (const [x, y] of [
      [25, 65],
      [280, 65],
      [25, 115],
      [25, 165],
    ].slice(0, count))
      await click(page, x, y);
    await expect.poll(async () => (await status(page)).selected).toBe(count);
    await click(page, 150, 20);
    await expect.poll(async () => (await status(page)).screen).toBe(2);
    expect((await status(page)).participants).toBe(count + 1);
    await page.screenshot({ path: info.outputPath(`roster-${count}.png`) });
  });
async function fixture(page: any, args: string[]) {
  await page.goto("/?testReplay=1");
  await expect(page.locator("#start")).toBeEnabled();
  await page.evaluate((args: string[]) => {
    const m = (window as any).nuclearWar.engine.module,
      f = m.callMain;
    m.callMain = () => f(args);
  }, args);
  await page.locator("#start").click();
}
test("all ten Earth stages precede space Hall, with original packed imagery", async ({
  page,
}, info) => {
  await fixture(page, [
    "--smoke-test",
    "/test",
    "--session-fixture",
    "all-dead",
    "--browser-realtime",
    "--typing-cps",
    "1000",
  ]);
  const frames = await page.evaluate(async () => {
    const found: Record<string, string> = {};
    const begin = performance.now();
    while (performance.now() - begin < 15000) {
      await new Promise(requestAnimationFrame);
      const s = (window as any).nuclearWar.engine.status();
      if (s.extinctionStage >= -1 && s.extinctionStage <= 10) {
        const key = s.hall ? "hall" : String(s.extinctionStage);
        if (!found[key])
          found[key] = (
            document.querySelector("#source") as HTMLCanvasElement
          ).toDataURL();
        if (s.hall) return found;
      }
    }
    return found;
  });
  for (let stage = 0; stage < 10; stage++)
    expect(frames[String(stage)], `stage ${stage}`).toBeTruthy();
  expect(frames.hall).toBeTruthy();
  expect(new Set(Object.values(frames)).size).toBeGreaterThanOrEqual(11);
  for (const [name, data] of Object.entries(frames))
    writeFileSync(
      info.outputPath(`earth-${name}.png`),
      Buffer.from(data.split(",")[1], "base64"),
    );
  await page.screenshot({ path: info.outputPath("hall-in-space.png") });
  // The extinction Hall uses the real new-session fade/reset path, then a
  // different roster can be chosen without inheriting old session occupancy.
  await click(page, 160, 100);
  await expect.poll(async () => (await status(page)).screen).toBe(1);
  await page.waitForTimeout(900);
  await click(page, 25, 65);
  await click(page, 280, 65);
  await expect.poll(async () => (await status(page)).selected).toBe(2);
  await click(page, 150, 20);
  await expect.poll(async () => (await status(page)).screen).toBe(2);
  expect((await status(page)).participants).toBe(3);
});
test("original UFO and yellow frames descend, fire, depart and complete", async ({
  page,
}, info) => {
  await fixture(page, [
    "--smoke-test",
    "/test",
    "--media-fixture",
    "alien-delivery",
    "--replay-target",
    "4:1",
    "--browser-realtime",
    "--typing-cps",
    "1000",
  ]);
  const frames = await page.evaluate(async () => {
    const found: Record<string, string> = {};
    const start = performance.now();
    while (performance.now() - start < 12000) {
      await new Promise(requestAnimationFrame);
      const s = (window as any).nuclearWar.engine.status();
      if (s.action === 16 && s.active) {
        const t = s.timeline;
        const key =
          t < 0.3
            ? "descend"
            : t >= 0.8 && t < 1.8
              ? "yellow"
              : t > 2.5
                ? "ascend"
                : "";
        if (key && !found[key])
          found[key] = (
            document.querySelector("#source") as HTMLCanvasElement
          ).toDataURL();
      }
      if (Object.keys(found).length === 3) return found;
    }
    return found;
  });
  for (const key of ["descend", "yellow", "ascend"])
    expect(frames[key], key).toBeTruthy();
  for (const [name, data] of Object.entries(frames))
    writeFileSync(
      info.outputPath(`ufo-${name}.png`),
      Buffer.from(data.split(",")[1], "base64"),
    );
});
