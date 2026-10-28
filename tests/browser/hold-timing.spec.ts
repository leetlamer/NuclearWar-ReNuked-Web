import { test, expect } from "@playwright/test";
async function openFixture(browser: any, fixture: string) {
  const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    }),
    page = await context.newPage();
  await page.goto("/?testReplay=1");
  await expect(page.locator("#start")).toBeEnabled();
  await page.evaluate((fixture: string) => {
    const m = (window as any).nuclearWar.engine.module,
      f = m.callMain;
    m.callMain = () =>
      f([
        "--smoke-test",
        "/test",
        "--media-fixture",
        fixture,
        "--browser-realtime",
      ]);
  }, fixture);
  await page.locator("#start").click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).nuclearWar.engine.status().active),
    )
    .toBe(true);
  if (fixture.startsWith("revenge"))
    await page.waitForFunction(
      () => (window as any).nuclearWar.engine.status().revenge,
    );
  return { context, page };
}
async function moveToFreeArea(page: any) {
  const r = (await page.locator("#screen").boundingBox())!,
    s = Math.min(r.width / 320, r.height / 200);
  await page.mouse.move(
    r.x + (r.width - 320 * s) / 2 + 160 * s,
    r.y + (r.height - 200 * s) / 2 + 160 * s,
  );
}
for (const fixture of ["speech", "missile", "bomber-attack", "revenge-human"])
  test(`${fixture}: a 3s presentation interval takes approximately T/1.5 while held`, async ({
    browser,
  }, info) => {
    const measured: number[] = [];
    for (const held of [false, true]) {
      const { context, page } = await openFixture(browser, fixture);
      await moveToFreeArea(page);
      const initial = await page.evaluate(
        () => (window as any).nuclearWar.engine.status().timeline,
      );
      const start = Date.now();
      if (held) await page.mouse.down();
      await page.waitForFunction(
        (target: number) =>
          (window as any).nuclearWar.engine.status().timeline >= target,
        initial + 3,
        { polling: 10 },
      );
      measured.push((Date.now() - start) / 1000);
      if (held) {
        expect(
          await page.evaluate(
            () => (window as any).nuclearWar.engine.status().playbackRate,
          ),
        ).toBe(1.5);
        await page.mouse.up();
        await expect
          .poll(() =>
            page.evaluate(
              () => (window as any).nuclearWar.engine.status().playbackRate,
            ),
          )
          .toBe(1);
      }
      await context.close();
    }
    expect(measured[0]).toBeGreaterThan(2.85);
    expect(measured[0] / measured[1]).toBeGreaterThan(1.35);
    expect(measured[0] / measured[1]).toBeLessThan(1.65);
    console.log(
      "TIMING",
      fixture,
      JSON.stringify({
        normal: measured[0],
        held: measured[1],
        thresholdMs: 200,
      }),
    );
    await info.attach("measured-timing", {
      body: JSON.stringify({
        normal: measured[0],
        held: measured[1],
        thresholdMs: 200,
      }),
      contentType: "application/json",
    });
  });
for (const event of [
  "pointercancel",
  "lostpointercapture",
  "blur",
  "visibilitychange",
])
  test(`hold clears on ${event}`, async ({ browser }) => {
    const { context, page } = await openFixture(browser, "bomber-attack");
    await moveToFreeArea(page);
    await page.mouse.down();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).nuclearWar.engine.status().playbackRate,
        ),
      )
      .toBe(1.5);
    await page.evaluate((name: string) => {
      if (name === "blur") window.dispatchEvent(new Event("blur"));
      else if (name === "visibilitychange") {
        Object.defineProperty(document, "hidden", {
          value: true,
          configurable: true,
        });
        document.dispatchEvent(new Event(name));
      } else document.querySelector("#screen")!.dispatchEvent(new Event(name));
    }, event);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).nuclearWar.engine.status().playbackRate,
        ),
      )
      .toBe(1);
    await page.mouse.up();
    expect(
      await page.evaluate(
        () => (window as any).nuclearWar.engine.status().active,
      ),
    ).toBe(true);
    await context.close();
  });
test("holding continues across revenge attack boundaries without skipping the next attack", async ({
  browser,
}) => {
  const { context, page } = await openFixture(browser, "revenge-human");
  await moveToFreeArea(page);
  const first = await page.evaluate(
    () => (window as any).nuclearWar.engine.status().eventIndex,
  );
  await page.mouse.down();
  await page.waitForFunction(
    (index: number) => {
      const s = (window as any).nuclearWar.engine.status();
      return s.revenge && s.eventIndex > index;
    },
    first,
    { timeout: 20000 },
  );
  expect(
    await page.evaluate(
      () => (window as any).nuclearWar.engine.status().playbackRate,
    ),
  ).toBe(1.5);
  const next = await page.evaluate(
    () => (window as any).nuclearWar.engine.status().eventIndex,
  );
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).nuclearWar.engine.status().playbackRate,
      ),
    )
    .toBe(1);
  expect(
    await page.evaluate(
      () => (window as any).nuclearWar.engine.status().eventIndex,
    ),
  ).toBe(next);
  await context.close();
});
