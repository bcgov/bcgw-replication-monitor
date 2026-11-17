import { DwmRow } from "./DwmRow";
import { FlowJob } from "./FlowJob";
import { FmeStatus, UNKNOWN } from "./FlowJobRecord";

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

export interface InstanceConfig {
  /** Env key: DEST_INSTANCE host name, e.g. { PRD: "<prod host>" }. */
  envKeyToHost: Readonly<Record<string, string>>;
}

/**
 * Instance (host), first source that has it:
 * 1. the run's own DWM row
 * 2. the run's env key mapped to a host
 * 3. the job's history (FMW's latest DWM row, or our table for KIRK)
 * 4. UNKNOWN
 */
export function resolveInstance(
  ownDwm: DwmRow | undefined,
  envKey: string | null,
  historyInstance: string | null,
  config: InstanceConfig,
): string {
  const fromOwn = ownDwm?.destInstance?.trim();
  if (fromOwn) return fromOwn;

  const fromEnv = envKey ? config.envKeyToHost[envKey] : undefined;
  if (fromEnv) return fromEnv;

  const fromHistory = historyInstance?.trim();
  if (fromHistory) return fromHistory;

  return UNKNOWN;
}
