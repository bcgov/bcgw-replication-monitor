import { z } from "zod";
import { FlowJobPage, FlowJobSource } from "../../../ports/FlowJobSource";
import {
  completedJobsPageSchema,
  workspaceParametersSchema,
  toFlowJob,
  toWorkspaceDefaults,
} from "./flowV3Mapping";

export interface FlowV3Config {
  baseUrl: string; // e.g. http://<flow-host>/fmerest/v3
  token: string;
  requestTimeoutMs?: number; // per attempt, default 30s
  maxAttempts?: number; // default 4
  retryBaseDelayMs?: number; // default 1s, doubled each retry
}

export class FlowApiError extends Error {
  readonly status?: number;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(
    message: string,
    opts: { status?: number; retryable: boolean; cause?: unknown },
  ) {
    super(message);
    this.name = "FlowApiError";
    this.status = opts.status;
    this.retryable = opts.retryable;
    this.cause = opts.cause;
  }
}

type FetchFn = typeof fetch;
type SleepFn = (ms: number) => Promise<void>;

const defaultSleep: SleepFn = (ms) => new Promise((r) => setTimeout(r, ms));

/** FlowJobSource backed by the FME Flow REST API V3. */
export class FlowV3JobSource implements FlowJobSource {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly retryBaseDelayMs: number;

  constructor(
    private readonly config: FlowV3Config,
    private readonly fetchFn: FetchFn = fetch,
    private readonly sleep: SleepFn = defaultSleep,
  ) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = config.requestTimeoutMs ?? 30_000;
    this.maxAttempts = config.maxAttempts ?? 4;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? 1_000;
  }

  async getCompletedJobs(offset: number, limit: number): Promise<FlowJobPage> {
    const path = `/transformations/jobs/completed?offset=${offset}&limit=${limit}`;
    const page = this.parse(
      completedJobsPageSchema,
      await this.getJson(path),
      path,
    );
    return { items: page.items.map(toFlowJob), totalCount: page.totalCount };
  }

  async getWorkspaceDefaults(
    repository: string,
    workspace: string,
  ): Promise<Record<string, string>> {
    const path =
      `/repositories/${encodeURIComponent(repository)}` +
      `/items/${encodeURIComponent(workspace)}/parameters`;
    const params = this.parse(
      workspaceParametersSchema,
      await this.getJson(path),
      path,
    );
    return toWorkspaceDefaults(params);
  }

  private parse<T>(schema: z.ZodType<T>, body: unknown, path: string): T {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new FlowApiError(
        `Unexpected response shape from ${path}: ${result.error.message}`,
        {
          retryable: false,
        },
      );
    }
    return result.data;
  }

  private async getJson(path: string): Promise<unknown> {
    let lastError: FlowApiError | undefined;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await this.getOnce(path);
      } catch (err) {
        lastError =
          err instanceof FlowApiError
            ? err
            : new FlowApiError(`Flow request failed: ${path}`, {
                retryable: true,
                cause: err,
              });

        if (!lastError.retryable || attempt === this.maxAttempts) break;
        await this.sleep(this.retryBaseDelayMs * 2 ** (attempt - 1)); // 1s, 2s, 4s...
      }
    }
    throw lastError;
  }

  private async getOnce(path: string): Promise<unknown> {
    let res: Response;
    try {
      res = await this.fetchFn(`${this.baseUrl}${path}`, {
        headers: {
          Authorization: `fmetoken token=${this.config.token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      // connect timeout, connection refused, DNS, overall timeout...
      throw new FlowApiError(`Flow unreachable (${describe(err)}): ${path}`, {
        retryable: true,
        cause: err,
      });
    }

    if (!res.ok) {
      throw new FlowApiError(`Flow returned HTTP ${res.status}: ${path}`, {
        status: res.status,
        retryable: res.status >= 500 || res.status === 429,
      });
    }

    try {
      return await res.json();
    } catch (err) {
      throw new FlowApiError(`Flow returned an unreadable body: ${path}`, {
        retryable: true,
        cause: err,
      });
    }
  }
}

function describe(err: unknown): string {
  const e = err as { name?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.name ?? "unknown error";
}
