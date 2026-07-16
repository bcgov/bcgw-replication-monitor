import { Router } from "express";
import { JobRunRepository } from "../ports/JobRunRepository";
import { toDto } from "./jobRun.mapper";
import { JobRunsQuerySchema } from "./jobRuns.validation";

/**
 * Creates the job runs router.
 */
export function jobRunsRouter(repo: JobRunRepository): Router {
  const router = Router();

  router.get("/job-runs", async (req, res) => {
    const parsed = JobRunsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid query",
        details: parsed.error.issues,
      });
    }

    try {
      const { items, total, counts } = await repo.find(parsed.data);
      return res.json({
        items: items.map(toDto),
        total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
        counts,
      });
    } catch (err) {
      console.error("job-runs list failed", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  /**
   * GET /api/schemas
   *
   * Returns the distinct destination schemas for the advanced filter dropdown.
   */
  router.get("/schemas", async (_req, res) => {
    try {
      const schemas = await repo.listSchemas();
      return res.json({ schemas });
    } catch (err) {
      console.error("list schemas failed", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  return router;
}
