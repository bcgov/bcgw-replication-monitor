import express from "express";
import { JobRunRepository } from "./ports/JobRunRepository";
import { jobRunsRouter } from "./http/jobRuns.routes";
import { decodeUserInfo, adminAuth } from "./http/adminAuth";

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

  /**
   * Returns the current user's info + roles.
   * Available to any authenticated user (does NOT require admin),
   * so the frontend can decide what to render.
   */
  app.get("/api/me", (req, res) => {
    const user = decodeUserInfo(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({
      roles: user.client_roles,
      displayName: user.display_name,
      email: user.email,
    });
  });

  app.use("/api", adminAuth, jobRunsRouter(repo));

  return app;
}
