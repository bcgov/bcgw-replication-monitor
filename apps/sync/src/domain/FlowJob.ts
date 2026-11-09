/**
 * One completed FME Flow run, in the format we need
 */
export interface FlowJob {
  id: number;
  repository: string;
  workspace: string; // e.g. "APP_KIRK__FGDB.fmw"
  statusRaw: string; // Flow value: SUCCESS, FME_FAILURE, ...
  statusMessage: string | null;
  numLines: number | null; // 0 = no log produced
  numFeaturesOutput: number | null;
  timeStarted: Date | null;
  timeFinished: Date | null;
  sourceType: string | null; // SCHEDULES, AUTOMATIONS, ...
  sourceName: string | null;
  /** Parameters sent with the job request (doesn't include defaults) */
  requestParams: Record<string, string>;
}
