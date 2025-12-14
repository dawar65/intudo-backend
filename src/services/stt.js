/**
 * Intudo Backend - Speech-to-Text (Whisper)
 *
 * Responsibilities:
 * - Transcribe audio files using OpenAI Whisper
 * - Never crash the request pipeline
 * - Return empty string on failure
 */

import fs from "fs";
import OpenAI from "openai";
import { config } from "../config.js";

/* =====================
   OpenAI Client
===================== */
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/* =====================
   Transcribe Audio
===================== */
export async function transcribeAudio(filePath) {
  let fileStream = null;

  try {
    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      console.error("[STT] Audio file not found:", filePath);
      return "";
    }

    fileStream = fs.createReadStream(filePath);

    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      response_format: "json"
    });

    const text = response?.text?.trim();

    if (!text) {
      console.warn("[STT] Empty transcription result");
      return "";
    }

    return text;

  } catch (err) {
    // DO NOT throw — log and fail gracefully
    console.error("[STT] Whisper transcription failed:", err.message);
    return "";

  } finally {
    // Ensure stream is closed
    if (fileStream) {
      try {
        fileStream.close();
      } catch {}
    }
  }
}
