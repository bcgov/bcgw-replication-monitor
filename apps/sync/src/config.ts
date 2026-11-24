import { z } from "zod";
import { SyncConfig } from "./application/runSync";

/** SCHEMA.TABLE only. Table names go into SQL directly (they can't be bind variables). */
const tableName = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_$#]*\.[A-Z][A-Z0-9_$#]*$/i, "must be SCHEMA.TABLE");

const secret = z.string().trim().min(1);

const envSchema = z.object({
  FLOW_TOKEN: secret,
  ORACLE_USER: secret,
  ORACLE_PASSWORD: secret,
  ORACLE_CONNECT_STRING: secret,

  FLOW_BASE_URL: z.string().trim().url(),
  FLOW_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(4),
  DWM_TABLE: tableName,
  FLOW_JOB_TABLE: tableName,
  SYNC_PAGE_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
  SYNC_SETTLE_MINUTES: z.coerce.number().int().min(0).default(5),
  SYNC_UNRESOLVED_RECENT_HOURS: z.coerce.number().int().min(1).default(24),
  SYNC_UNMAPPED_RETRY_DAYS: z.coerce.number().int().min(1).default(30),
});

export interface AppConfig {
  flow: { baseUrl: string; token: string; maxAttempts: number };
  oracle: { user: string; password: string; connectString: string };
  tables: { dwm: string; flowJob: string };
  sync: SyncConfig;
}

/** Reads and validates the environment. The error lists variable names only, never values. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid configuration:\n${z.prettifyError(result.error)}`);
  }
  const e = result.data;

  return {
    flow: {
      baseUrl: e.FLOW_BASE_URL,
      token: e.FLOW_TOKEN,
      maxAttempts: e.FLOW_MAX_ATTEMPTS,
    },
    oracle: {
      user: e.ORACLE_USER,
      password: e.ORACLE_PASSWORD,
      connectString: e.ORACLE_CONNECT_STRING,
    },
    tables: { dwm: e.DWM_TABLE, flowJob: e.FLOW_JOB_TABLE },
    sync: {
      pageSize: e.SYNC_PAGE_SIZE,
      settleMinutes: e.SYNC_SETTLE_MINUTES,
      unresolvedRecentHours: e.SYNC_UNRESOLVED_RECENT_HOURS,
      unmappedRetryDays: e.SYNC_UNMAPPED_RETRY_DAYS,
    },
  };
}
