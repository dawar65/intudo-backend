import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { config } from "../config.js";

export async function ensureTempDir() {
  await fs.mkdir(config.tempDir, { recursive: true });
}

export async function saveAudioToTemp(buffer) {
  const name = crypto.randomUUID() + ".webm";
  const filePath = path.join(config.tempDir, name);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {}
}
