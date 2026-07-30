import express from "express";
import { JobRunRepository } from "./ports/JobRunRepository";
import { jobRunsRouter } from "./http/jobRuns.routes";
import { adminAuth } from "./http/adminAuth";

/**
 * Creates the Express app.
 * @param repo The job run repository to use in the routes.
 * @returns The Express app instance.
 */
export function createApp(repo: JobRunRepository) {
  const app = express();

  app.use(express.json());

  // Liveness/readiness probe with no DB call
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api", adminAuth, jobRunsRouter(repo));

  return app;
}
