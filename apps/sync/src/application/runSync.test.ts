import { describe, expect, it } from "vitest";
import { DwmRow } from "../domain/DwmRow";
import { FlowJob } from "../domain/FlowJob";
import { FlowJobRecord } from "../domain/FlowJobRecord";
import { FakeDwmLookup } from "../fakes/FakeDwmLookup";
import { FakeFlowJobSource } from "../fakes/FakeFlowJobSource";
import { FakeFlowJobStore } from "../fakes/FakeFlowJobStore";
import { runSync, SyncConfig } from "./runSync";

const NOW = new Date("2026-11-20T12:00:00-08:00");

const config: SyncConfig = {
  pageSize: 2,
  settleMinutes: 5,
  unresolvedRecentHours: 24,
};

const job = (id: number, over: Partial<FlowJob> = {}): FlowJob => ({
  id,
  repository: "WHSE_TEST",
  workspace: "example_bcgw.fmw",
  statusRaw: "SUCCESS",
  statusMessage: "Translation Successful",
  numLines: 10,
  numFeaturesOutput: 5,
  timeStarted: new Date("2026-11-20T10:00:00-08:00"),
  timeFinished: new Date("2026-11-20T10:01:00-08:00"),
  sourceType: "SCHEDULES",
  sourceName: "example_schedule",
  requestParams: {
    DEST_DB_ENV_KEY: "PRD",
    DEST_SCHEMA: "WHSE_TEST",
    DEST_FEATURE_1: "EXAMPLE_TABLE",
  },
  ...over,
});

const dwm = (flowJobId: number, over: Partial<DwmRow> = {}): DwmRow => ({
  flowJobId,
  mappingFileId: "example_bcgw",
  startTime: new Date("2026-11-20T10:01:00-08:00"),
  destInstance: "prod-host",
  destSchema: "WHSE_TEST",
  destTable: "EXAMPLE_TABLE",
  datasource: "example_source",
  featuresRead: 5,
  featuresWritten: 5,
  ...over,
});

const record = (
  flowJobId: number,
  over: Partial<FlowJobRecord> = {},
): FlowJobRecord => ({
  flowJobId,
  category: "BCGW",
  repository: "WHSE_TEST",
  workspace: "example_bcgw.fmw",
  kirkJobId: null,
  kirkJobLabel: null,
  status: "SUCCESS",
  statusRaw: "SUCCESS",
  statusMessage: "Translation Successful",
  numLines: 10,
  timeStarted: new Date("2026-11-20T10:00:00-08:00"),
  timeFinished: new Date("2026-11-20T10:01:00-08:00"),
  sourceType: "SCHEDULES",
  sourceName: "example_schedule",
  datasource: "example_source",
  destEnvKey: "PRD",
  dbInstance: "PROD",
  destInstance: "prod-host",
  destSchema: "WHSE_TEST",
  destTable: "EXAMPLE_TABLE",
  destResolvedBy: "dwm_exact",
  recordsRead: 5,
  recordsWritten: 5,
  dwmMatched: true,
  ...over,
});

const deps = (
  jobs: FlowJob[],
  dwmRows: DwmRow[] = [],
  existing: FlowJobRecord[] = [],
) => {
  const flow = new FakeFlowJobSource(jobs);
  const dwmLookup = new FakeDwmLookup(dwmRows);
  const store = new FakeFlowJobStore(existing, () => NOW);

  return {
    flow,
    dwm: dwmLookup,
    store,
    now: () => NOW,
  };
};

