import { FakeJobRunRepository } from "../adapters/FakeJobRunRepository";
import { OracleJobRunRepository } from "../adapters/OracleJobRunRepository";
import { createPool } from "./db";
import { config } from "../config";
import { JobRunRepository } from "../ports/JobRunRepository";

let oracleRepo: JobRunRepository | null = null;

/**
 * Creates the appropriate repository based on config.
 * If `useFakeRepo` is true, it returns a new instance of `FakeJobRunRepository`.
 * Otherwise, it lazily initializes and returns a singleton instance of `OracleJobRunRepository`.
 * This ensures that the Oracle connection pool is created only once and reused across the application.
 * @returns {Promise<JobRunRepository>} An instance of JobRunRepository based on the configuration.
 */
export async function createJobRunRepository(): Promise<JobRunRepository> {
  if (config.useFakeRepo) {
    return new FakeJobRunRepository();
  }

  //Lazy init Oracle repo (pool created once)
  if (!oracleRepo) {
    const pool = await createPool();
    oracleRepo = new OracleJobRunRepository(pool, config.oracle.view);
  }

  return oracleRepo;
}
