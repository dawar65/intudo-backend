/**
 * Intudo Backend — Validation Utilities
 *
 * Responsibilities:
 * - Enforce audio size constraints
 * - Safely extract JSON from LLM output
 * - Normalize & validate intent interpretation
 *
 * This file is intentionally defensive.
 * The extension MUST always receive a valid response shape.
 */

import { config } from "../config.js";

/* =====================
   AUDIO VALIDATION
===================== */

/**
 * Validate audio size
 *
 * @param {number} size - audio size in bytes
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAudioSize(size) {
  if (typeof size !== "number" || isNaN(size)) {
    return {
      valid: false,
      message: "Invalid audio size"
    };
  }

  if (size < config.audio.minSize) {
    return {
      valid: false,
      message: `Audio too short (${size} bytes, minimum ${config.audio.minSize})`
    };
  }

  if (size > config.audio.maxSize) {
    return {
      valid: false,
      message: `Audio too large (${size} bytes, maximum ${config.audio.maxSize})`
    };
  }

  return { valid: true };
}

/* =====================
   JSON EXTRACTION
===================== */

/**
 * Extract JSON from LLM output
 * Handles:
 * - raw JSON
 * - markdown ```json blocks
 * - JSON embedded in text
 *
 * @param {string} content
 * @returns {object|null}
 */
export function extractJSON(content) {
  if (!content || typeof content !== "string") return null;

  // 1. Direct parse
  try {
    return JSON.parse(content);
  } catch {}

  // 2. Markdown fenced block
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  // 3. First JSON object in string
  const inline = content.match(/\{[\s\S]*\}/);
  if (inline) {
    try {
      return JSON.parse(inline[0]);
    } catch {}
  }

  return null;
}

/* =====================
   INTERPRETATION VALIDATION
===================== */

/**
 * Normalize and validate LLM interpretation
 *
 * @param {object|null} parsed
 * @returns {{
 *   cleaned_intent: string,
 *   final_prompt: string,
 *   intent_type: string,
 *   confidence: number
 * }}
 */
export function validateInterpretation(parsed) {
  const fallback = {
    cleaned_intent: "Unable to interpret request",
    final_prompt: "",
    intent_type: "clarification",
    confidence: 0.3
  };

  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  const result = {
    cleaned_intent: normalizeString(parsed.cleaned_intent, fallback.cleaned_intent),
    final_prompt: normalizeString(parsed.final_prompt, fallback.final_prompt),
    intent_type: normalizeIntentType(parsed.intent_type),
    confidence: normalizeConfidence(parsed.confidence)
  };

  // If prompt missing but intent exists, reuse intent
  if (!result.final_prompt && result.cleaned_intent !== fallback.cleaned_intent) {
    result.final_prompt = result.cleaned_intent;
  }

  return result;
}

/* =====================
   HELPERS
===================== */

function normalizeString(value, fallback) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function normalizeIntentType(value) {
  const allowed = ["exploration", "generation", "clarification"];
  if (typeof value === "string" && allowed.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return "clarification";
}

function normalizeConfidence(value) {
  const num = Number(value);
  if (!isNaN(num) && num >= 0 && num <= 1) {
    return Math.round(num * 100) / 100;
  }
  return 0.5;
}
