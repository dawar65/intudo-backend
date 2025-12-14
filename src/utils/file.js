/**
 * Intudo Backend — File Utilities
 * Handles temporary audio file lifecycle
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { config } from "../config.js";

/**
 * Ensure temp directory exists
 * Must be called once on server startup
 */
export async function ensureTempDir() {
  await fs.mkdir(config.tempDir, { recursive: true });
}

/**
 * Save audio buffer to a temp file
 * Whisper REQUIRES a real file path
 */
export async function saveAudioToTemp(buffer) {
  const filename = `${crypto.randomUUID()}.webm`;
  const filePath = path.join(config.tempDir, filename);

  await fs.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Cleanup temp audio file
 * Never throws (cleanup must not crash request)
 */
export async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Silent by design — cleanup failure is non-fatal
    console.warn("[Temp Cleanup] Failed:", err?.message);
  }
}
