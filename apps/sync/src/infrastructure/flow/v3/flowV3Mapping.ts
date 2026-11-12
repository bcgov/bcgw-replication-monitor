import { z } from "zod";
import { FlowJob } from "../../../domain/FlowJob";

const publishedParameter = z.object({
  name: z.string(),
  raw: z.unknown().optional(),
});

const jobResult = z.object({
  status: z.string().nullish(),
  statusMessage: z.string().nullish(),
  numFeaturesOutput: z.number().nullish(),
  timeStarted: z.string().nullish(),
  timeFinished: z.string().nullish(),
});

const completedJob = z.object({
  id: z.number(),
  workspace: z.string(),
  repository: z.string(),
  status: z.string().nullish(),
  numLines: z.number().nullish(),
  timeStarted: z.string().nullish(),
  timeFinished: z.string().nullish(),
  sourceType: z.string().nullish(),
  sourceName: z.string().nullish(),
  request: z
    .object({ publishedParameters: z.array(publishedParameter).nullish() })
    .nullish(),
  result: jobResult.nullish(),
});

export const completedJobsPageSchema = z.object({
  offset: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  items: z.array(completedJob),
});

export const workspaceParametersSchema = z.array(
  z.object({
    name: z.string(),
    defaultValue: z.unknown().optional(),
  }),
);

export type CompletedJobV3 = z.infer<typeof completedJob>;

// mapping to domain types:

/** Flow values can be strings, numbers, booleans or arrays (choice parameters). */
export function paramToString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value))
    return value.length ? paramToString(value[0]) : undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return undefined;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toFlowJob(job: CompletedJobV3): FlowJob {
  const requestParams: Record<string, string> = {};
  for (const p of job.request?.publishedParameters ?? []) {
    const v = paramToString(p.raw);
    if (v !== undefined) requestParams[p.name] = v;
  }

  return {
    id: job.id,
    repository: job.repository,
    workspace: job.workspace,
    statusRaw: job.status ?? job.result?.status ?? "UNKNOWN",
    statusMessage: job.result?.statusMessage ?? null,
    numLines: job.numLines ?? null,
    numFeaturesOutput: job.result?.numFeaturesOutput ?? null,
    timeStarted: toDate(job.timeStarted ?? job.result?.timeStarted),
    timeFinished: toDate(job.timeFinished ?? job.result?.timeFinished),
    sourceType: job.sourceType ?? null,
    sourceName: job.sourceName ?? null,
    requestParams,
  };
}

/** Turns the /parameters response into { name: default }. Parameters without a default are left out. */
export function toWorkspaceDefaults(
  params: z.infer<typeof workspaceParametersSchema>,
): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const p of params) {
    const v = paramToString(p.defaultValue);
    if (v !== undefined) defaults[p.name] = v;
  }
  return defaults;
}
