import { Router } from "express";
import { JobRunRepository } from "../ports/JobRunRepository";
import { toDto } from "./jobRun.mapper";
import {
  JobRunsQuerySchema,
  JobHistoryParamsSchema,
  JobHistoryQuerySchema,
} from "./jobRuns.validation";

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

  /**
   * GET /api/history/:destSchema/:destTable
   *
   * Returns all historical runs for a single job (identified by destination
   * schema + table), sorted. No filters or pagination.
   */
  router.get("/history/:destSchema/:destTable", async (req, res) => {
    // Validate the job identifier (path params)
    const parsedParams = JobHistoryParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid job identifier",
        details: parsedParams.error.issues,
      });
    }

    // Validate sort (query params)
    const parsedQuery = JobHistoryQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: "Invalid query",
        details: parsedQuery.error.issues,
      });
    }

    try {
      const runs = await repo.findHistory({
        destSchema: parsedParams.data.destSchema,
        destTable: parsedParams.data.destTable,
        sortBy: parsedQuery.data.sortBy,
        sortDir: parsedQuery.data.sortDir,
      });

      return res.json({ items: runs.map(toDto) });
    } catch (err) {
      console.error("job history failed", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  return router;
}
