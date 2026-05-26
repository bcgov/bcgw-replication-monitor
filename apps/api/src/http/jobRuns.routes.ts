import { Router } from "express";
import { FakeJobRunRepository } from "../adapters/FakeJobRunRepository";

/**
 * Routes for job runs endpoints.
 *
 * For now we directly instantiate the fake repository.
 */
const router = Router();

const repo = new FakeJobRunRepository();

/**
 * GET /api/job-runs
 *
 * Returns all job runs.
 */
router.get("/job-runs", async (_req, res) => {
  const jobRuns = await repo.getJobRuns();
  res.json(jobRuns);
});

export default router;
