import { config } from "../config";
import { JobRunRepository } from "../ports/JobRunRepository";
import { FakeJobRunRepository } from "../adapters/FakeJobRunRepository";

/**
 * Creates the appropriate JobRunRepository based on config.
 *
 * Returns fake repository for now
 */
export function createJobRunRepository(): JobRunRepository {
  if (config.useFakeRepo) {
    console.log("[startup] Using FakeJobRunRepository");
    return new FakeJobRunRepository();
  }

  // TODO: return OracleJobRunRepository once available
  throw new Error("Oracle repository not implemented yet");
}
