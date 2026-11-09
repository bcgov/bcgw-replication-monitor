/** The FME_STATUS_LOG fields the sync needs. */
export interface DwmRow {
  flowJobId: number | null; // extracted from LOG_FILENAME
  mappingFileId: string; // FMW name without .fmw
  startTime: Date | null;
  destInstance: string | null;
  destSchema: string | null;
  destTable: string | null;
  datasource: string | null;
  featuresRead: number | null;
  featuresWritten: number | null;
}
