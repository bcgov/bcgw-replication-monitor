import { JobRun } from "./JobRun";

/**
 * Paginated result of job runs with status counts.
 *
 * `total` is the count after filtering but before pagination,
 * used by frontend for page count calculations.
 * 
 * Counts reflect filtered results IGNORING the status filter,
 * so the summary bar can show how many results exist per status
 * regardless of which status checkboxes are currently active.
 */
export interface JobRunPage {
  items: JobRun[];
  total: number;
  counts: {
    all: number;
    success: number;
    failed: number;
  };
}
