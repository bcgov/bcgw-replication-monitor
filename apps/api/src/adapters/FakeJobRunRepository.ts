import { JobRun } from "../domain/JobRun";
import { JobRunRepository } from "../ports/JobRunRepository";
import { JobRunQuery } from "../domain/JobRunQuery";
import { JobRunPage } from "../domain/JobRunPage";
import { sortJobRuns, paginate } from "./queryUtils";
import { JobHistoryQuery } from "../domain/JobHistoryQuery";

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
    destSchema: "DEST_SCHEMA_A",
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
    gateway: "fme",
    enabled: true,
    srcHost: "src-host-1",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_A",
    destHost: "dest-host-1",
    destSchema: "DEST_SCHEMA_A",
    destTable: "TABLE_A",
    lastChecked: new Date("2024-01-14T10:00:00Z"),
    lastConverted: new Date("2024-01-14T09:55:00Z"),
    status: "failed",
    updateType: "incremental",
    recordsRead: 800,
    recordsWritten: 0,
    dbInstance: "prod",
    logFilename: "fme_table_a_20240114.log",
  },
  {
    gateway: "fme",
    enabled: true,
    srcHost: "src-host-1",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_A",
    destHost: "dest-host-1",
    destSchema: "DEST_SCHEMA_A",
    destTable: "TABLE_A",
    lastChecked: new Date("2024-01-13T10:00:00Z"),
    lastConverted: new Date("2024-01-13T09:55:00Z"),
    status: "success",
    updateType: "full",
    recordsRead: 950,
    recordsWritten: 950,
    dbInstance: "prod",
    logFilename: "fme_table_a_20240113.log",
  },
  {
    gateway: "oracle",
    enabled: true,
    srcHost: "src-host-2",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_B",
    destHost: "dest-host-1",
    destSchema: "DEST_SCHEMA_B",
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
      const term = query.destSchema.toUpperCase();
      results = results.filter((r) =>
        r.destSchema.toUpperCase().includes(term),
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

    // Date range filter on "last checked" (advanced filter).
    // from/to are inclusive bounds; either can be provided independently.
    if (query.lastCheckedFrom) {
      const from = query.lastCheckedFrom;
      results = results.filter((r) => r.lastChecked >= from);
    }

    if (query.lastCheckedTo) {
      // Make "to" inclusive of the entire selected day (up to 23:59:59.999)
      const to = new Date(query.lastCheckedTo);
      to.setHours(23, 59, 59, 999);
      results = results.filter((r) => r.lastChecked <= to);
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

  /**
   * Returns the distinct destination schemas from the in-memory data.
   *
   * Mirrors the Oracle adapter's DISTINCT query so the schema dropdown
   * behaves the same in dev/test (fake) and production (Oracle).
   */
  async listSchemas(): Promise<string[]> {
    // Set removes duplicates, then sort alphabetically for a stable dropdown order
    // UPPER-case then dedupe to collapse case variants (matches Oracle)
    const schemas = new Set(this.data.map((r) => r.destSchema.toUpperCase()));
    return Array.from(schemas).sort();
  }

  /**
   * Returns all historical runs for a single job from the in-memory data.
   *
   * The job is identified by its destination schema + table. Matching is
   * case-insensitive to stay consistent with the main list (schema names can
   * appear in mixed case in the source data). Unlike find(), there are no
   * filters or pagination, the history page shows the full run history for
   * one job, just sorted.
   */
  async findHistory(query: JobHistoryQuery): Promise<JobRun[]> {
    const schema = query.destSchema.toUpperCase();
    const table = query.destTable.toUpperCase();

    // Match the specific job (case-insensitive on schema + table)
    let results = this.data.filter(
      (r) =>
        r.destSchema.toUpperCase() === schema &&
        r.destTable.toUpperCase() === table,
    );

    results = sortJobRuns(results, query.sortBy, query.sortDir);

    return results;
  }
}
