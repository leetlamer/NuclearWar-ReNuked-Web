// Development check for the supplied artwork and measured startup resources.
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
const banner = readFileSync(
  "public/assets/branding/nuclear-war-renuked-banner.png",
);
const hash = createHash("sha256").update(banner).digest("hex");
if (hash !== "68fc5ac1a54999d209615113de05f8593d007065f71da4191c75305c17ab07ca")
  throw Error("Supplied banner artwork changed");
console.log(
  "PASS unchanged supplied banner",
  banner.readUInt32BE(16),
  banner.readUInt32BE(20),
  hash,
);
for (const file of ["nuclearwar.js", "nuclearwar.wasm", "nuclearwar.data"])
  console.log(file, statSync("public/engine/" + file).size, "bytes");
