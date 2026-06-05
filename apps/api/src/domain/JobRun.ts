export const JOB_RUN_STATUSES = [
  "success",
  "failed",
  "unchanged",
  "unknown",
] as const;
export const JOB_RUN_TYPES = ["fme", "oracle", "sdr", "other"] as const;
export const DB_INSTANCES = ["dlv", "test", "prod"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export const JOB_RUN_SORT_FIELDS = [
  "gateway",
  "srcHost",
  "srcSchema",
  "destSchema",
  "destTable",
  "lastConverted",
  "status",
  "updateType",
  "dbInstance",
] as const;

/**
 * TEMP local types (will move to shared later)
 */
export type JobRunStatus = (typeof JOB_RUN_STATUSES)[number];
export type JobRunType = (typeof JOB_RUN_TYPES)[number];
export type JobRunUpdateType = "full" | "incremental" | "mapsheet" | "force";
export type DbInstance = (typeof DB_INSTANCES)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
export type JobRunSortField = (typeof JOB_RUN_SORT_FIELDS)[number];

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
