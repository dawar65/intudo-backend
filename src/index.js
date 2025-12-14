import express from "express";
import cors from "cors";
import { config, validateConfig } from "./config.js";
import { interpretRouter } from "./routes/interpret.js";
import { errorHandler } from "./middleware/error.js";
import { ensureTempDir } from "./utils/file.js";

// Validate ENV early
validateConfig();

const app = express();

app.use(cors(config.cors));
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: "intudo-backend",
    version: "0.1.0",
    timestamp: new Date().toISOString()
  });
});

app.use("/v0", interpretRouter);
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

await ensureTempDir();

app.listen(config.port, () => {
  console.log(`Intudo backend running on port ${config.port}`);
});
