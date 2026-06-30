export interface JobRun {
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
