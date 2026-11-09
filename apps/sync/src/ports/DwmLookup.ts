import { DwmRow } from "../domain/DwmRow";

/** Read-only access to the DWM table (FME_STATUS_LOG). */
export interface DwmLookup {
  /** DWM rows for these Flow job IDs (matched via LOG_FILENAME). */
  findByFlowJobIds(flowJobIds: number[]): Promise<Map<number, DwmRow>>;

  /**
   * Latest DWM row (by START_TIME) for each FMW.
   * FMW names are without ".fmw" (MAPPING_FILE_ID).
   * FMWs with no DWM rows are absent from the result.
   */
  findLatestByWorkspace(mappingFileIds: string[]): Promise<Map<string, DwmRow>>;
}
