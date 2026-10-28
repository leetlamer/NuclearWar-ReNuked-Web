import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (b) => createHash("sha256").update(b).digest("hex");
test("native and Wasm deterministic state trace equals frozen desktop baseline", () => {
  const expected = JSON.parse(
    readFileSync("docs/validation/desktop-trace.json"),
  );
  for (const file of [
    "build/native-state-trace.txt",
    "build/wasm-state-trace.txt",
  ]) {
    const bytes = readFileSync(file);
    assert.equal(sha(bytes), expected.sha256);
    assert.equal(bytes.toString().trim().split("\n").length, expected.records);
  }
});
test("all copied runtime assets remain byte-identical to the desktop baseline", () => {
  const baseline = JSON.parse(readFileSync("docs/desktop-baseline.json"));
  for (const [file, expected] of Object.entries(baseline.sha256))
    if (file.startsWith("assets/"))
      assert.equal(sha(readFileSync("public/" + file)), expected, file);
});
test("gameplay sources remain byte-identical; only documented platform adapters differ", () => {
  const baseline = JSON.parse(readFileSync("docs/desktop-baseline.json"));
  for (const [file, expected] of Object.entries(baseline.sha256))
    if (
      file.startsWith("include/") ||
      file.startsWith("src/game/") ||
      file.startsWith("src/ui/") ||
      file.startsWith("src/core/") ||
      file.startsWith("src/audio/")
    )
      assert.equal(sha(readFileSync("wasm/" + file)), expected, file);
});
