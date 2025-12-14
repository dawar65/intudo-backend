import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

export async function interpretIntent(transcript, { platform }) {
  const system = `
You are Intudo.
You convert spoken intent into clean prompts.

Rules:
- Do NOT invent formats
- Do NOT assume email unless said
- Stay close to meaning
- Expand only if needed
Return JSON only.
`;

  const user = `
Transcript:
"${transcript}"

Platform: ${platform}

Return:
{
  "cleaned_intent": "...",
  "final_prompt": "...",
  "intent_type": "exploration | generation | clarification",
  "confidence": 0.0
}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
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
