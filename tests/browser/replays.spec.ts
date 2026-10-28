import { test, expect } from "@playwright/test";
// Developer-only Wasm build compiles the existing desktop replay drivers.
async function begin(page: any, args: string[]) {
  const messages: string[] = [];
  page.on("console", (msg: any) => messages.push(msg.text()));
  await page.goto("/?testReplay=1");
  await expect(
    page.getByRole("button", { name: "Start game", exact: true }),
  ).toBeEnabled();
  await page.evaluate((args: string[]) => {
    const m = (window as any).nuclearWar.engine.module,
      original = m.callMain;
    m.callMain = () => original(args);
  }, args);
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  return messages;
}
test("desktop endgame replay restarts twice with fresh game state and persisted scores", async ({
  page,
}) => {
  const messages = await begin(page, [
    "--smoke-test",
    "/test",
    "--session-fixture",
    "human-victory",
    "--restart-test",
    "--typing-cps",
    "1000",
  ]);
  await expect
    .poll(
      () => messages.some((x) => x.includes("PASS two high-score restarts")),
      { timeout: 60000 },
    )
    .toBe(true);
  await expect(page.locator("#error")).toBeEmpty();
  const trace = await page.evaluate(() =>
    new TextDecoder().decode(
      (window as any).nuclearWar.engine.module.FS.readFile(
        "/test/restart_trace.txt",
      ),
    ),
  );
  expect(trace).toContain("restart=1 fresh_state_rng_match=1");
  expect(trace).toContain("restart=2 fresh_state_rng_match=1");
  const scores = await page.evaluate(() =>
    Array.from(
      (window as any).nuclearWar.engine.module.FS.readFile("/saves/HighScores"),
    ),
  );
  await page.waitForTimeout(300);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start game", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() =>
      Array.from(
        (window as any).nuclearWar.engine.module.FS.readFile(
          "/saves/HighScores",
        ),
      ),
    ),
  ).toEqual(scores);
});
test("desktop human-elimination fixture continues AI-only without extra input", async ({
  page,
}) => {
  const messages = await begin(page, [
    "--smoke-test",
    "/test",
    "--session-fixture",
    "human-death",
    "--typing-cps",
    "1000",
  ]);
  await expect
    .poll(
      () => messages.some((x) => x.includes("PASS AI-only actual player loop")),
      { timeout: 60000 },
    )
    .toBe(true);
  await expect(page.locator("#error")).toBeEmpty();
});
for (const fixture of ["revenge-human", "revenge-ai", "revenge-bomber"]) {
  for (const mode of ["normal", "click", "hold"])
    test(`${fixture} preserves automatic attacks during ${mode} playback`, async ({
      page,
    }) => {
      const args = [
        "--smoke-test",
        "/test",
        "--media-fixture",
        fixture,
        "--typing-cps",
        "1000",
      ];
      if (mode !== "normal")
        args.push("--playback-replay", mode, "--animation-hold-ms", "50");
      const messages = await begin(page, args);
      await expect
        .poll(
          () =>
            messages.some((x) =>
              x.includes("PASS automatic user-defined revenge"),
            ),
          { timeout: 60000 },
        )
        .toBe(true);
      await expect(page.locator("#error")).toBeEmpty();
      const trace = await page.evaluate(() =>
        new TextDecoder().decode(
          (window as any).nuclearWar.engine.module.FS.readFile(
            "/test/revenge_presentation.txt",
          ),
        ),
      );
      expect(trace.indexOf("death=1")).toBeLessThan(trace.indexOf("revenge=1"));
    });
}
for (const fixture of [
  "earthquake",
  "alien-departure",
  "bomber-attack",
  "interception",
  "100mt-production",
  "round-shutters",
  "round-shutters-eliminated",
  "reverse-shutters",
  "rapid-shutters",
  "action-shutters",
  "mood-controls",
]) {
  test(`desktop presentation fixture: ${fixture}`, async ({ page }) => {
    const messages = await begin(page, [
      "--smoke-test",
      "/test",
      "--media-fixture",
      fixture,
      "--typing-cps",
      "1000",
    ]);
    await expect
      .poll(() => messages.some((x) => x.includes("PASS")), { timeout: 60000 })
      .toBe(true);
    await expect(page.locator("#error")).toBeEmpty();
  });
}
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const state = await page
      .evaluate(() => ({
        status: (window as any).nuclearWar?.engine.status(),
        error: document.querySelector("#error")?.textContent,
        trace: (() => {
          try {
            return new TextDecoder().decode(
              (window as any).nuclearWar.engine.module.FS.readFile(
                "/test/revenge_presentation.txt",
              ),
            );
          } catch {
            return "";
          }
        })(),
      }))
      .catch(String);
    await info.attach("engine-state", {
      body: JSON.stringify(state, null, 2),
      contentType: "application/json",
    });
  }
});
