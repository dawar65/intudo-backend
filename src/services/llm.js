/**
 * Intudo Backend - LLM Service
 * Uses GPT-4o-mini for intent interpretation
 */

import OpenAI from 'openai';
import { config } from '../config.js';
import { getIntentPrompt } from '../prompts/intentPrompt.js';
import { extractJSON, validateInterpretation } from '../utils/validate.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Interpret user intent from transcript and generate improved prompt
 * 
 * @param {string} transcript - Raw speech transcript
 * @param {object} context - Additional context (platform, etc.)
 * @returns {Promise<object>} - Interpretation result
 */
export async function interpretIntent(transcript, context = {}) {
  try {
    // Get system prompt with examples
    const systemPrompt = getIntentPrompt();

    // Build user message
    const userMessage = buildUserMessage(transcript, context);

    // Call GPT-4o-mini
    const response = await openai.chat.completions.create({
      model: config.openai.llmModel,
      temperature: config.openai.temperature,
      max_tokens: config.openai.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    // Extract response content
    const content = response.choices[0]?.message?.content || '';

    // Parse JSON from response (handles markdown wrapping, etc.)
    const parsed = extractJSON(content);

    // Validate and fill defaults
    const validated = validateInterpretation(parsed);

    return validated;

  } catch (error) {
    console.error('[LLM] Interpretation error:', error.message);

    // Return safe fallback
    return {
      cleaned_intent: 'Unable to interpret the request',
      final_prompt: transcript, // Fall back to raw transcript
      intent_type: 'clarification',
      confidence: 0.3,
    };
  }
}

/**
 * Build the user message for the LLM
 */
function buildUserMessage(transcript, context) {
  let message = `Transcript: "${transcript}"`;

  if (context.platform) {
    message += `\nPlatform: ${context.platform}`;
  }

  return message;
}
