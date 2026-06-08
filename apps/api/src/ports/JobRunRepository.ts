import { JobRunPage } from "../domain/JobRunPage";
import { JobRunQuery } from "../domain/JobRunQuery";

/**
 * Port for accessing job run data.
 *
 * Implementations (adapters) handle the actual data retrieval.
 */
export interface JobRunRepository {
  find(query: JobRunQuery): Promise<JobRunPage>;
}
