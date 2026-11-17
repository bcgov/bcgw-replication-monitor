import { describe, it, expect } from "vitest";
import { DwmRow } from "./DwmRow";
import { FlowJob } from "./FlowJob";
import {
  recordsRead,
  recordsWritten,
  resolveInstance,
  toStatus,
} from "./normalize";

const job = (numFeaturesOutput: number | null): FlowJob => ({
  id: 1,
  repository: "R",
  workspace: "a.fmw",
  statusRaw: "SUCCESS",
  statusMessage: null,
  numLines: 10,
  numFeaturesOutput,
  timeStarted: null,
  timeFinished: null,
  sourceType: null,
  sourceName: null,
  requestParams: {},
});

const dwm = (over: Partial<DwmRow> = {}): DwmRow => ({
  flowJobId: 1,
  mappingFileId: "a",
  startTime: null,
  destInstance: "dwm-host",
  destSchema: "S",
  destTable: "T",
  datasource: null,
  featuresRead: 7,
  featuresWritten: 5,
  ...over,
});

const config = { envKeyToHost: { PRD: "prod-host" } };

describe("records", () => {
  it("prefers DWM, falls back to Flow for written", () => {
    expect(recordsWritten(job(9), dwm())).toBe(5);
    expect(recordsWritten(job(9), undefined)).toBe(9);
    expect(recordsWritten(job(null), undefined)).toBeNull();
  });

  it("reads only from DWM", () => {
    expect(recordsRead(dwm())).toBe(7);
    expect(recordsRead(undefined)).toBeNull();
  });
});

describe("toStatus", () => {
  it("maps like the view", () => {
    expect(toStatus("SUCCESS", 5)).toBe("SUCCESS");
    expect(toStatus("SUCCESS", 0)).toBe("UNCHANGED");
    expect(toStatus("FME_FAILURE", 5)).toBe("ERROR");
  });

  it("treats a success with no count as UNCHANGED", () => {
    expect(toStatus("SUCCESS", null)).toBe("UNCHANGED");
  });
});

describe("resolveInstance", () => {
  it("uses the run's own DWM row first", () => {
    expect(resolveInstance(dwm(), "PRD", "old", config)).toBe("dwm-host");
  });

  it("then the env key", () => {
    expect(resolveInstance(undefined, "PRD", "old", config)).toBe("prod-host");
  });

  it("then the job's history", () => {
    expect(resolveInstance(undefined, null, "old", config)).toBe("old");
  });

  it("otherwise UNKNOWN", () => {
    expect(resolveInstance(undefined, "XYZ", null, config)).toBe("UNKNOWN");
  });
});
