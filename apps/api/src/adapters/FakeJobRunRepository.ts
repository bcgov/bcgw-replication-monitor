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
    dbInstance: "prod",
    logFilename: "fme_table_a_20240115.log",
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
    dbInstance: "test",
    logFilename: "oracle_table_b_20240115.log",
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
    // Empty array filter, return no results
    if (
      (query.status && query.status.length === 0) ||
      (query.gateway && query.gateway.length === 0) ||
      (query.dbInstance && query.dbInstance.length === 0)
    ) {
      return {
        items: [],
        total: 0,
        counts: { all: 0, success: 0, failed: 0 },
      };
    }

    let results = [...this.data];

    // Apply all filters EXCEPT status (for counts)
    if (query.gateway?.length) {
      results = results.filter((r) => query.gateway!.includes(r.gateway));
    }

    if (query.dbInstance?.length) {
      results = results.filter((r) => query.dbInstance!.includes(r.dbInstance));
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
          r.destTable.toLowerCase().includes(term) ||
          (r.logFilename?.toLowerCase().includes(term) ?? false),
      );
    }

    // Compute counts BEFORE status filter
    const counts = {
      all: results.length,
      success: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    // Now apply status filter (for items only)
    if (query.status?.length) {
      results = results.filter((r) => query.status!.includes(r.status));
    }

    // Sort
    results = sortJobRuns(results, query.sortBy, query.sortDir);

    // Total after filtering, before pagination
    const total = results.length;

    // Paginate
    results = paginate(results, query.offset, query.limit);

    return { items: results, total, counts };
  }
}
