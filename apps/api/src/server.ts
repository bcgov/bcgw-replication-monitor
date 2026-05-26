import express from "express";
import jobRunsRoutes from "./http/jobRuns.routes";
import { config } from "./config";

const app = express();

app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.send("OK");
});

// Mount API routes
app.use("/api", jobRunsRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
