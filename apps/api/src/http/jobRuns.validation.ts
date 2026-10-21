import { z } from "zod";
import {
  JOB_RUN_STATUSES,
  JOB_RUN_TYPES,
  DB_INSTANCES,
  JOB_RUN_SORT_FIELDS,
  SORT_DIRECTIONS,
} from "../domain/JobRun";

/**
 * Calendar date from a query param, kept as a "YYYY-MM-DD" string
 * NOT converted to a Date: JS parses date-only strings as
 * midnight UTC, which shifts the filter by the server's UTC offset
 * Oracle builds the date itself with TO_DATE, so no time zone is involved
 */
const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "Invalid calendar date");

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
  // Kept as "YYYY-MM-DD" strings, the repository converts them with TO_DATE
  lastCheckedFrom: dateOnly.optional(),
  lastCheckedTo: dateOnly.optional(),
});

/**
 * Path params for the history endpoint, the job identifier.
 */
export const JobHistoryParamsSchema = z.object({
  destSchema: z.string().trim().min(1),
  destTable: z.string().trim().min(1),
});

/**
 * Query params for the history endpoint, sorting only (no filters/pagination).
 */
export const JobHistoryQuerySchema = z.object({
  sortBy: z.enum(JOB_RUN_SORT_FIELDS).default("lastChecked"),
  sortDir: z.enum(SORT_DIRECTIONS).default("desc"),
});

export type JobHistoryParams = z.infer<typeof JobHistoryParamsSchema>;
export type JobHistoryQuery = z.infer<typeof JobHistoryQuerySchema>;
export type JobRunsQuery = z.infer<typeof JobRunsQuerySchema>;
