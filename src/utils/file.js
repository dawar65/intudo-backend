import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const TEMP_DIR = path.join(os.tmpdir(), "intudo-audio");

export async function ensureTempDir() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
}

export async function saveAudioToTemp(buffer) {
  const name = crypto.randomUUID() + ".webm";
  const filePath = path.join(TEMP_DIR, name);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {}
}
