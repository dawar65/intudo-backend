/**
 * Intudo Backend - Speech-to-Text Service
 * Uses OpenAI Whisper API for transcription
 */

import OpenAI from 'openai';
import fs from 'fs';
import { config } from '../config.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Transcribe audio file using OpenAI Whisper
 * 
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(filePath) {
  try {
    // Create file stream for Whisper API
    const audioStream = fs.createReadStream(filePath);

    // Call Whisper API
    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: config.openai.whisperModel,
      language: 'en', // Optimize for English
      response_format: 'text',
    });

    // Response is the transcript text directly
    const transcript = typeof response === 'string' ? response : response.text || '';

    return transcript.trim();

  } catch (error) {
    console.error('[STT] Whisper API error:', error.message);

    // Handle specific error types
    if (error.code === 'audio_too_short') {
      throw new Error('Audio is too short for transcription');
    }

    if (error.status === 400) {
      throw new Error('Invalid audio format');
    }

    if (error.status === 401) {
      throw new Error('OpenAI API authentication failed');
    }

    throw new Error(`Transcription failed: ${error.message}`);
  }
}
