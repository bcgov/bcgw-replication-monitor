import oracledb from "oracledb";
import { JobRun } from "../domain/JobRun";
import { JobRunRepository } from "../ports/JobRunRepository";
import { JobRunQuery } from "../domain/JobRunQuery";
import { JobRunPage } from "../domain/JobRunPage";

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

      //  Build WHERE for counts (everything EXCEPT status)
      const { where: countsWhere, params: countsParams } = this.buildWhere({
        ...query,
        status: undefined, // ignore status for counts
      });

      // Counts query, group by status
      const countsSql = `
      SELECT LAST_STATUS, COUNT(*) AS CNT
      FROM ${this.view}
      ${countsWhere}
      GROUP BY LAST_STATUS
    `;

      const countsResult = await connection.execute<{
        LAST_STATUS: string;
        CNT: number;
      }>(countsSql, countsParams, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      const counts = { all: 0, success: 0, failed: 0 };
      (countsResult.rows ?? []).forEach((row) => {
        const status = this.mapStatus(row.LAST_STATUS);
        counts.all += row.CNT;
        if (status === "success") counts.success += row.CNT;
        if (status === "failed") counts.failed += row.CNT;
      });

      // Apply status filter for items
      const { where, params } = this.buildWhere(query);

      // Total count (after all filters)
      const totalSql = `SELECT COUNT(*) AS TOTAL FROM ${this.view} ${where}`;
      const totalResult = await connection.execute<{ TOTAL: number }>(
        totalSql,
        params,
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const total = totalResult.rows?.[0]?.TOTAL ?? 0;

      // Data query with sorting + pagination
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

      return { items, total, counts };
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
    // If any filter is explicitly empty, return no results
    if (
      (query.status && query.status.length === 0) ||
      (query.gateway && query.gateway.length === 0) ||
      (query.dbInstance && query.dbInstance.length === 0)
    ) {
      return {
        where: "WHERE 1=0",
        params: {},
      };
    }
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (query.status?.length) {
      const placeholders = query.status.map((_, i) => `:status${i}`);
      conditions.push(`LAST_STATUS IN (${placeholders.join(", ")})`);
      query.status.forEach((s, i) => {
        params[`status${i}`] = this.mapStatusToDb(s);
      });
    }

    if (query.gateway?.length) {
      const placeholders = query.gateway.map((_, i) => `:gateway${i}`);
      conditions.push(`APPLICATION_ACRONYM IN (${placeholders.join(", ")})`);
      query.gateway.forEach((g, i) => {
        params[`gateway${i}`] = g.toUpperCase();
      });
    }

    if (query.dbInstance?.length) {
      const placeholders = query.dbInstance.map((_, i) => `:db${i}`);
      conditions.push(`DB_INSTANCE IN (${placeholders.join(", ")})`);
      query.dbInstance.forEach((d, i) => {
        params[`db${i}`] = d.toUpperCase();
      });
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
