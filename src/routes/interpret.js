/**
 * Intudo Backend - Interpret Route
 * POST /v0/interpret
 *
 * Handles:
 * - Audio upload
 * - Whisper transcription
 * - Intent interpretation
 * - Always returns a stable response shape
 */

import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../services/stt.js";
import { interpretIntent } from "../services/llm.js";
import { saveAudioToTemp, cleanupTempFile } from "../utils/file.js";
import { validateAudioSize } from "../utils/validate.js";
import { config } from "../config.js";

export const interpretRouter = Router();

/* =====================
   Multer configuration
===================== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.audio.maxSize }
});

/* =====================
   POST /v0/interpret
===================== */
interpretRouter.post(
  "/interpret",
  upload.single("audio"),
  async (req, res) => {
    let tempPath = null;

    try {
      const { user_id, session_id, platform } = req.body;
      const audio = req.file;

      console.log(
        `[Interpret] user=${user_id?.slice(0, 6) ?? "anon"} platform=${platform}`
      );

      /* ---------- Validate audio ---------- */
      if (!audio || !audio.buffer) {
        return res.json({ result: fallback("No audio received") });
      }

      const sizeCheck = validateAudioSize(audio.buffer.length);
      if (!sizeCheck.valid) {
        return res.json({ result: fallback(sizeCheck.message) });
      }

      /* ---------- Save temp file ---------- */
      tempPath = await saveAudioToTemp(audio.buffer);

      /* ---------- Speech-to-text ---------- */
      let transcript = "";
      try {
        transcript = await transcribeAudio(tempPath);
      } catch (sttErr) {
        console.error("[STT] Whisper error:", sttErr.message);
        return res.json({
          result: fallback("Speech transcription failed")
        });
      }

      if (!transcript || transcript.trim().length === 0) {
        return res.json({ result: fallback("No speech detected") });
      }

      /* ---------- Intent interpretation ---------- */
      let interpretation;
      try {
        interpretation = await interpretIntent(transcript, { platform });
      } catch (llmErr) {
        console.error("[LLM] Intent error:", llmErr.message);
        return res.json({
          result: fallback("Intent interpretation failed")
        });
      }

      /* ---------- Normalize output ---------- */
      const result = {
        transcript,
        cleaned_intent:
          interpretation.cleaned_intent || "Unable to interpret request",
        final_prompt:
          interpretation.final_prompt ||
          interpretation.cleaned_intent ||
          "Please clarify your request.",
        intent_type: interpretation.intent_type || "clarification",
        confidence:
          typeof interpretation.confidence === "number"
            ? interpretation.confidence
            : 0.4
      };

      return res.json({ result });

    } catch (err) {
      console.error("[Interpret] Fatal error:", err.message);
      return res.json({ result: fallback("Unexpected processing error") });

    } finally {
      if (tempPath) {
        await cleanupTempFile(tempPath);
      }
    }
  }
);

/* =====================
   Fallback response
===================== */
function fallback(reason) {
  return {
    transcript: "",
    cleaned_intent: `Unable to process audio: ${reason}`,
    final_prompt: "Please rephrase your request clearly.",
    intent_type: "clarification",
    confidence: 0.2
  };
}