describe("runSync", () => {
  it("performs an initial backfill and inserts new jobs", async () => {
    const d = deps([job(3), job(2), job(1)], [dwm(3), dwm(2), dwm(1)]);

    const summary = await runSync(d, config);

    expect(summary.fetched).toBe(3);
    expect(summary.alreadyStored).toBe(0);
    expect(summary.inserted).toBe(3);
    expect(summary.skipped).toBe(0);

    expect([...d.store.rows.keys()].sort()).toEqual([1, 2, 3]);

    expect(d.store.rows.get(3)).toMatchObject({
      destSchema: "WHSE_TEST",
      destTable: "EXAMPLE_TABLE",
      destResolvedBy: "dwm_exact",
      dbInstance: "PROD",
      destInstance: "prod-host",
      recordsRead: 5,
      recordsWritten: 5,
      dwmMatched: true,
    });
  });

  it("stops when it reaches a fully settled page that is already stored", async () => {
    const jobs = [
      job(4, {
        timeFinished: new Date("2026-11-20T11:00:00-08:00"),
      }),
      job(3, {
        timeFinished: new Date("2026-11-20T10:50:00-08:00"),
      }),
      job(2, {
        timeFinished: new Date("2026-11-20T10:40:00-08:00"),
      }),
      job(1, {
        timeFinished: new Date("2026-11-20T10:30:00-08:00"),
      }),
    ];

    const d = deps(jobs, [], [record(4), record(3), record(2), record(1)]);

    const summary = await runSync(d, config);

    // pageSize=2, so only the first page should be fetched before stopping.
    expect(summary.fetched).toBe(2);
    expect(summary.alreadyStored).toBe(2);
    expect(summary.inserted).toBe(0);
  });

  it("waits for very recent jobs but continues paging to older jobs", async () => {
    const recent = job(3, {
      timeStarted: new Date("2026-11-20T11:58:00-08:00"),
      timeFinished: new Date("2026-11-20T11:59:00-08:00"),
    });

    const old2 = job(2, {
      timeStarted: new Date("2026-11-20T11:00:00-08:00"),
      timeFinished: new Date("2026-11-20T11:01:00-08:00"),
    });

    const old1 = job(1, {
      timeStarted: new Date("2026-11-20T10:00:00-08:00"),
      timeFinished: new Date("2026-11-20T10:01:00-08:00"),
    });

    const d = deps([recent, old2, old1], [dwm(2), dwm(1)]);

    const summary = await runSync(d, config);

    expect(summary.fetched).toBe(3);
    expect(summary.inserted).toBe(2);

    expect(d.store.rows.has(3)).toBe(false);
    expect(d.store.rows.has(2)).toBe(true);
    expect(d.store.rows.has(1)).toBe(true);
  });

  it("uses timeStarted for settling when timeFinished is missing", async () => {
    const d = deps(
      [
        job(1, {
          timeStarted: new Date("2026-11-20T10:00:00-08:00"),
          timeFinished: null,
        }),
      ],
      [dwm(1)],
    );

    const summary = await runSync(d, config);

    expect(summary.inserted).toBe(1);
    expect(d.store.rows.has(1)).toBe(true);
  });

  it("still processes a completed job when both timestamps are missing", async () => {
    const d = deps([
      job(1, {
        timeStarted: null,
        timeFinished: null,
      }),
    ]);

    const summary = await runSync(d, config);

    expect(summary.inserted).toBe(1);

    expect(d.store.rows.get(1)).toMatchObject({
      timeStarted: null,
      timeFinished: null,
    });
  });

  it("skips DLV and TST jobs", async () => {
    const d = deps([
      job(1, {
        requestParams: {
          DEST_DB_ENV_KEY: "DLV",
          DEST_SCHEMA: "WHSE_TEST",
          DEST_FEATURE_1: "A",
        },
      }),
      job(2, {
        requestParams: {
          DEST_DB_ENV_KEY: "TST",
          DEST_SCHEMA: "WHSE_TEST",
          DEST_FEATURE_1: "B",
        },
      }),
    ]);

    const summary = await runSync(d, config);

    expect(summary.inserted).toBe(0);
    expect(summary.skipped).toBe(2);
    expect(d.store.rows.size).toBe(0);
  });

  it("resolves a failed non-KIRK run from the FMW's DWM history", async () => {
    const failed = job(10, {
      statusRaw: "FME_FAILURE",
      numFeaturesOutput: 0,
      workspace: "history_job.fmw",
      requestParams: {
        DEST_DB_ENV_KEY: "PRD",
      },
    });

    const history = dwm(9, {
      flowJobId: 9,
      mappingFileId: "history_job",
      destInstance: "history-host",
      destSchema: "WHSE_HISTORY",
      destTable: "HISTORY_TABLE",
    });

    const d = deps([failed], [history]);

    const summary = await runSync(d, config);

    expect(summary.inserted).toBe(1);

    expect(d.store.rows.get(10)).toMatchObject({
      status: "ERROR",
      destSchema: "WHSE_HISTORY",
      destTable: "HISTORY_TABLE",
      destResolvedBy: "dwm_history",
      destInstance: "history-host",
    });
  });

  it("uses the closest older KIRK run with usable DWM history during the initial backfill", async () => {
    const older = job(100, {
      repository: "KIRK",
      workspace: "APP_KIRK__FGDB.fmw",
      timeStarted: new Date("2026-11-18T10:00:00-08:00"),
      timeFinished: new Date("2026-11-18T10:01:00-08:00"),
      requestParams: {
        KIRK_JOBID: "42",
        KIRK_JOBLABEL: "example",
        KIRK_DEST_DB_KEY_OVERRIDE: "PRD",
      },
    });

    const middle = job(200, {
      repository: "KIRK",
      workspace: "APP_KIRK__FGDB.fmw",
      timeStarted: new Date("2026-11-19T10:00:00-08:00"),
      timeFinished: new Date("2026-11-19T10:01:00-08:00"),
      requestParams: {
        KIRK_JOBID: "42",
        KIRK_JOBLABEL: "example",
        KIRK_DEST_DB_KEY_OVERRIDE: "PRD",
      },
    });

    const newestFailed = job(300, {
      repository: "KIRK",
      workspace: "APP_KIRK__FGDB.fmw",
      statusRaw: "FME_FAILURE",
      numFeaturesOutput: 0,
      timeStarted: new Date("2026-11-20T10:00:00-08:00"),
      timeFinished: new Date("2026-11-20T10:01:00-08:00"),
      requestParams: {
        KIRK_JOBID: "42",
        KIRK_JOBLABEL: "example",
        KIRK_DEST_DB_KEY_OVERRIDE: "PRD",
      },
    });

    const d = deps(
      // Flow source sorts these newest first.
      [newestFailed, middle, older],
      [
        dwm(100, {
          mappingFileId: "APP_KIRK__FGDB",
          startTime: new Date("2026-11-18T10:01:00-08:00"),
          destSchema: "WHSE_OLD",
          destTable: "OLD_TABLE",
          destInstance: "old-host",
        }),
        dwm(200, {
          mappingFileId: "APP_KIRK__FGDB",
          startTime: new Date("2026-11-19T10:01:00-08:00"),
          destSchema: "WHSE_NEWER",
          destTable: "NEWER_TABLE",
          destInstance: "newer-host",
        }),
      ],
    );

    const summary = await runSync(d, config);

    expect(summary.inserted).toBe(3);

    expect(d.store.rows.get(300)).toMatchObject({
      destSchema: "WHSE_NEWER",
      destTable: "NEWER_TABLE",
      destResolvedBy: "dwm_history",
      destInstance: "newer-host",
    });
  });

  it("re-resolves a stored unmatched row when its exact DWM row appears", async () => {
    const stored = record(50, {
      status: "UNCHANGED",
      recordsRead: null,
      recordsWritten: 0,
      dwmMatched: false,
      destInstance: "UNKNOWN",
      destSchema: "WHSE_TEST",
      destTable: "EXAMPLE_TABLE",
      destResolvedBy: "flow_params",
      timeStarted: new Date("2026-11-20T10:00:00-08:00"),
    });

    const exact = dwm(50, {
      destInstance: "late-host",
      destSchema: "WHSE_TEST",
      destTable: "EXAMPLE_TABLE",
      featuresRead: 12,
      featuresWritten: 8,
    });

    const d = deps([], [exact], [stored]);

    const summary = await runSync(d, config);

    expect(summary.inserted).toBe(0);
    expect(summary.reResolved).toBe(1);

    expect(d.store.rows.get(50)).toMatchObject({
      status: "SUCCESS",
      destInstance: "late-host",
      destSchema: "WHSE_TEST",
      destTable: "EXAMPLE_TABLE",
      destResolvedBy: "dwm_exact",
      recordsRead: 12,
      recordsWritten: 8,
      dwmMatched: true,
    });
  });

  it("returns accurate summary counters", async () => {
    const alreadyStored = record(1);

    const newBcgw = job(2);

    const newDlv = job(3, {
      requestParams: {
        DEST_DB_ENV_KEY: "DLV",
        DEST_SCHEMA: "WHSE_TEST",
        DEST_FEATURE_1: "DLV_TABLE",
      },
    });

    const d = deps([newDlv, newBcgw, job(1)], [dwm(2)], [alreadyStored]);

    const summary = await runSync(d, {
      ...config,
      pageSize: 3,
    });

    expect(summary).toEqual({
      fetched: 3,
      alreadyStored: 1,
      inserted: 1,
      skipped: 1,
      reResolved: 0,
    });
  });
});
