import express from "express";
import { JobRunRepository } from "./ports/JobRunRepository";
import { jobRunsRouter } from "./http/jobRuns.routes";

/**
 * Creates the Express app.
 * @param repo The job run repository to use in the routes.
 * @returns The Express app instance.
 */
export function createApp(repo: JobRunRepository) {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.send("OK");
  });

  app.use("/api", jobRunsRouter(repo));

  return app;
}
