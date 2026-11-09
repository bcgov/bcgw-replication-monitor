import { FlowJobRecord, ResolutionUpdate } from "../domain/FlowJobRecord";

/** The sync's own table (FME_FLOW_JOB). */
export interface FlowJobStore {
  /** Which of these Flow job IDs are already stored. */
  findExistingIds(flowJobIds: number[]): Promise<Set<number>>;

  /** Insert new rows. Rows whose FLOW_JOB_ID already exists are left unchanged. */
  insertMany(records: FlowJobRecord[]): Promise<number>;

  /**
   * Rows that need another resolution attempt:
   * - destResolvedBy = "unmapped" or destInstance = UNKNOWN (no time limit)
   * - no DWM match yet and started within the last `recentHours`
   */
  findUnresolved(recentHours: number): Promise<FlowJobRecord[]>;

  /** Update resolution fields only. Flow's own data is never changed. */
  updateResolution(updates: ResolutionUpdate[]): Promise<number>;

  /**
   * Latest resolved destination for each KIRK job ID, from our own table.
   * Lets KIRK jobs keep their destination after Flow's ~5 weeks of history expire.
   */
  findLatestResolvedByKirkJobId(
    kirkJobIds: string[],
  ): Promise<Map<string, FlowJobRecord>>;
}
