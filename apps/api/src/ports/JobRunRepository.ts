import { JobHistoryQuery } from "../domain/JobHistoryQuery";
import { JobRun } from "../domain/JobRun";
import { JobRunPage } from "../domain/JobRunPage";
import { JobRunQuery } from "../domain/JobRunQuery";

/**
 * Port for accessing job run data.
 *
 * Implementations (adapters) handle the actual data retrieval.
 */
export interface JobRunRepository {
  find(query: JobRunQuery): Promise<JobRunPage>;

  /**
   * Returns the distinct destination schemas, sorted alphabetically.
   * Used to populate the advanced filter's schema dropdown.
   */
  listSchemas(): Promise<string[]>;

  /**
   * Returns all historical runs for a single job, identified by its
   * destination schema + table, sorted per the given options.
   * Reads from the history view (all runs), not the main view.
   */
  findHistory(query: JobHistoryQuery): Promise<JobRun[]>;
}
