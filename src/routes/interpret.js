import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../services/stt.js";
import { interpretIntent } from "../services/llm.js";
import { saveAudioToTemp, cleanupTempFile } from "../utils/file.js";
import { validateAudioSize } from "../utils/validate.js";
import { config } from "../config.js";

export const interpretRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.audio.maxSize }
});

interpretRouter.post("/interpret", upload.single("audio"), async (req, res) => {
  let tempPath = null;

  try {
    const { user_id, session_id, platform } = req.body;
    const audio = req.file;

    if (!audio?.buffer) {
      return res.json({ result: fallback("No audio received") });
    }

    const sizeCheck = validateAudioSize(audio.buffer.length);
    if (!sizeCheck.valid) {
      return res.json({ result: fallback(sizeCheck.message) });
    }

    tempPath = await saveAudioToTemp(audio.buffer);

    const transcript = await transcribeAudio(tempPath);
    if (!transcript.trim()) {
      return res.json({ result: fallback("No speech detected") });
    }

    const intent = await interpretIntent(transcript, { platform });

    res.json({
      result: {
        transcript,
        cleaned_intent: intent.cleaned_intent,
        final_prompt: intent.final_prompt,
        intent_type: intent.intent_type,
        confidence: intent.confidence
      }
    });

  } catch (e) {
    console.error("[Interpret] Error:", e.message);
    res.json({ result: fallback("Processing failed") });
  } finally {
    if (tempPath) await cleanupTempFile(tempPath);
  }
});

function fallback(reason) {
  return {
    transcript: "",
    cleaned_intent: `Unable to process audio: ${reason}`,
    final_prompt: "Please rephrase your request clearly.",
    intent_type: "clarification",
    confidence: 0.2
  };
}
