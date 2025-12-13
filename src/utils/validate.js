/**
 * Intudo Backend - Validation Utilities
 * JSON extraction and response validation
 */

import { config } from '../config.js';

/**
 * Validate audio size meets minimum requirements
 * 
 * @param {number} size - Audio size in bytes
 * @returns {object} - { valid: boolean, message?: string }
 */
export function validateAudioSize(size) {
  if (size < config.audio.minSize) {
    return {
      valid: false,
      message: `Audio too short (${size} bytes, minimum ${config.audio.minSize})`,
    };
  }

  if (size > config.audio.maxSize) {
    return {
      valid: false,
      message: `Audio too large (${size} bytes, maximum ${config.audio.maxSize})`,
    };
  }

  return { valid: true };
}

/**
 * Extract JSON from LLM response
 * Handles various wrapping formats (markdown, extra text, etc.)
 * 
 * @param {string} content - Raw LLM response
 * @returns {object|null} - Parsed JSON or null
 */
export function extractJSON(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Try direct parse first
  try {
    return JSON.parse(content);
  } catch {
    // Continue to extraction methods
  }

  // Try to find JSON in markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue to next method
    }
  }

  // Try to find JSON object anywhere in the string
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Give up
    }
  }

  return null;
}

/**
 * Validate and normalize interpretation result
 * Fills in defaults for missing fields
 * 
 * @param {object|null} parsed - Parsed JSON from LLM
 * @returns {object} - Validated interpretation
 */
export function validateInterpretation(parsed) {
  // Default fallback
  const defaults = {
    cleaned_intent: 'Unable to interpret request',
    final_prompt: '',
    intent_type: 'clarification',
    confidence: 0.3,
  };

  if (!parsed || typeof parsed !== 'object') {
    return defaults;
  }

  // Validate and normalize each field
  const result = {
    cleaned_intent: validateString(parsed.cleaned_intent, defaults.cleaned_intent),
    final_prompt: validateString(parsed.final_prompt, defaults.final_prompt),
    intent_type: validateIntentType(parsed.intent_type),
    confidence: validateConfidence(parsed.confidence),
  };

  // If final_prompt is empty but cleaned_intent exists, use cleaned_intent
  if (!result.final_prompt && result.cleaned_intent !== defaults.cleaned_intent) {
    result.final_prompt = result.cleaned_intent;
  }

  return result;
}

/**
 * Validate string field
 */
function validateString(value, defaultValue) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return defaultValue;
}

/**
 * Validate intent type
 */
function validateIntentType(value) {
  const validTypes = ['exploration', 'generation', 'clarification'];
  if (typeof value === 'string' && validTypes.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return 'clarification';
}

/**
 * Validate confidence score
 */
function validateConfidence(value) {
  const num = parseFloat(value);
  if (!isNaN(num) && num >= 0 && num <= 1) {
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  }
  return 0.5;
}
