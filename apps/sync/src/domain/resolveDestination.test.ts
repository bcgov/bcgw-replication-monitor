import { describe, it, expect } from "vitest";
import { DwmRow } from "./DwmRow";
import { FlowJobRecord } from "./FlowJobRecord";
import { resolveDestination } from "./resolveDestination";

const dwm = (over: Partial<DwmRow> = {}): DwmRow => ({
  flowJobId: 1,
  mappingFileId: "a",
  startTime: null,
  destInstance: "host",
  destSchema: "S",
  destTable: "T",
  datasource: "src",
  featuresRead: 1,
  featuresWritten: 1,
  ...over,
});

const record = (over: Partial<FlowJobRecord> = {}): FlowJobRecord => ({
  flowJobId: 9,
  category: "BCGW",
  repository: "KIRK",
  workspace: "APP_KIRK__FGDB.fmw",
  kirkJobId: "42",
  kirkJobLabel: null,
  status: "SUCCESS",
  statusRaw: "SUCCESS",
  statusMessage: null,
  numLines: 1,
  timeStarted: null,
  timeFinished: null,
  sourceType: null,
  sourceName: null,
  datasource: "kirk-src",
  destEnvKey: "PRD",
  dbInstance: "PROD",
  destInstance: "kirk-host",
  destSchema: "KS",
  destTable: "KT",
  destResolvedBy: "dwm_exact",
  recordsRead: 1,
  recordsWritten: 1,
  dwmMatched: true,
  ...over,
});

const flowParams = { DEST_SCHEMA: "FS", DEST_FEATURE_1: "FT" };

describe("resolveDestination: non-KIRK", () => {
  it("uses the run's own DWM row first", () => {
    const r = resolveDestination({
      kirk: false,
      params: flowParams,
      ownDwm: dwm(),
      workspaceHistory: dwm({ destTable: "OLD" }),
    });
    expect(r).toMatchObject({
      destSchema: "S",
      destTable: "T",
      destResolvedBy: "dwm_exact",
      datasource: "src",
    });
  });

  it("then the FMW's latest DWM row", () => {
    const r = resolveDestination({
      kirk: false,
      params: flowParams,
      workspaceHistory: dwm({ destTable: "HIST" }),
    });
    expect(r).toMatchObject({
      destTable: "HIST",
      destResolvedBy: "dwm_history",
      historyInstance: "host",
    });
  });

  it("skips history with no table, then uses Flow params", () => {
    const r = resolveDestination({
      kirk: false,
      params: flowParams,
      workspaceHistory: dwm({ destTable: null }),
    });
    expect(r).toMatchObject({
      destSchema: "FS",
      destTable: "FT",
      destResolvedBy: "flow_params",
    });
  });

  it("is UNMAPPED when nothing has both schema and table", () => {
    const r = resolveDestination({
      kirk: false,
      params: { DEST_SCHEMA: "WHSE_BASEMAPPING" },
      workspaceHistory: dwm({ destTable: null }),
    });
    expect(r).toMatchObject({
      destSchema: "UNMAPPED",
      destTable: null,
      destResolvedBy: "unmapped",
    });
  });
});

describe("resolveDestination: KIRK", () => {
  it("never uses the FMW's DWM history", () => {
    const r = resolveDestination({
      kirk: true,
      params: {},
      workspaceHistory: dwm({ destTable: "WRONG" }),
    });
    expect(r.destResolvedBy).toBe("unmapped");
  });

  it("uses our table's latest resolved row", () => {
    const r = resolveDestination({
      kirk: true,
      params: {},
      kirkHistory: record(),
    });
    expect(r).toMatchObject({
      destSchema: "KS",
      destTable: "KT",
      destResolvedBy: "dwm_history",
      historyInstance: "kirk-host",
    });
  });

  it("falls back to a same-run DWM row if our table has nothing resolved", () => {
    const r = resolveDestination({
      kirk: true,
      params: {},
      kirkHistory: record({ destResolvedBy: "unmapped" }),
      kirkBatchDwm: dwm({ destTable: "BATCH" }),
    });
    expect(r).toMatchObject({
      destTable: "BATCH",
      destResolvedBy: "dwm_history",
    });
  });

  it("does not pass UNKNOWN on as the history instance", () => {
    const r = resolveDestination({
      kirk: true,
      params: {},
      kirkHistory: record({ destInstance: "UNKNOWN" }),
    });
    expect(r.historyInstance).toBeNull();
  });
});
