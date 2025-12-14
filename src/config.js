import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 8002,
  nodeEnv: process.env.NODE_ENV || "development",

  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },

  cors: {
    origin: "*"
  },

  audio: {
    maxSize: 10 * 1024 * 1024 // 10 MB
  }
};

export function validateConfig() {
  if (!config.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }
}
