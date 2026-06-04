import { Router } from "express";
import { createJobRunRepository } from "../infrastructure/repositoryFactory";
import { toDto } from "./jobRun.mapper";
import { JobRunsQuerySchema } from "./jobRuns.validation";

const router = Router();
const repo = createJobRunRepository();

/**
 * GET /api/job-runs
 *
 * Supports optional query params:
 * - search: filters across srcTable, destTable, srcSchema, destSchema
 * - status: filters by job run status
 */
router.get("/job-runs", async (req, res) => {
  const parsed = JobRunsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parsed.error.issues,
    });
  }

  try {
    const jobRuns = await repo.find(parsed.data);
    return res.json(jobRuns.map(toDto));
  } catch (err) {
    console.error("job-runs list failed", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
