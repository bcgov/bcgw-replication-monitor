import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const valid: Record<string, string> = {
  FLOW_TOKEN: "secret-token",
  ORACLE_USER: "u",
  ORACLE_PASSWORD: "p",
  ORACLE_CONNECT_STRING: "host:1521/svc",
  FLOW_BASE_URL: "http://flow.test/fmerest/v3",
  DWM_TABLE: "SCHEMA.FME_STATUS_LOG",
  FLOW_JOB_TABLE: "SCHEMA.FME_FLOW_JOB",
};

const errorMessage = (env: Record<string, string>): string => {
  try {
    loadConfig(env);
    return "";
  } catch (err) {
    return (err as Error).message;
  }
};

describe("loadConfig", () => {
  it("applies defaults for the sync settings", () => {
    expect(loadConfig(valid).sync).toEqual({
      pageSize: 100,
      settleMinutes: 5,
      unresolvedRecentHours: 24,
      unmappedRetryDays: 30,
    });
  });

  it("converts numeric strings", () => {
    expect(loadConfig({ ...valid, SYNC_PAGE_SIZE: "250" }).sync.pageSize).toBe(
      250,
    );
  });

  it("rejects a table name that isn't SCHEMA.TABLE", () => {
    expect(errorMessage({ ...valid, DWM_TABLE: "X; DROP TABLE Y" })).toMatch(
      /DWM_TABLE/,
    );
  });

  it("names a missing secret", () => {
    const env = { ...valid };
    delete env.FLOW_TOKEN;
    expect(errorMessage(env)).toMatch(/FLOW_TOKEN/);
  });

  it("never includes secret values in the error", () => {
    expect(errorMessage({ ...valid, SYNC_PAGE_SIZE: "-1" })).not.toContain(
      "secret-token",
    );
  });
});
