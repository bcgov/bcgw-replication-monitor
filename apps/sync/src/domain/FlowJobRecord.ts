export const UNMAPPED = "UNMAPPED";
export const UNKNOWN = "UNKNOWN";

export type JobCategory = "BCGW" | "NON_BCGW";
export type FmeStatus = "SUCCESS" | "UNCHANGED" | "ERROR";
export type ResolvedBy =
  "dwm_exact" | "dwm_history" | "flow_params" | "unmapped";

/** One row of FME_FLOW_JOB. */
export interface FlowJobRecord {
  flowJobId: number;
  category: JobCategory;
  repository: string;
  workspace: string;
  kirkJobId: string | null;
  kirkJobLabel: string | null;
  status: FmeStatus;
  statusRaw: string;
  statusMessage: string | null;
  numLines: number | null;
  timeStarted: Date | null;
  timeFinished: Date | null;
  sourceType: string | null;
  sourceName: string | null;
  datasource: string | null; // from DWM; feeds src_host / src_table in the view
  destEnvKey: string | null;
  destInstance: string; // host name, or UNKNOWN
  destSchema: string; // UNMAPPED if not resolved
  destTable: string | null;
  destResolvedBy: ResolvedBy;
  recordsRead: number | null; // DWM only
  recordsWritten: number | null; // DWM, else Flow
  dwmMatched: boolean;
}

/** Fields the re-resolve step is allowed to update. */
export type ResolutionUpdate = Pick<
  FlowJobRecord,
  | "flowJobId"
  | "destInstance"
  | "destSchema"
  | "destTable"
  | "destResolvedBy"
  | "datasource"
  | "recordsRead"
  | "recordsWritten"
  | "dwmMatched"
  | "status"
>;
