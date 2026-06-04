export const JOB_RUN_STATUSES = [
  "success",
  "failed",
  "unchanged",
  "unknown",
] as const;

/**
 * TEMP local types (will move to shared later)
 */
export type JobRunStatus = (typeof JOB_RUN_STATUSES)[number];
export type JobRunType = "fme" | "oracle" | "sdr" | "other";
export type JobRunUpdateType = "full" | "incremental" | "mapsheet" | "force";
export type DbInstance = "dlv" | "test" | "prod";

/**
 * Domain representation of a single replication job run.
 */
export interface JobRun {
  gateway: JobRunType;
  enabled: boolean;
  srcHost: string;
  srcSchema: string;
  srcTable: string;
  destHost: string;
  destSchema: string;
  destTable: string;
  lastChecked: Date;
  lastConverted: Date;
  status: JobRunStatus;
  updateType: JobRunUpdateType;
  recordsRead: number | null;
  recordsWritten: number | null;
  dbInstance: DbInstance;
}
