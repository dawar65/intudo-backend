/**
 * Intudo Backend — Server Bootstrap
 * Voice-first intent layer for LLMs
 */

import express from "express";
import { config, validateConfig } from "./config.js";
import { interpretRouter } from "./routes/interpret.js";
import { errorHandler } from "./middleware/error.js";
import { ensureTempDir } from "./utils/file.js";

/* =====================
   Startup Validation
===================== */
try {
  validateConfig();
} catch (err) {
  console.error("❌ Configuration error:", err.message);
  process.exit(1);
}

/* =====================
   App Initialization
===================== */
const app = express();

/* =====================
   HARD CORS FIX (DO NOT CHANGE)
===================== */
const ALLOWED_ORIGINS = [
  "https://chatgpt.com",
  "https://www.chatgpt.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Preflight MUST exit early
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());

/* =====================
   Health Check
===================== */
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: "intudo-backend",
    version: "0.1.0",
    env: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

/* =====================
   Routes
===================== */
app.use("/v0", interpretRouter);

/* =====================
   Error Handling
===================== */
app.use(errorHandler);

/* =====================
   404 Fallback
===================== */
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path
  });
});

/* =====================
   Server Boot
===================== */
async function startServer() {
  try {
    await ensureTempDir();

    app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║            INTUDO BACKEND v0.1.0             ║
╠══════════════════════════════════════════════╣
║ Status:   Running                            ║
║ Port:     ${config.port.toString().padEnd(33)}║
║ Env:      ${config.nodeEnv.padEnd(33)}║
║ Endpoint: POST /v0/interpret                 ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
