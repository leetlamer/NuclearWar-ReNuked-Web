import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const b = await chromium.launch(),
  p = await b.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });
await p.goto("http://127.0.0.1:5173/?testReplay=1");
await p.waitForFunction(() => !document.querySelector("#start").disabled);
await p.evaluate(() => {
  const m = window.nuclearWar.engine.module,
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
    ]);
});
await p.getByRole("button", { name: "Start Game", exact: true }).click();
await p.waitForTimeout(1000);
await p.screenshot({ path: "build/speech-current.png" });
writeFileSync(
  "build/speech-status.json",
  JSON.stringify(
    await p.evaluate(() => window.nuclearWar.engine.status()),
    null,
    2,
  ),
);
await b.close();
