/**
 * Intudo Backend Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '8002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    whisperModel: 'whisper-1',
    llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1024', 10),
  },

  // Audio Constraints
  audio: {
    minSize: parseInt(process.env.MIN_AUDIO_SIZE || '1500', 10),
    maxSize: 25 * 1024 * 1024, // 25MB (Whisper limit)
    tempDir: join(__dirname, '..', 'temp'),
  },

  // CORS
  cors: {
    origin: '*', // Extension can run from any origin
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  },
};

// Validate required configuration
export function validateConfig() {
  const errors = [];

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}
