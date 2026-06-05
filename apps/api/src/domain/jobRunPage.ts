import { JobRun } from "./JobRun";

/**
 * Paginated result of job runs.
 *
 * `total` is the count after filtering but before pagination,
 * used by frontend for page count calculations.
 */
export interface JobRunPage {
  items: JobRun[];
  total: number;
}
