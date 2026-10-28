import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const local = path.join(root, ".toolchain/emsdk/upstream/emscripten/em++");
const compiler = process.env.EMXX || (existsSync(local) ? local : "em++");
const collect = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? collect(path.join(dir, e.name))
      : e.name.endsWith(".cpp")
        ? [path.join(dir, e.name)]
        : [],
  );
const sources = [
  ...collect("wasm/src/game"),
  ...collect("wasm/src/ui"),
  ...collect("wasm/src/core"),
  "wasm/src/platform/resources.cpp",
  "wasm/src/platform/application.cpp",
];
const replay = process.argv.includes("--replay");
const output = replay ? "build/browser-engine" : "public/engine";
mkdirSync(output, { recursive: true });
const flags = [
  "-std=c++17",
  "-O2",
  "-fexceptions",
  "-Iwasm/include",
  "-Iwasm/src",
  "-Iwasm",
  "-DSDL_MAIN_HANDLED",
  "-sUSE_SDL=2",
  "-sUSE_LIBPNG=1",
  "-sASYNCIFY=1",
  "-sALLOW_MEMORY_GROWTH=1",
  "-sINITIAL_MEMORY=67108864",
  "-sSTACK_SIZE=2097152",
  "-sASYNCIFY_STACK_SIZE=262144",
  "-sMODULARIZE=1",
  "-sEXPORT_ES6=1",
  "-sENVIRONMENT=web,node",
  "-sFORCE_FILESYSTEM=1",
  '-sEXPORTED_FUNCTIONS=["_main","_web_input","_web_status","_web_mute","_web_audio_muted"]',
  '-sEXPORTED_RUNTIME_METHODS=["callMain","FS","UTF8ToString","IDBFS"]',
  "--post-js",
  "wasm/bindings/browser.js",
  "-lidbfs.js",
  "--preload-file",
  "public/assets@/assets",
  ...(replay ? ["-DNWR_WITH_REPLAY=1"] : []),
  "-o",
  `${output}/nuclearwar.js`,
];
const result = spawnSync(compiler, [...sources, ...flags], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (result.error)
  console.error(
    "Install Emscripten 4.0.23 and activate its environment, or set EMXX.",
    result.error,
  );
process.exit(result.status ?? 1);
