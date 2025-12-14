import fs from "fs";
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

export async function transcribeAudio(filePath) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "text"
    });

    const text = (response || "").trim();
    return text;

  } catch (err) {
    console.error("[STT] Whisper error:", err);
    return "";
  }
}
