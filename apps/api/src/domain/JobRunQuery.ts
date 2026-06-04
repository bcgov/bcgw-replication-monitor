import { JobRunStatus, JobRunType, DbInstance } from "./JobRun";

/**
 * Query parameters for fetching job runs.
 */
export interface JobRunQuery {
  search?: string;
  status?: JobRunStatus;
  gateway?: JobRunType;
  destSchema?: string;
  dbInstance?: DbInstance;
}
