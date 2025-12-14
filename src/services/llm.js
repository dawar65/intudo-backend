/**
 * Intudo Backend - LLM Intent Interpreter
 *
 * Responsibilities:
 * - Send transcript to LLM with Intudo IP prompt
 * - Parse + validate structured intent output
 * - Never throw uncaught errors
 */

import OpenAI from "openai";
import { config } from "../config.js";
import { getIntentPrompt } from "../prompts/intentprompt.js";
import { extractJSON, validateInterpretation } from "../utils/validate.js";

/* =====================
   OpenAI Client
===================== */
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/* =====================
   Interpret Intent
===================== */
export async function interpretIntent(transcript, { platform } = {}) {
  try {
    const systemPrompt = getIntentPrompt();

    const userPrompt = `
Transcript:
"${transcript}"

Platform: ${platform || "unknown"}

Respond with JSON only.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const raw = response.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Empty LLM response");
    }

    /* ---------- Parse JSON safely ---------- */
    const parsed = extractJSON(raw);

    /* ---------- Validate + normalize ---------- */
    const validated = validateInterpretation(parsed);

    return validated;

  } catch (err) {
    console.error("[LLM] Interpretation error:", err.message);

    // HARD fallback — never throw upstream
    return {
      cleaned_intent: transcript,
      final_prompt: transcript,
      intent_type: "clarification",
      confidence: 0.3
    };
  }
}
