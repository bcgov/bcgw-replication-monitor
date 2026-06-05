import { z } from "zod";
import {
  JOB_RUN_STATUSES,
  JOB_RUN_TYPES,
  DB_INSTANCES,
  JOB_RUN_SORT_FIELDS,
  SORT_DIRECTIONS,
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
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(JOB_RUN_SORT_FIELDS).default("lastConverted"),
  sortDir: z.enum(SORT_DIRECTIONS).default("desc"),
});

export type JobRunsQuery = z.infer<typeof JobRunsQuerySchema>;
