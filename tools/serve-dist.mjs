import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const port = Number(process.env.PORT || 4173);
const prefix = process.env.PREFIX || "/NuclearWar-ReNuked-Web/";
const root = path.resolve("dist");
const types = {
  ".js": "application/javascript",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
  ".html": "text/html",
  ".css": "text/css",
  ".png": "image/png",
  ".json": "application/json",
  ".wav": "audio/wav",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith(prefix)) {
      res.writeHead(404);
      res.end();
      return;
    }
    const file = path.resolve(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
    );
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const bytes = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Production static build: http://127.0.0.1:${port}${prefix}`),
);
