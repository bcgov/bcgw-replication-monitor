import { JobRun } from "../domain/JobRun";
import { JobRunRepository } from "../ports/JobRunRepository";
import { JobRunQuery } from "../domain/JobRunQuery";
import { JobRunPage } from "../domain/JobRunPage";
import { sortJobRuns, paginate } from "./queryUtils";

/**
 * Static seed data used when running without a real Oracle connection.
 */
const SAMPLE: JobRun[] = [
  {
    gateway: "fme",
    enabled: true,
    srcHost: "src-host-1",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_A",
    destHost: "dest-host-1",
    destSchema: "DEST_SCHEMA",
    destTable: "TABLE_A",
    lastChecked: new Date("2024-01-15T10:00:00Z"),
    lastConverted: new Date("2024-01-15T09:55:00Z"),
    status: "success",
    updateType: "full",
    recordsRead: 1000,
    recordsWritten: 1000,
    dbInstance: "dlv",
  },
  {
    gateway: "oracle",
    enabled: true,
    srcHost: "src-host-2",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_B",
    destHost: "dest-host-1",
    destSchema: "DEST_SCHEMA",
    destTable: "TABLE_B",
    lastChecked: new Date("2024-01-15T10:05:00Z"),
    lastConverted: new Date("2024-01-15T09:50:00Z"),
    status: "failed",
    updateType: "incremental",
    recordsRead: 500,
    recordsWritten: 0,
    dbInstance: "dlv",
  },
];

/**
 * Fake implementation of JobRunRepository.
 *
 * Returns static data filtered in-memory.
 * Used for local development and testing.
 */
export class FakeJobRunRepository implements JobRunRepository {
  private readonly data: JobRun[];

  constructor(data: JobRun[] = SAMPLE) {
    this.data = data;
  }

  async find(query: JobRunQuery): Promise<JobRunPage> {
    let results = [...this.data];

    if (query.status) {
      results = results.filter((r) => r.status === query.status);
    }

    if (query.gateway) {
      results = results.filter((r) => r.gateway === query.gateway);
    }

    if (query.destSchema) {
      const term = query.destSchema.toLowerCase();
      results = results.filter((r) =>
        r.destSchema.toLowerCase().includes(term),
      );
    }

    if (query.search) {
      const term = query.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.srcTable.toLowerCase().includes(term) ||
          r.destTable.toLowerCase().includes(term) ||
          r.srcSchema.toLowerCase().includes(term) ||
          r.destSchema.toLowerCase().includes(term),
      );
    }

    if (query.dbInstance) {
      results = results.filter((r) => r.dbInstance === query.dbInstance);
    }

    // Sort
    results = sortJobRuns(results, query.sortBy, query.sortDir);

    // Total after filtering, before pagination
    const total = results.length;

    // Paginate
    results = paginate(results, query.offset, query.limit);

    return { items: results, total };
  }
}
