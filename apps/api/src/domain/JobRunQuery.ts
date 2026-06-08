import { JobRunStatus, JobRunType, DbInstance, JobRunSortField, SortDirection } from "./JobRun";

/**
 * Query parameters for fetching job runs.
 */
export interface JobRunQuery {
  search?: string;
  status?: JobRunStatus;
  gateway?: JobRunType;
  destSchema?: string;
  dbInstance?: DbInstance;
  limit: number;
  offset: number;
  sortBy: JobRunSortField;
  sortDir: SortDirection;
}
