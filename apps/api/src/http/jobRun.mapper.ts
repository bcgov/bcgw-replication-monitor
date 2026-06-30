import { JobRun } from "../domain/JobRun";

/**
 * API response shape for a single job run.
 *
 * Intentionally separate from the domain model.
 * Dates are serialised as ISO strings over the wire.
 * This will move to the shared package later.
 */
export interface JobRunDto {
  gateway: string;
  enabled: boolean;
  srcHost: string;
  srcSchema: string;
  srcTable: string;
  destHost: string;
  destSchema: string;
  destTable: string;
  lastChecked: string;
  lastConverted: string;
  status: string;
  updateType: string;
  recordsRead: number | null;
  recordsWritten: number | null;
  dbInstance: string;
  logFilename: string | null;
}

/** Maps a domain JobRun to the API response shape. */
export function toDto(run: JobRun): JobRunDto {
  return {
    gateway: run.gateway,
    enabled: run.enabled,
    srcHost: run.srcHost,
    srcSchema: run.srcSchema,
    srcTable: run.srcTable,
    destHost: run.destHost,
    destSchema: run.destSchema,
    destTable: run.destTable,
    lastChecked: run.lastChecked.toISOString(),
    lastConverted: run.lastConverted.toISOString(),
    status: run.status,
    updateType: run.updateType,
    recordsRead: run.recordsRead,
    recordsWritten: run.recordsWritten,
    dbInstance: run.dbInstance,
    logFilename: run.logFilename,
  };
}
