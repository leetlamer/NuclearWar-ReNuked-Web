/** Hash this independent repository and its tested static build; never writes the reference. */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
const file = "docs/validation/web-checkpoint.json";
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
if (process.argv.includes("--verify")) {
  const data = JSON.parse(readFileSync(file));
  for (const [p, expected] of Object.entries({
    ...data.source,
    ...data.static_build,
  }))
    if (!existsSync(p) || sha(p) !== expected)
      throw Error(`Checkpoint mismatch: ${p}`);
  console.log(
    `PASS ${Object.keys(data.source).length} tracked files and ${Object.keys(data.static_build).length} static build files`,
  );
} else {
  const names = spawnSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .stdout.split("\0")
    .filter((n) => n && n !== file);
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
    );
  const data = {
    label: "browser-edition-validated",
    source_commit: spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).stdout.trim(),
    source: Object.fromEntries(names.map((p) => [p, sha(p)])),
    static_build: Object.fromEntries(walk("dist").map((p) => [p, sha(p)])),
  };
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("Saved browser-edition-validated checkpoint");
}
