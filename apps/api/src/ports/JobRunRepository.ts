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
}
