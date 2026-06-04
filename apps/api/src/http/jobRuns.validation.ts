import { z } from "zod";
import {
  JOB_RUN_STATUSES,
  JOB_RUN_TYPES,
  DB_INSTANCES,
} from "../domain/JobRun";

/**
 * Validation schema for GET /api/job-runs query params.
 *
 * All fields are optional — no filters means return all data.
 */
export const JobRunsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(JOB_RUN_STATUSES).optional(),
  gateway: z.enum(JOB_RUN_TYPES).optional(),
  destSchema: z.string().trim().min(1).optional(),
  dbInstance: z.enum(DB_INSTANCES).optional(),
});

export type JobRunsQuery = z.infer<typeof JobRunsQuerySchema>;
