import { FlowJob } from "../domain/FlowJob";
import { FlowJobPage, FlowJobSource } from "../ports/FlowJobSource";

/** In-memory FME Flow. Jobs are returned newest first by finish time, like the real API. */
export class FakeFlowJobSource implements FlowJobSource {
  /** How many times defaults were requested per "repo/workspace" (for cache tests). */
  readonly defaultsCalls = new Map<string, number>();

  constructor(
    private readonly jobs: FlowJob[] = [],
    private readonly defaults: Record<string, Record<string, string>> = {},
  ) {}

  async getCompletedJobs(offset: number, limit: number): Promise<FlowJobPage> {
    const sorted = [...this.jobs].sort(
      (a, b) =>
        (b.timeFinished?.getTime() ?? 0) - (a.timeFinished?.getTime() ?? 0),
    );
    return {
      items: sorted.slice(offset, offset + limit),
      totalCount: sorted.length,
    };
  }

  async getWorkspaceDefaults(
    repository: string,
    workspace: string,
  ): Promise<Record<string, string>> {
    const key = `${repository}/${workspace}`;
    this.defaultsCalls.set(key, (this.defaultsCalls.get(key) ?? 0) + 1);
    return { ...(this.defaults[key] ?? {}) };
  }
}
