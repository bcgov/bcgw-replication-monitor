import { JobRunPage } from "../domain/jobRunPage";
import { JobRunQuery } from "../domain/jobRunQuery";

/**
 * Port for accessing job run data.
 *
 * Implementations (adapters) handle the actual data retrieval.
 */
export interface JobRunRepository {
  find(query: JobRunQuery): Promise<JobRunPage>;
}
