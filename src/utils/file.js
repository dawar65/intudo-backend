/**
 * Intudo Backend - File Utilities
 * Handles temporary audio file operations
 */

import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

/**
 * Ensure temp directory exists
 */
export async function ensureTempDir() {
  try {
    if (!existsSync(config.audio.tempDir)) {
      mkdirSync(config.audio.tempDir, { recursive: true });
      console.log(`[File] Created temp directory: ${config.audio.tempDir}`);
    }
  } catch (error) {
    console.error('[File] Failed to create temp directory:', error.message);
    throw error;
  }
}

/**
 * Save audio buffer to a temporary file
 * 
 * @param {Buffer} audioBuffer - Audio data buffer
 * @returns {Promise<string>} - Path to the saved file
 */
export async function saveAudioToTemp(audioBuffer) {
  const filename = `intudo-${uuidv4()}.webm`;
  const filePath = path.join(config.audio.tempDir, filename);

  try {
    await fs.writeFile(filePath, audioBuffer);
    return filePath;
  } catch (error) {
    console.error('[File] Failed to save audio:', error.message);
    throw new Error('Failed to save audio file');
  }
}

/**
 * Delete a temporary file
 * 
 * @param {string} filePath - Path to the file to delete
 */
export async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Log but don't throw - cleanup failure is not critical
    console.warn('[File] Failed to cleanup temp file:', filePath);
  }
}

/**
 * Cleanup all old temp files (older than 1 hour)
 * Can be called periodically to prevent temp directory bloat
 */
export async function cleanupOldTempFiles() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  try {
    const files = await fs.readdir(config.audio.tempDir);

    for (const file of files) {
      const filePath = path.join(config.audio.tempDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < oneHourAgo) {
        await fs.unlink(filePath);
        console.log('[File] Cleaned up old temp file:', file);
      }
    }
  } catch (error) {
    console.warn('[File] Error during temp cleanup:', error.message);
  }
}
