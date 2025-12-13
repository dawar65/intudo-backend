/**
 * Intudo Backend - Server Bootstrap
 * Voice-first intent layer for LLMs
 * 
 * This backend serves the Intudo Chrome Extension,
 * providing speech-to-text and intent interpretation.
 */

import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config.js';
import { interpretRouter } from './routes/interpret.js';
import { errorHandler } from './middleware/error.js';
import { ensureTempDir } from './utils/file.js';

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'intudo-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/v0', interpretRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Ensure temp directory exists
await ensureTempDir();

// Start server
app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║         INTUDO BACKEND v0.1.0                 ║
  ╠═══════════════════════════════════════════════╣
  ║  Status:    Running                           ║
  ║  Port:      ${config.port}                             ║
  ║  Env:       ${config.nodeEnv.padEnd(29)}║
  ║  Endpoint:  POST /v0/interpret                ║
  ╚═══════════════════════════════════════════════╝
  `);
});
