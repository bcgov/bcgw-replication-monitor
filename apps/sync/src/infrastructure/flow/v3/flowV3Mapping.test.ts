import { describe, it, expect } from "vitest";
import page from "./__fixtures__/completed-page.json";
import params from "./__fixtures__/workspace-parameters.json";
import {
  completedJobsPageSchema,
  workspaceParametersSchema,
  toFlowJob,
  toWorkspaceDefaults,
  paramToString,
} from "./flowV3Mapping";

describe("Flow V3 mapping", () => {
  it("maps a successful run, reading counts and message from result", () => {
    const parsed = completedJobsPageSchema.parse(page);
    const job = toFlowJob(parsed.items[0]);

    expect(job.id).toBe(1001);
    expect(job.statusRaw).toBe("SUCCESS");
    expect(job.numFeaturesOutput).toBe(250); // only under result
    expect(job.statusMessage).toBe("Translation Successful");
    expect(job.timeFinished?.toISOString()).toBe("2026-11-10T18:00:30.000Z");
    expect(job.requestParams.DEST_SCHEMA).toBe("WHSE_EXAMPLE");
    expect(job.requestParams.SRC_PORT).toBe("1521"); // number → string
    expect(job.requestParams.DEST_HOST).toBe(""); // empty values are kept as-is
  });

  it("maps a failed KIRK run with no log and no feature count", () => {
    const parsed = completedJobsPageSchema.parse(page);
    const job = toFlowJob(parsed.items[1]);

    expect(job.statusRaw).toBe("FME_FAILURE");
    expect(job.numLines).toBe(0);
    expect(job.numFeaturesOutput).toBeNull();
    expect(job.requestParams.KIRK_JOBID).toBe("42");
  });

  it("reads FMW defaults: plain, choice list, and missing", () => {
    const defaults = toWorkspaceDefaults(
      workspaceParametersSchema.parse(params),
    );
    expect(defaults.DEST_DB_ENV_KEY).toBe("DLV");
    expect(defaults.DEST_TYPE).toBe("OTHER"); // first item of the list
    expect(defaults).not.toHaveProperty("DEST_SCHEMA"); // no default → left out
  });

  it("converts parameter values to strings", () => {
    expect(paramToString(["OTHER"])).toBe("OTHER");
    expect(paramToString(1521)).toBe("1521");
    expect(paramToString(null)).toBeUndefined();
  });
});
