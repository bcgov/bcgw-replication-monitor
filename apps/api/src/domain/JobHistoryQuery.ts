import { JobRunSortField, SortDirection } from "./JobRun";

/**
 * Query for a single job's run history.
 * The job is identified by destination schema + table, and only has sorting options (no filtering).
 */
export interface JobHistoryQuery {
  destSchema: string;
  destTable: string;
  sortBy: JobRunSortField;
  sortDir: SortDirection;
}
