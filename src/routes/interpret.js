/**
 * Intudo Backend - Interpret Route
 * POST /v0/interpret
 * 
 * Accepts audio from the Chrome extension,
 * transcribes it, interprets intent, and returns
 * a structured prompt.
 */

import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { transcribeAudio } from '../services/stt.js';
import { interpretIntent } from '../services/llm.js';
import { saveAudioToTemp, cleanupTempFile } from '../utils/file.js';
import { validateAudioSize } from '../utils/validate.js';

export const interpretRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.audio.maxSize,
  },
});

/**
 * POST /v0/interpret
 * 
 * Request: multipart/form-data
 *   - audio: audio/webm;codecs=opus file
 *   - user_id: string
 *   - session_id: string
 *   - platform: string (e.g., "chatgpt")
 * 
 * Response:
 *   {
 *     "result": {
 *       "transcript": string,
 *       "cleaned_intent": string,
 *       "final_prompt": string,
 *       "intent_type": "exploration" | "generation" | "clarification",
 *       "confidence": number (0-1)
 *     }
 *   }
 */
interpretRouter.post('/interpret', upload.single('audio'), async (req, res, next) => {
  let tempFilePath = null;

  try {
    // Extract metadata from request
    const { user_id, session_id, platform } = req.body;
    const audioFile = req.file;

    // Log request (non-sensitive info only)
    console.log(`[Interpret] Request from user=${user_id?.substring(0, 8)}... platform=${platform}`);

    // Validate audio file exists
    if (!audioFile || !audioFile.buffer) {
      return res.status(400).json({
        result: createFallbackResult('No audio file provided'),
      });
    }

    // Validate audio size
    const sizeValidation = validateAudioSize(audioFile.buffer.length);
    if (!sizeValidation.valid) {
      console.log(`[Interpret] Audio too small: ${audioFile.buffer.length} bytes`);
      return res.status(400).json({
        result: createFallbackResult(sizeValidation.message),
      });
    }

    // Save audio to temp file (required for Whisper API)
    tempFilePath = await saveAudioToTemp(audioFile.buffer);
    console.log(`[Interpret] Audio saved: ${audioFile.buffer.length} bytes`);

    // Step 1: Transcribe audio using Whisper
    const transcript = await transcribeAudio(tempFilePath);
    console.log(`[Interpret] Transcript: "${transcript.substring(0, 50)}..."`);

    // Handle empty transcript
    if (!transcript || transcript.trim().length === 0) {
      return res.json({
        result: createFallbackResult('Could not detect speech in audio'),
      });
    }

    // Step 2: Interpret intent and generate prompt
    const interpretation = await interpretIntent(transcript, { platform });
    console.log(`[Interpret] Intent type: ${interpretation.intent_type}, confidence: ${interpretation.confidence}`);

    // Return successful response
    res.json({
      result: {
        transcript,
        cleaned_intent: interpretation.cleaned_intent,
        final_prompt: interpretation.final_prompt,
        intent_type: interpretation.intent_type,
        confidence: interpretation.confidence,
      },
    });

  } catch (error) {
    console.error('[Interpret] Error:', error.message);

    // Always return valid response shape
    res.json({
      result: createFallbackResult('Processing error occurred'),
    });

  } finally {
    // Always cleanup temp file
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * Create a safe fallback result when processing fails
 */
function createFallbackResult(reason = 'Unknown error') {
  return {
    transcript: '',
    cleaned_intent: `Unable to fully process audio. ${reason}`,
    final_prompt: 'Please rephrase your request clearly and concisely.',
    intent_type: 'clarification',
    confidence: 0.2,
  };
}
