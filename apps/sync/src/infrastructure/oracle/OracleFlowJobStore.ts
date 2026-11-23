import oracledb from "oracledb";
import {
  DbInstance,
  FlowJobRecord,
  FmeStatus,
  JobCategory,
  ResolutionUpdate,
  ResolvedBy,
} from "../../domain/FlowJobRecord";
import { FlowJobStore } from "../../ports/FlowJobStore";

//Oracle allows at most 1000 values in one IN list. */
const MAX_IN_VALUES = 1000;

//Rows per executeMany call, so the first backfill doesn't send everything at once
const WRITE_BATCH_SIZE = 500;

const COLUMNS = `
  FLOW_JOB_ID, CATEGORY, REPOSITORY, WORKSPACE, KIRK_JOBID, KIRK_JOBLABEL,
  STATUS, STATUS_RAW, STATUS_MESSAGE, NUM_LINES, TIME_STARTED, TIME_FINISHED,
  SOURCE_TYPE, SOURCE_NAME, DATASOURCE, DEST_ENV_KEY, DB_INSTANCE, DEST_INSTANCE,
  DEST_SCHEMA, DEST_TABLE, DEST_RESOLVED_BY, RECORDS_READ, RECORDS_WRITTEN, DWM_MATCHED
`;

interface FlowJobDbRow {
  FLOW_JOB_ID: number;
  CATEGORY: string;
  REPOSITORY: string | null;
  WORKSPACE: string | null;
  KIRK_JOBID: string | null;
  KIRK_JOBLABEL: string | null;
  STATUS: string;
  STATUS_RAW: string;
  STATUS_MESSAGE: string | null;
  NUM_LINES: number | null;
  TIME_STARTED: Date | null;
  TIME_FINISHED: Date | null;
  SOURCE_TYPE: string | null;
  SOURCE_NAME: string | null;
  DATASOURCE: string | null;
  DEST_ENV_KEY: string | null;
  DB_INSTANCE: string | null;
  DEST_INSTANCE: string | null;
  DEST_SCHEMA: string | null;
  DEST_TABLE: string | null;
  DEST_RESOLVED_BY: string;
  RECORDS_READ: number | null;
  RECORDS_WRITTEN: number | null;
  DWM_MATCHED: string;
}

const str = (maxSize: number) => ({ type: oracledb.STRING, maxSize });
const num = { type: oracledb.NUMBER };
const date = { type: oracledb.DATE };

//Bind types for executeMany. Needed because a null in the first row can't tell Oracle the type
const INSERT_BIND_DEFS = {
  flowJobId: num,
  category: str(10),
  repository: str(255),
  workspace: str(255),
  kirkJobId: str(50),
  kirkJobLabel: str(255),
  status: str(20),
  statusRaw: str(50),
  statusMessage: str(4000),
  numLines: num,
  timeStarted: date,
  timeFinished: date,
  sourceType: str(50),
  sourceName: str(500),
  datasource: str(4000),
  destEnvKey: str(10),
  dbInstance: str(10),
  destInstance: str(100),
  destSchema: str(128),
  destTable: str(255),
  destResolvedBy: str(20),
  recordsRead: num,
  recordsWritten: num,
  dwmMatched: str(1),
};

