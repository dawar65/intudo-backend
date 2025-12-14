import OpenAI from "openai";
import { config } from "../config.js";
import { getIntentPrompt } from "../prompts/intentprompt.js";

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

export async function interpretIntent(transcript, { platform }) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: getIntentPrompt() },
      { role: "user", content: transcript }
    ]
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return {
      cleaned_intent: transcript,
      final_prompt: transcript,
      intent_type: "clarification",
      confidence: 0.3
    };
  }
}

