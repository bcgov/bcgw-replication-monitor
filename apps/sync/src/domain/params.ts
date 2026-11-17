import { FlowJob } from "./FlowJob";

export const ENV_KEY = "DEST_DB_ENV_KEY";
export const KIRK_ENV_KEY = "KIRK_DEST_DB_KEY_OVERRIDE";
export const DEST_SCHEMA = "DEST_SCHEMA";
export const DEST_TABLE = "DEST_FEATURE_1";
export const KIRK_JOBID = "KIRK_JOBID";
export const KIRK_JOBLABEL = "KIRK_JOBLABEL";

const isBlank = (v: string | undefined): boolean =>
  v === undefined || v.trim() === "";

export function isKirk(job: FlowJob): boolean {
  return !isBlank(job.requestParams[KIRK_JOBID]);
}

/** The env key parameter this run uses: KIRK runs have their own. */
export function envKeyParam(job: FlowJob): string {
  return isKirk(job) ? KIRK_ENV_KEY : ENV_KEY;
}

/** FMW name without ".fmw" */
export function mappingFileId(workspace: string): string {
  return workspace.replace(/\.fmw$/i, "");
}

/**
 * True when the run is missing a value that FMW defaults could supply.
 * KIRK runs never need defaults.
 */
export function needsDefaults(job: FlowJob): boolean {
  if (isKirk(job)) return false;
  return [ENV_KEY, DEST_SCHEMA, DEST_TABLE].some((name) =>
    isBlank(job.requestParams[name]),
  );
}

/** FMW defaults, overridden by the run's own values. Empty values count as "not set". */
export function effectiveParams(
  requestParams: Record<string, string>,
  defaults: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = { ...defaults };
  for (const [name, value] of Object.entries(requestParams)) {
    if (!isBlank(value)) result[name] = value;
  }
  return result;
}