const UPDATE_BIND_DEFS = {
  flowJobId: num,
  destInstance: str(100),
  destSchema: str(128),
  destTable: str(255),
  destResolvedBy: str(20),
  datasource: str(4000),
  recordsRead: num,
  recordsWritten: num,
  dwmMatched: str(1),
  status: str(20),
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Builds ":p0, :p1, ..." and the matching bind object for an IN list. */
function inList<T>(values: T[], prefix: string) {
  const binds: Record<string, T> = {};
  const placeholders = values.map((v, i) => {
    binds[`${prefix}${i}`] = v;
    return `:${prefix}${i}`;
  });
  return { placeholders: placeholders.join(", "), binds };
}

const yn = (b: boolean): string => (b ? "Y" : "N");

export class OracleFlowJobStore implements FlowJobStore {
  constructor(
    private readonly pool: oracledb.Pool,
    private readonly table: string,
  ) {}

  async findExistingIds(flowJobIds: number[]): Promise<Set<number>> {
    const result = new Set<number>();
    if (flowJobIds.length === 0) return result;

    const connection = await this.pool.getConnection();
    try {
      for (const ids of chunk(flowJobIds, MAX_IN_VALUES)) {
        const { placeholders, binds } = inList(ids, "id");
        const query = await connection.execute<{ FLOW_JOB_ID: number }>(
          `SELECT FLOW_JOB_ID FROM ${this.table} WHERE FLOW_JOB_ID IN (${placeholders})`,
          binds,
          { outFormat: oracledb.OUT_FORMAT_OBJECT },
        );
        for (const row of query.rows ?? []) result.add(row.FLOW_JOB_ID);
      }
      return result;
    } finally {
      await connection.close();
    }
  }

  async insertMany(records: FlowJobRecord[]): Promise<number> {
    if (records.length === 0) return 0;

    // MERGE with only "WHEN NOT MATCHED" = insert new rows, leave existing rows untouched.
    const sql = `
      MERGE INTO ${this.table} t
      USING (SELECT :flowJobId AS FLOW_JOB_ID FROM dual) s
      ON (t.FLOW_JOB_ID = s.FLOW_JOB_ID)
      WHEN NOT MATCHED THEN INSERT (${COLUMNS})
      VALUES (
        :flowJobId, :category, :repository, :workspace, :kirkJobId, :kirkJobLabel,
        :status, :statusRaw, :statusMessage, :numLines, :timeStarted, :timeFinished,
        :sourceType, :sourceName, :datasource, :destEnvKey, :dbInstance, :destInstance,
        :destSchema, :destTable, :destResolvedBy, :recordsRead, :recordsWritten, :dwmMatched
      )
    `;

    const connection = await this.pool.getConnection();
    try {
      let inserted = 0;
      for (const batch of chunk(records, WRITE_BATCH_SIZE)) {
        const result = await connection.executeMany(
          sql,
          batch.map((r) => ({ ...r, dwmMatched: yn(r.dwmMatched) })),
          { bindDefs: INSERT_BIND_DEFS, autoCommit: false },
        );
        inserted += result.rowsAffected ?? 0;
      }
      await connection.commit();
      return inserted;
    } finally {
      await connection.close();
    }
  }

  async findUnresolved(
    recentHours: number,
    unmappedRetryDays: number,
  ): Promise<FlowJobRecord[]> {
    const connection = await this.pool.getConnection();
    try {
      const query = await connection.execute<FlowJobDbRow>(
        `
        SELECT ${COLUMNS}
        FROM ${this.table}
        WHERE CATEGORY = 'BCGW'
          AND (
            (
              (DEST_RESOLVED_BY = 'unmapped' OR DEST_INSTANCE = 'UNKNOWN')
              AND COALESCE(TIME_STARTED, INSERTED_AT) >= SYSDATE - :unmappedRetryDays
            )
            OR (
              DWM_MATCHED = 'N'
              AND COALESCE(TIME_STARTED, INSERTED_AT) >= SYSDATE - :recentHours / 24
            )
          )
        `,
        { recentHours, unmappedRetryDays },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      return (query.rows ?? []).map((row) => this.toRecord(row));
    } finally {
      await connection.close();
    }
  }

  async updateResolution(updates: ResolutionUpdate[]): Promise<number> {
    if (updates.length === 0) return 0;

    const sql = `
      UPDATE ${this.table}
      SET DEST_INSTANCE    = :destInstance,
          DEST_SCHEMA      = :destSchema,
          DEST_TABLE       = :destTable,
          DEST_RESOLVED_BY = :destResolvedBy,
          DATASOURCE       = :datasource,
          RECORDS_READ     = :recordsRead,
          RECORDS_WRITTEN  = :recordsWritten,
          DWM_MATCHED      = :dwmMatched,
          STATUS           = :status,
          UPDATED_AT       = SYSDATE
      WHERE FLOW_JOB_ID = :flowJobId
    `;

    const connection = await this.pool.getConnection();
    try {
      let updated = 0;
      for (const batch of chunk(updates, WRITE_BATCH_SIZE)) {
        const result = await connection.executeMany(
          sql,
          batch.map((u) => ({ ...u, dwmMatched: yn(u.dwmMatched) })),
          { bindDefs: UPDATE_BIND_DEFS, autoCommit: false },
        );
        updated += result.rowsAffected ?? 0;
      }
      await connection.commit();
      return updated;
    } finally {
      await connection.close();
    }
  }

  async findLatestResolvedByKirkJobId(
    kirkJobIds: string[],
  ): Promise<Map<string, FlowJobRecord>> {
    const result = new Map<string, FlowJobRecord>();
    if (kirkJobIds.length === 0) return result;

    const connection = await this.pool.getConnection();
    try {
      for (const ids of chunk(kirkJobIds, MAX_IN_VALUES)) {
        const { placeholders, binds } = inList(ids, "k");
        const query = await connection.execute<FlowJobDbRow>(
          `
          SELECT ${COLUMNS}
          FROM (
            SELECT t.*,
                   ROW_NUMBER() OVER (
                     PARTITION BY KIRK_JOBID
                     ORDER BY TIME_STARTED DESC NULLS LAST
                   ) AS rn
            FROM ${this.table} t
            WHERE KIRK_JOBID IN (${placeholders})
              AND DEST_RESOLVED_BY <> 'unmapped'
          )
          WHERE rn = 1
          `,
          binds,
          { outFormat: oracledb.OUT_FORMAT_OBJECT },
        );
        for (const row of query.rows ?? []) {
          if (row.KIRK_JOBID) result.set(row.KIRK_JOBID, this.toRecord(row));
        }
      }
      return result;
    } finally {
      await connection.close();
    }
  }

  private toRecord(r: FlowJobDbRow): FlowJobRecord {
    return {
      flowJobId: r.FLOW_JOB_ID,
      category: r.CATEGORY as JobCategory,
      repository: r.REPOSITORY ?? "",
      workspace: r.WORKSPACE ?? "",
      kirkJobId: r.KIRK_JOBID,
      kirkJobLabel: r.KIRK_JOBLABEL,
      status: r.STATUS as FmeStatus,
      statusRaw: r.STATUS_RAW,
      statusMessage: r.STATUS_MESSAGE,
      numLines: r.NUM_LINES,
      timeStarted: r.TIME_STARTED,
      timeFinished: r.TIME_FINISHED,
      sourceType: r.SOURCE_TYPE,
      sourceName: r.SOURCE_NAME,
      datasource: r.DATASOURCE,
      destEnvKey: r.DEST_ENV_KEY,
      dbInstance: r.DB_INSTANCE as DbInstance | null,
      destInstance: r.DEST_INSTANCE ?? "UNKNOWN",
      destSchema: r.DEST_SCHEMA ?? "UNMAPPED",
      destTable: r.DEST_TABLE,
      destResolvedBy: r.DEST_RESOLVED_BY as ResolvedBy,
      recordsRead: r.RECORDS_READ,
      recordsWritten: r.RECORDS_WRITTEN,
      dwmMatched: r.DWM_MATCHED === "Y",
    };
  }
}
