import { JobRun } from "../domain/JobRun";

export interface JobRunRepository {
  getJobRuns(): Promise<JobRun[]>;
}
