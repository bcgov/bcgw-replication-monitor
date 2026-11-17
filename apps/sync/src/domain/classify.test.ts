import { describe, it, expect } from "vitest";
import { FlowJob } from "./FlowJob";
import { classify } from "./classify";
import { effectiveParams, needsDefaults, mappingFileId } from "./params";

const job = (over: Partial<FlowJob> = {}): FlowJob => ({
  id: 1,
  repository: "WHSE_X",
  workspace: "a_bcgw.fmw",
  statusRaw: "SUCCESS",
  statusMessage: null,
  numLines: 10,
  numFeaturesOutput: 5,
  timeStarted: null,
  timeFinished: null,
  sourceType: null,
  sourceName: null,
  requestParams: {},
  ...over,
});

const run = (
  env: string | undefined,
  hasDwm = false,
  over: Partial<FlowJob> = {},
) =>
  classify(
    job(over),
    env === undefined ? {} : { DEST_DB_ENV_KEY: env },
    hasDwm,
  );

describe("classify", () => {
  it("skips the utility repository", () => {
    expect(run("PRD", true, { repository: "DATABC_UTILITY" })).toEqual({
      kind: "skip",
      reason: "utility_repo",
    });
  });

  it("keeps PRD as BCGW (any case)", () => {
    expect(run("prd")).toMatchObject({
      kind: "keep",
      category: "BCGW",
      envKey: "PRD",
    });
  });

  it("skips DLV and TST", () => {
    expect(run("DLV")).toEqual({ kind: "skip", reason: "dev_or_test" });
    expect(run("TST")).toEqual({ kind: "skip", reason: "dev_or_test" });
  });

  it("keeps OTHR and OTHER as NON_BCGW", () => {
    expect(run("OTHR")).toMatchObject({ kind: "keep", category: "NON_BCGW" });
    expect(run("OTHER")).toMatchObject({ kind: "keep", category: "NON_BCGW" });
  });

  it("keeps a run with no env key only if the FMW has DWM rows", () => {
    expect(run(undefined, true)).toMatchObject({
      kind: "keep",
      category: "BCGW",
      envKey: null,
    });
    expect(run(undefined, false)).toEqual({
      kind: "skip",
      reason: "no_env_key",
    });
  });

  it("keeps an unexpected env key as BCGW, flagged", () => {
    expect(run("XYZ")).toMatchObject({
      kind: "keep",
      category: "BCGW",
      unknownEnvKey: true,
    });
  });

  it("reads KIRK runs' env key from KIRK_DEST_DB_KEY_OVERRIDE", () => {
    const kirk = { requestParams: { KIRK_JOBID: "42" } };
    expect(
      classify(job(kirk), { KIRK_DEST_DB_KEY_OVERRIDE: "PRD" }, true),
    ).toMatchObject({
      kind: "keep",
      category: "BCGW",
      kirk: true,
      envKey: "PRD",
    });
    expect(
      classify(job(kirk), { KIRK_DEST_DB_KEY_OVERRIDE: "DLV" }, true),
    ).toEqual({
      kind: "skip",
      reason: "dev_or_test",
    });
    // a KIRK run with only DEST_DB_ENV_KEY is treated as having no env key
    expect(classify(job(kirk), { DEST_DB_ENV_KEY: "PRD" }, false)).toEqual({
      kind: "skip",
      reason: "no_env_key",
    });
  });
});

describe("params", () => {
  it("lets the run's value win, but ignores empty values", () => {
    const merged = effectiveParams(
      { DEST_DB_ENV_KEY: "PRD", DEST_SCHEMA: "" },
      { DEST_DB_ENV_KEY: "DLV", DEST_SCHEMA: "WHSE_DEFAULT" },
    );
    expect(merged).toEqual({
      DEST_DB_ENV_KEY: "PRD",
      DEST_SCHEMA: "WHSE_DEFAULT",
    });
  });

  it("asks for defaults only for non-KIRK runs missing a value", () => {
    const full = {
      DEST_DB_ENV_KEY: "PRD",
      DEST_SCHEMA: "S",
      DEST_FEATURE_1: "T",
    };
    expect(needsDefaults(job({ requestParams: full }))).toBe(false);
    expect(
      needsDefaults(job({ requestParams: { ...full, DEST_SCHEMA: "" } })),
    ).toBe(true);
    expect(needsDefaults(job({ requestParams: { KIRK_JOBID: "42" } }))).toBe(
      false,
    );
  });

  it("strips .fmw for MAPPING_FILE_ID", () => {
    expect(mappingFileId("a_bcgw.FMW")).toBe("a_bcgw");
  });
});
