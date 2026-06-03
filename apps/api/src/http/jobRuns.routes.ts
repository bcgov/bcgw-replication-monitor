import { Router } from "express";
import { createJobRunRepository } from "../infrastructure/repositoryFactory";
import { toDto } from "./jobRun.mapper";

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
  try {
    const query = {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
    };

    const jobRuns = await repo.find(query);
    res.json(jobRuns.map(toDto));
  } catch (err) {
    console.error("job-runs list failed", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
