import { describe, it, expect } from "vitest";
import { FlowJobPage, FlowJobSource } from "../../ports/FlowJobSource";
import { FakeFlowJobSource } from "../../fakes/FakeFlowJobSource";
import { CachedDefaultsFlowJobSource } from "./CachedDefaultsFlowJobSource";

/** A source whose defaults call always fails, counting the attempts. */
class FailingDefaultsSource implements FlowJobSource {
  calls = 0;
  async getCompletedJobs(): Promise<FlowJobPage> {
    return { items: [], totalCount: 0 };
  }
  async getWorkspaceDefaults(): Promise<Record<string, string>> {
    this.calls++;
    throw new Error("HTTP 404");
  }
}

describe("CachedDefaultsFlowJobSource", () => {
  it("fetches each FMW's defaults only once", async () => {
    const inner = new FakeFlowJobSource([], {
      "REPO/a.fmw": { DEST_DB_ENV_KEY: "PRD" },
    });
    const cached = new CachedDefaultsFlowJobSource(inner);

    await cached.getWorkspaceDefaults("REPO", "a.fmw");
    await cached.getWorkspaceDefaults("REPO", "a.fmw");
    const result = await cached.getWorkspaceDefaults("REPO", "a.fmw");
    await cached.getWorkspaceDefaults("REPO", "b.fmw");

    expect(result.DEST_DB_ENV_KEY).toBe("PRD");
    expect(inner.defaultsCalls.get("REPO/a.fmw")).toBe(1);
    expect(inner.defaultsCalls.get("REPO/b.fmw")).toBe(1);
  });

  it("returns {} and warns once when fetching fails", async () => {
    const inner = new FailingDefaultsSource();
    const warnings: string[] = [];
    const cached = new CachedDefaultsFlowJobSource(inner, (repo, fmw) =>
      warnings.push(`${repo}/${fmw}`),
    );

    expect(await cached.getWorkspaceDefaults("REPO", "gone.fmw")).toEqual({});
    expect(await cached.getWorkspaceDefaults("REPO", "gone.fmw")).toEqual({});

    expect(inner.calls).toBe(1);
    expect(warnings).toEqual(["REPO/gone.fmw"]);
  });
});
