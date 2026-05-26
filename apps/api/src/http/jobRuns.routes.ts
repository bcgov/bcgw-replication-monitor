import { Router } from "express";
import { createJobRunRepository } from "../infrastructure/repositoryFactory";
import { toDto } from "./jobRun.mapper";

/**
 * Routes for job runs endpoints.
 *
 * For now we directly instantiate the fake repository.
 */
const router = Router();

const repo = createJobRunRepository();

/**
 * GET /api/job-runs
 *
 * Returns all job runs.
 */
router.get("/job-runs", async (_req, res) => {
  const jobRuns = await repo.getJobRuns();
  res.json(jobRuns.map(toDto));
});

export default router;
