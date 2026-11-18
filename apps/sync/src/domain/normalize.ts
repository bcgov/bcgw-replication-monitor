import { DwmRow } from "./DwmRow";
import { FlowJob } from "./FlowJob";
import { DbInstance, FmeStatus, UNKNOWN } from "./FlowJobRecord";

/** Records written (DWM if the run has its own DWM row, otherwise Flow's count). */
export function recordsWritten(
  job: FlowJob,
  ownDwm: DwmRow | undefined,
): number | null {
  return ownDwm?.featuresWritten ?? job.numFeaturesOutput ?? null;
}

/** Records read (only DWM has it). */
export function recordsRead(ownDwm: DwmRow | undefined): number | null {
  return ownDwm?.featuresRead ?? null;
}

/**
 * Flow SUCCESS + written > 0: SUCCESS, Flow SUCCESS + 0 (or unknown): UNCHANGED, anything else: ERROR.
 */
export function toStatus(statusRaw: string, written: number | null): FmeStatus {
  if (statusRaw.toUpperCase() !== "SUCCESS") return "ERROR";
  return written !== null && written > 0 ? "SUCCESS" : "UNCHANGED";
}

/** Environment from the env key: PRD: PROD, TST: TEST, anything else null. */
export function toDbInstance(envKey: string | null): DbInstance | null {
  if (envKey === "PRD") return "PROD";
  if (envKey === "TST") return "TEST";
  return null;
}

/**
 * Host, first source that has it (never guessed from the env key):
 * 1. the run's own DWM row
 * 2. the job's history (FMW's latest DWM row, or our table for KIRK)
 * 3. UNKNOWN
 */
export function resolveInstance(
  ownDwm: DwmRow | undefined,
  historyInstance: string | null,
): string {
  const fromOwn = ownDwm?.destInstance?.trim();
  if (fromOwn) return fromOwn;

  const fromHistory = historyInstance?.trim();
  if (fromHistory) return fromHistory;

  return UNKNOWN;
}
