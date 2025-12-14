/**
 * Intudo Backend — Server Bootstrap
 * Voice-first intent layer for LLMs
 */

import express from "express";
import cors from "cors";

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

app.use(
  cors({
    origin: [
      "https://chatgpt.com",
      "https://www.chatgpt.com",
      "chrome-extension://*"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false
  })
);
app.options("*", cors());
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

// 404 fallback (must be last)
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
