import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
const root = process.argv[2];
if (!root)
  throw Error("Usage: node tools/verify-desktop.mjs /path/to/reference");
const baseline = JSON.parse(
  readFileSync(new URL("../docs/desktop-baseline.json", import.meta.url)),
);
for (const [file, hash] of Object.entries(baseline.sha256)) {
  const actual = createHash("sha256")
    .update(readFileSync(path.join(root, file)))
    .digest("hex");
  if (actual !== hash) throw Error(`Reference changed: ${file}`);
}
const status = spawnSync("git", ["status", "--porcelain"], {
  cwd: root,
  encoding: "utf8",
});
if (status.status !== 0 || status.stdout !== baseline.status)
  throw Error("Reference Git status changed");
const commit = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
});
if (commit.stdout.trim() !== baseline.commit)
  throw Error("Reference HEAD changed");
console.log(
  `PASS: ${Object.keys(baseline.sha256).length} desktop tracked files, Git HEAD and working-tree status unchanged`,
);
