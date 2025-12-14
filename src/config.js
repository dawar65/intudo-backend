/**
 * Intudo Backend - Global Configuration
 *
 * Centralized, validated configuration
 * for backend services.
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config();

/* =====================
   Configuration Object
===================== */
export const config = {
  // Server
  port: process.env.PORT || 8002,
  nodeEnv: process.env.NODE_ENV || "development",

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },

  // Audio constraints
  audio: {
    minSize: 1500,               // bytes (critical for Whisper)
    maxSize: 10 * 1024 * 1024    // 10 MB
  },

  // ✅ REQUIRED for Whisper temp files (Railway-safe)
  tempDir: path.join(process.cwd(), "tmp")
};

/* =====================
   Validation
===================== */
export function validateConfig() {
  if (!config.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  if (!config.port) {
    console.warn("[Config] PORT not set, using default");
  }

  if (!config.nodeEnv) {
    console.warn("[Config] NODE_ENV not set, defaulting to development");
  }
}
