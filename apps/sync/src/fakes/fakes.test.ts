import { describe, it, expect } from "vitest";
import { FlowJob } from "../domain/FlowJob";
import { FlowJobRecord, UNKNOWN } from "../domain/FlowJobRecord";
import { FakeFlowJobSource } from "./FakeFlowJobSource";
import { FakeDwmLookup } from "./FakeDwmLookup";
import { FakeFlowJobStore } from "./FakeFlowJobStore";

const job = (id: number, finished: string): FlowJob => ({
  id,
  repository: "REPO",
  workspace: "a.fmw",
  statusRaw: "SUCCESS",
  statusMessage: null,
  numLines: 10,
  numFeaturesOutput: 5,
  timeStarted: new Date(finished),
  timeFinished: new Date(finished),
  sourceType: null,
  sourceName: null,
  requestParams: {},
});

const record = (over: Partial<FlowJobRecord>): FlowJobRecord => ({
  flowJobId: 1,
  category: "BCGW",
  repository: "REPO",
  workspace: "a.fmw",
  kirkJobId: null,
  kirkJobLabel: null,
  status: "SUCCESS",
  statusRaw: "SUCCESS",
  statusMessage: null,
  numLines: 10,
  timeStarted: new Date("2026-11-01T10:00:00"),
  timeFinished: new Date("2026-11-01T10:05:00"),
  sourceType: null,
  sourceName: null,
  datasource: null,
  destEnvKey: "PRD",
  destInstance: "prod-host",
  destSchema: "WHSE_X",
  destTable: "T1",
  destResolvedBy: "dwm_exact",
  recordsRead: 5,
  recordsWritten: 5,
  dwmMatched: true,
  ...over,
});

describe("FakeFlowJobSource", () => {
  it("returns jobs newest first, paged", async () => {
    const src = new FakeFlowJobSource([
      job(1, "2026-11-01T10:00:00"),
      job(3, "2026-11-01T12:00:00"),
      job(2, "2026-11-01T11:00:00"),
    ]);
    const page = await src.getCompletedJobs(0, 2);
    expect(page.items.map((j) => j.id)).toEqual([3, 2]);
    expect(page.totalCount).toBe(3);
  });
});

describe("FakeDwmLookup", () => {
  it("returns the latest row per workspace", async () => {
    const base = {
      mappingFileId: "a",
      destInstance: null,
      destSchema: "S",
      datasource: null,
      featuresRead: null,
      featuresWritten: null,
    };
    const dwm = new FakeDwmLookup([
      {
        ...base,
        flowJobId: 1,
        startTime: new Date("2026-11-01"),
        destTable: "OLD",
      },
      {
        ...base,
        flowJobId: 2,
        startTime: new Date("2026-11-02"),
        destTable: "NEW",
      },
    ]);
    const latest = await dwm.findLatestByWorkspace(["a", "missing"]);
    expect(latest.get("a")?.destTable).toBe("NEW");
    expect(latest.has("missing")).toBe(false);
  });
});

describe("FakeFlowJobStore", () => {
  it("does not overwrite existing rows on insert", async () => {
    const store = new FakeFlowJobStore([
      record({ flowJobId: 1, destTable: "ORIGINAL" }),
    ]);
    const inserted = await store.insertMany([
      record({ flowJobId: 1, destTable: "CHANGED" }),
      record({ flowJobId: 2 }),
    ]);
    expect(inserted).toBe(1);
    expect(store.rows.get(1)?.destTable).toBe("ORIGINAL");
  });

  it("finds unmapped, unknown-instance and recent unmatched rows", async () => {
    const now = () => new Date("2026-11-02T12:00:00");
    const store = new FakeFlowJobStore(
      [
        record({ flowJobId: 1 }), // fully resolved
        record({ flowJobId: 2, destResolvedBy: "unmapped" }),
        record({ flowJobId: 3, destInstance: UNKNOWN }),
        record({
          flowJobId: 4,
          dwmMatched: false,
          timeStarted: new Date("2026-11-02T08:00:00"),
        }), // recent
        record({
          flowJobId: 5,
          dwmMatched: false,
          timeStarted: new Date("2026-10-01T08:00:00"),
        }), // old
      ],
      now,
    );
    const ids = (await store.findUnresolved(24)).map((r) => r.flowJobId).sort();
    expect(ids).toEqual([2, 3, 4]);
  });
});
