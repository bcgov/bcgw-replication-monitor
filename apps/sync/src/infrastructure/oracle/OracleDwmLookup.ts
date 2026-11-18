import oracledb from "oracledb";
import { DwmRow } from "../../domain/DwmRow";
import { DwmLookup } from "../../ports/DwmLookup";

const MAX_IN_VALUES = 1000;

interface DwmDbRow {
  FLOW_JOB_ID: number | null;
  MAPPING_FILE_ID: string;
  START_TIME: Date | null;
  DEST_INSTANCE: string | null;
  DEST_SCHEMA: string | null;
  DEST_TABLE: string | null;
  DATASOURCE: string | null;
  FEATURES_READ_COUNT: number | null;
  FEATURES_WRITTEN_COUNT: number | null;
}

export class OracleDwmLookup implements DwmLookup {
  constructor(
    private readonly pool: oracledb.Pool,
    private readonly table: string,
  ) {}

  async findByFlowJobIds(flowJobIds: number[]): Promise<Map<number, DwmRow>> {
    const result = new Map<number, DwmRow>();

    if (flowJobIds.length === 0) return result;

    const connection = await this.pool.getConnection();

    try {
      for (let start = 0; start < flowJobIds.length; start += MAX_IN_VALUES) {
        const ids = flowJobIds.slice(start, start + MAX_IN_VALUES);

        const bindNames = ids.map((_, i) => `:id${i}`);
        const binds: Record<string, number> = {};

        ids.forEach((id, i) => {
          binds[`id${i}`] = id;
        });

        const sql = `
          SELECT
            TO_NUMBER(
              REGEXP_SUBSTR(
                LOG_FILENAME,
                'job_([0-9]+)\\.log',
                1,
                1,
                NULL,
                1
              )
            ) AS FLOW_JOB_ID,
            MAPPING_FILE_ID,
            START_TIME,
            DEST_INSTANCE,
            DEST_SCHEMA,
            DEST_TABLE,
            DATASOURCE,
            FEATURES_READ_COUNT,
            FEATURES_WRITTEN_COUNT
          FROM ${this.table}
          WHERE START_TIME >= SYSDATE - 60
AND TO_NUMBER(
      REGEXP_SUBSTR(
        LOG_FILENAME,
        'job_([0-9]+)\\.log',
        1,
        1,
        NULL,
        1
      )
    ) IN (${bindNames.join(", ")})
        `;

        const query = await connection.execute<DwmDbRow>(sql, binds, {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        for (const row of query.rows ?? []) {
          if (row.FLOW_JOB_ID === null) continue;

          result.set(row.FLOW_JOB_ID, this.mapRow(row));
        }
      }

      return result;
    } finally {
      await connection.close();
    }
  }

  async findLatestByWorkspace(
    mappingFileIds: string[],
  ): Promise<Map<string, DwmRow>> {
    const result = new Map<string, DwmRow>();

    if (mappingFileIds.length === 0) return result;

    const connection = await this.pool.getConnection();

    try {
      for (
        let start = 0;
        start < mappingFileIds.length;
        start += MAX_IN_VALUES
      ) {
        const ids = mappingFileIds.slice(start, start + MAX_IN_VALUES);

        const bindNames = ids.map((_, i) => `:fmw${i}`);
        const binds: Record<string, string> = {};

        ids.forEach((id, i) => {
          binds[`fmw${i}`] = id;
        });

        const sql = `
        SELECT
          NULL AS FLOW_JOB_ID,
          MAPPING_FILE_ID,
          START_TIME,
          DEST_INSTANCE,
          DEST_SCHEMA,
          DEST_TABLE,
          DATASOURCE,
          FEATURES_READ_COUNT,
          FEATURES_WRITTEN_COUNT
        FROM (
          SELECT
            l.*,
            ROW_NUMBER() OVER (
              PARTITION BY MAPPING_FILE_ID
              ORDER BY START_TIME DESC NULLS LAST
            ) AS rn
          FROM ${this.table} l
          WHERE MAPPING_FILE_ID IN (${bindNames.join(", ")})
            AND DEST_SCHEMA IS NOT NULL
            AND DEST_TABLE IS NOT NULL
        )
        WHERE rn = 1
      `;

        const query = await connection.execute<DwmDbRow>(sql, binds, {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        for (const row of query.rows ?? []) {
          result.set(row.MAPPING_FILE_ID, this.mapRow(row));
        }
      }

      return result;
    } finally {
      await connection.close();
    }
  }

  private mapRow(row: DwmDbRow): DwmRow {
    return {
      flowJobId: row.FLOW_JOB_ID,
      mappingFileId: row.MAPPING_FILE_ID,
      startTime: row.START_TIME,
      destInstance: row.DEST_INSTANCE,
      destSchema: row.DEST_SCHEMA,
      destTable: row.DEST_TABLE,
      datasource: row.DATASOURCE,
      featuresRead: row.FEATURES_READ_COUNT,
      featuresWritten: row.FEATURES_WRITTEN_COUNT,
    };
  }
}
