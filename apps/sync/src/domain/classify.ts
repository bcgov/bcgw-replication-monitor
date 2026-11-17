import { FlowJob } from "./FlowJob";
import { JobCategory } from "./FlowJobRecord";
import { envKeyParam, isKirk } from "./params";
import { UTILITY_REPOSITORY } from "./classificationRules";

export type SkipReason =
  "utility_repo" | "ignored_workspace" | "dev_or_test" | "no_env_key";

export type Classification =
  | { kind: "skip"; reason: SkipReason }
  | {
      kind: "keep";
      category: JobCategory;
      envKey: string | null; // normalized, e.g. "PRD"; null if none
      kirk: boolean;
      unknownEnvKey: boolean; // unexpected value: kept, but log a warning
    };

/**
 * Decides whether a run is skipped, BCGW or NON_BCGW.
 * `params` must already be merged with FMW defaults (effectiveParams).
 * First matching rule wins.
 */
export function classify(
  job: FlowJob,
  params: Record<string, string>,
  fmwHasDwmRows: boolean,
): Classification {
  if (job.repository.toUpperCase() === UTILITY_REPOSITORY) {
    return { kind: "skip", reason: "utility_repo" };
  }

  const kirk = isKirk(job);
  const env = (params[envKeyParam(job)] ?? "").trim().toUpperCase();
  const keep = (
    category: JobCategory,
    unknownEnvKey = false,
  ): Classification => ({
    kind: "keep",
    category,
    envKey: env || null,
    kirk,
    unknownEnvKey,
  });

  switch (env) {
    case "PRD":
      return keep("BCGW");
    case "DLV":
    case "TST":
      return { kind: "skip", reason: "dev_or_test" };
    case "OTHR":
    case "OTHER":
      return keep("NON_BCGW");
    case "":
      return fmwHasDwmRows
        ? keep("BCGW")
        : { kind: "skip", reason: "no_env_key" };
    default:
      return keep("BCGW", true);
  }
}
