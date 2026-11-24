import "dotenv/config";
import { runSync } from "./application/runSync";
import { loadConfig } from "./config";
import { CachedDefaultsFlowJobSource } from "./infrastructure/flow/CachedDefaultsFlowJobSource";
import { createPool } from "./infrastructure/oracle/db";
import { OracleDwmLookup } from "./infrastructure/oracle/OracleDwmLookup";
import { OracleFlowJobStore } from "./infrastructure/oracle/OracleFlowJobStore";
import { FlowV3JobSource } from "./infrastructure/flow/v3/FlowV3JobSource";
import { describeError, log } from "./logger";

async function main(): Promise<void> {
  const startedAt = Date.now();
  const config = loadConfig();
  const pool = await createPool(config.oracle);

  try {
    const flow = new CachedDefaultsFlowJobSource(
      new FlowV3JobSource({
        baseUrl: config.flow.baseUrl,
        token: config.flow.token,
      }),
      (repository, workspace, err) =>
        log("warn", "Could not read FMW defaults", {
          repository,
          workspace,
          ...describeError(err),
        }),
    );

    const summary = await runSync(
      {
        flow,
        dwm: new OracleDwmLookup(pool, config.tables.dwm),
        store: new OracleFlowJobStore(pool, config.tables.flowJob),
      },
      config.sync,
    );

    log("info", "Sync completed", {
      ...summary,
      durationMs: Date.now() - startedAt,
    });
  } finally {
    await pool.close(10);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log("error", "Sync failed", describeError(err));
    process.exit(1);
  });
