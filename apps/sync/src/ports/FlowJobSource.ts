import { FlowJob } from "../domain/FlowJob";

export interface FlowJobPage {
  items: FlowJob[];
  totalCount: number;
}

/** Reads completed jobs and FMW parameter defaults from FME Flow. */
export interface FlowJobSource {
  /** Completed jobs, newest first (sorted by finish time). */
  getCompletedJobs(offset: number, limit: number): Promise<FlowJobPage>;

  /**
   * Default values of an FMW's published parameters.
   * Needed because job records omit parameters left at their default.
   */
  getWorkspaceDefaults(
    repository: string,
    workspace: string,
  ): Promise<Record<string, string>>;
}
