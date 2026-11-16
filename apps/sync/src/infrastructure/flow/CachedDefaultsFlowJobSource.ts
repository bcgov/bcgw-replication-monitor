import { FlowJobPage, FlowJobSource } from "../../ports/FlowJobSource";

export type DefaultsWarning = (
  repository: string,
  workspace: string,
  error: unknown,
) => void;

/**
 * Wraps a FlowJobSource so each FMW's defaults are fetched at most once per instance
 * (one instance per sync run). If fetching fails, returns {} and reports a warning.
 */
export class CachedDefaultsFlowJobSource implements FlowJobSource {
  private readonly cache = new Map<string, Promise<Record<string, string>>>();

  constructor(
    private readonly inner: FlowJobSource,
    private readonly onWarning: DefaultsWarning = () => {},
  ) {}

  getCompletedJobs(offset: number, limit: number): Promise<FlowJobPage> {
    return this.inner.getCompletedJobs(offset, limit);
  }

  getWorkspaceDefaults(
    repository: string,
    workspace: string,
  ): Promise<Record<string, string>> {
    const key = `${repository}/${workspace}`;
    let cached = this.cache.get(key);
    if (!cached) {
      cached = this.inner
        .getWorkspaceDefaults(repository, workspace)
        .catch((err) => {
          this.onWarning(repository, workspace, err);
          return {};
        });
      this.cache.set(key, cached);
    }
    return cached.then((defaults) => ({ ...defaults })); // copy, so callers can't change the cache
  }
}
