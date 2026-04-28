import "./env.js";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { generateScriptHandler, healthHandler, papersHandler } from "./handlers.js";

const app = express();
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", healthHandler);
app.post("/api/papers", papersHandler);
app.post("/api/generate-script", generateScriptHandler);

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, host, () => {
  console.log(`API server listening on http://${host}:${port}`);
});
