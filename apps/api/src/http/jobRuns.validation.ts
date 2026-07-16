import { z } from "zod";
import {
  JOB_RUN_STATUSES,
  JOB_RUN_TYPES,
  DB_INSTANCES,
  JOB_RUN_SORT_FIELDS,
  SORT_DIRECTIONS,
} from "../domain/JobRun";

/**
 * Normalises a query param into an array.
 *
 * Handles:
 * - undefined to undefined
 * - single value to [value]
 * - comma-separated to [value1, value2]
 * - already an array to as is
 */
const toArray = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((v) => {
    if (v === undefined) return undefined;
    const arr = Array.isArray(v) ? v : String(v).split(",");
    return arr.map((s) => String(s).trim()).filter(Boolean);
  }, z.array(inner).optional());

export const JobRunsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: toArray(z.enum(JOB_RUN_STATUSES)),
  gateway: toArray(z.enum(JOB_RUN_TYPES)),
  dbInstance: toArray(z.enum(DB_INSTANCES)),
  destSchema: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(JOB_RUN_SORT_FIELDS).default("lastChecked"),
  sortDir: z.enum(SORT_DIRECTIONS).default("desc"),
  // Date range filter on "last checked" (advanced filter).
  // z.coerce.date() parses ISO strings from query params into Date objects.
  lastCheckedFrom: z.coerce.date().optional(),
  lastCheckedTo: z.coerce.date().optional(),
});

export type JobRunsQuery = z.infer<typeof JobRunsQuerySchema>;
