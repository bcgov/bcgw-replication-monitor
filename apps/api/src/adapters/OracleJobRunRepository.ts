import oracledb from "oracledb";
import { JobRun } from "../domain/JobRun";
import { JobRunRepository } from "../ports/JobRunRepository";
import { JobRunQuery } from "../domain/jobRunQuery";
import { JobRunPage } from "../domain/jobRunPage";

/**
 * Oracle implementation of JobRunRepository.
 *
 * Uses SQL for filtering, sorting, and pagination.
 */
export class OracleJobRunRepository implements JobRunRepository {
  constructor(
    private readonly pool: oracledb.Pool,
    private readonly view: string,
  ) {}

  async find(query: JobRunQuery): Promise<JobRunPage> {
    const connection = await this.pool.getConnection();

    try {
      const { where, params } = this.buildWhere(query);

      // ✅ Total count (before pagination)
      const countSql = `SELECT COUNT(*) AS TOTAL FROM ${this.view} ${where}`;
      const countResult = await connection.execute<{ TOTAL: number }>(
        countSql,
        params,
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      const total = countResult.rows?.[0]?.TOTAL ?? 0;

      // ✅ Data query with sorting + pagination
      const dataSql = `
        SELECT * FROM (
          SELECT a.*, ROWNUM rnum FROM (
            SELECT *
            FROM ${this.view}
            ${where}
            ORDER BY ${this.mapSortField(query.sortBy)} ${query.sortDir.toUpperCase()}
          ) a
          WHERE ROWNUM <= :maxRow
        )
        WHERE rnum > :minRow
      `;

      const dataParams: Record<string, string | number> = {
        ...params,
        maxRow: query.offset + query.limit,
        minRow: query.offset,
      };

      const dataResult = await connection.execute<Record<string, unknown>>(
        dataSql,
        dataParams,
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      const items = (dataResult.rows ?? []).map((row) => this.mapRow(row));

      return { items, total };
    } finally {
      await connection.close();
    }
  }

  /**
   * Build WHERE clause dynamically
   */
  private buildWhere(query: JobRunQuery): {
    where: string;

    params: Record<string, string | number>;
  } {
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (query.status) {
      conditions.push("LAST_STATUS = :status");
      params.status = this.mapStatusToDb(query.status);
    }

    if (query.gateway) {
      conditions.push("APPLICATION_ACRONYM = :gateway");
      params.gateway = query.gateway.toUpperCase();
    }

    if (query.dbInstance) {
      conditions.push("DB_INSTANCE = :dbInstance");
      params.dbInstance = query.dbInstance.toUpperCase();
    }

    if (query.destSchema) {
      conditions.push("LOWER(DEST_SCHEMA) LIKE :destSchema");
      params.destSchema = `%${query.destSchema.toLowerCase()}%`;
    }

    if (query.search) {
      conditions.push(`
        (
          LOWER(SRC_TABLE) LIKE :search OR
          LOWER(DEST_TABLE) LIKE :search OR
          LOWER(SRC_SCHEMA) LIKE :search OR
          LOWER(DEST_SCHEMA) LIKE :search
        )
      `);
      params.search = `%${query.search.toLowerCase()}%`;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    return { where, params };
  }

  /**
   * Map API sort fields → DB columns
   */
  private mapSortField(field: string): string {
    const map: Record<string, string> = {
      gateway: "APPLICATION_ACRONYM",
      srcHost: "SRC_HOST",
      srcSchema: "SRC_SCHEMA",
      destSchema: "DEST_SCHEMA",
      destTable: "DEST_TABLE",
      lastConverted: "LAST_CONVERTED",
      status: "LAST_STATUS",
      updateType: "UPDATE_TYPE",
      dbInstance: "DB_INSTANCE",
    };

    return map[field] ?? "LAST_CONVERTED";
  }

  /**
   * Map Oracle row → domain model
   */
  private mapRow(row: Record<string, unknown>): JobRun {
    return {
      gateway: String(
        row.APPLICATION_ACRONYM ?? "other",
      ).toLowerCase() as JobRun["gateway"],

      enabled: String(row.ENABLED ?? "NO").toUpperCase() === "YES",

      srcHost: String(row.SRC_HOST ?? ""),
      srcSchema: String(row.SRC_SCHEMA ?? ""),
      srcTable: String(row.SRC_TABLE ?? ""),

      destHost: String(row.DEST_HOST ?? ""),
      destSchema: String(row.DEST_SCHEMA ?? ""),
      destTable: String(row.DEST_TABLE ?? ""),

      lastChecked: row.LAST_CHECKED
        ? new Date(row.LAST_CHECKED as string)
        : new Date(),

      lastConverted: row.LAST_CONVERTED
        ? new Date(row.LAST_CONVERTED as string)
        : new Date(),

      status: this.mapStatus(String(row.LAST_STATUS ?? "unknown")),

      updateType: String(
        row.UPDATE_TYPE ?? "",
      ).toLowerCase() as JobRun["updateType"],

      recordsRead: row.RECORDS_READ != null ? Number(row.RECORDS_READ) : null,

      recordsWritten:
        row.RECORDS_WRITTEN != null ? Number(row.RECORDS_WRITTEN) : null,

      dbInstance: String(
        row.DB_INSTANCE ?? "",
      ).toLowerCase() as JobRun["dbInstance"],
    };
  }

  /**
   * Maps Oracle LAST_STATUS values to domain status.
   *
   * DB uses "ERROR" but domain/UI uses "failed".
   */
  private mapStatus(raw: string): JobRun["status"] {
    const normalized = raw.toLowerCase();
    if (normalized === "error") return "failed";
    if (normalized === "success") return "success";
    if (normalized === "unchanged") return "unchanged";
    return "unknown";
  }

  /**
   * Maps domain status back to Oracle LAST_STATUS value.
   *
   * Reverse of mapStatus — used in WHERE clauses.
   */
  private mapStatusToDb(status: string): string {
    if (status === "failed") return "ERROR";
    return status.toUpperCase();
  }
}
