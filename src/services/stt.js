import fs from "fs";
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

export async function transcribeAudio(filePath) {
  try {
    const stream = fs.createReadStream(filePath);

    const response = await openai.audio.transcriptions.create({
      file: stream,
      model: "whisper-1"
    });

    return response.text || "";
  } catch (err) {
    console.error("[STT] Whisper error:", err.message);
    throw err;
  }
}
