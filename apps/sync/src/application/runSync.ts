import { DwmRow } from "../domain/DwmRow";
import { FlowJob } from "../domain/FlowJob";
import {
  FlowJobRecord,
  ResolutionUpdate,
  UNKNOWN,
  UNMAPPED,
  SkipReason,
} from "../domain/FlowJobRecord";
import { classify } from "../domain/classify";
import {
  effectiveParams,
  envKeyParam,
  isKirk,
  KIRK_JOBID,
  KIRK_JOBLABEL,
  mappingFileId,
  needsDefaults,
} from "../domain/params";
import { resolveDestination } from "../domain/resolveDestination";
import {
  recordsRead,
  recordsWritten,
  resolveInstance,
  toDbInstance,
  toStatus,
} from "../domain/normalize";
import { DwmLookup } from "../ports/DwmLookup";
import { FlowJobSource } from "../ports/FlowJobSource";
import { FlowJobStore } from "../ports/FlowJobStore";

export interface SyncDependencies {
  flow: FlowJobSource;
  dwm: DwmLookup;
  store: FlowJobStore;

  /** Injectable clock so settle-time behavior is deterministic in tests. */
  now?: () => Date;
}

export interface SyncConfig {
  pageSize: number;

  /** Give DWM time to write a row after Flow finishes a job. */
  settleMinutes: number;

  /** Re-check recent rows that don't yet have an exact DWM match. */
  unresolvedRecentHours: number;

  /** Stop retrying UNMAPPED/UNKNOWN rows older than this. */
  unmappedRetryDays: number;
}

export interface SyncSummary {
  fetched: number;
  alreadyStored: number;
  inserted: number;
  skipped: number;
  reResolved: number;
}

interface NewJobContext {
  ownDwmById: Map<number, DwmRow>;
  workspaceHistory: Map<string, DwmRow>;
  paramsByJobId: Map<number, Record<string, string>>;
  kirkHistory: Map<string, FlowJobRecord>;
}

function createSummary(): SyncSummary {
  return {
    fetched: 0,
    alreadyStored: 0,
    inserted: 0,
    skipped: 0,
    reResolved: 0,
  };
}

function isSettled(job: FlowJob, settleCutoff: number): boolean {
  const referenceTime = job.timeFinished ?? job.timeStarted;

  // A completed run with neither timestamp is still processed, will be stored as null, and will be re-checked later.
  if (referenceTime === null) return true;

  return referenceTime.getTime() <= settleCutoff;
}

async function paramsForJob(
  flow: FlowJobSource,
  job: FlowJob,
): Promise<Record<string, string>> {
  if (!needsDefaults(job)) {
    return effectiveParams(job.requestParams, {});
  }

  const defaults = await flow.getWorkspaceDefaults(
    job.repository,
    job.workspace,
  );

  return effectiveParams(job.requestParams, defaults);
}

/**
 * Phase 1:
 * Discover all new settled jobs before processing any of them.
 *
 * This naturally performs the initial backfill when FME Flow Table is empty.
 * Later runs normally stop after reaching a fully stored page.
 */
async function discoverNewJobs(
  deps: SyncDependencies,
  config: SyncConfig,
  summary: SyncSummary,
): Promise<FlowJob[]> {
  const now = deps.now ?? (() => new Date());

  const settleCutoff = now().getTime() - config.settleMinutes * 60_000;

  const discoveredJobs: FlowJob[] = [];
  let offset = 0;

  while (true) {
    const page = await deps.flow.getCompletedJobs(offset, config.pageSize);

    if (page.items.length === 0) {
      break;
    }

    summary.fetched += page.items.length;

    const settledJobs = page.items.filter((job) =>
      isSettled(job, settleCutoff),
    );

    if (settledJobs.length > 0) {
      const existingIds = await deps.store.findExistingIds(
        settledJobs.map((job) => job.id),
      );

      summary.alreadyStored += existingIds.size;

      const newJobs = settledJobs.filter((job) => !existingIds.has(job.id));

      /**
       * Flow returns newest first.
       *
       * Once every job on a fully settled page already exists in our table,
       * older pages should also already have been processed.
       */
      if (settledJobs.length === page.items.length && newJobs.length === 0) {
        break;
      }

      discoveredJobs.push(...newJobs);
    }

    offset += page.items.length;

    if (offset >= page.totalCount) {
      break;
    }
  }

  return discoveredJobs;
}

/**
 * Phase 2:
 * Load the supporting data needed to process new Flow jobs.
 */
async function loadNewJobContext(
  deps: SyncDependencies,
  jobs: FlowJob[],
): Promise<NewJobContext> {
  const ownDwmById = await deps.dwm.findByFlowJobIds(jobs.map((job) => job.id));

  const nonKirkWorkspaces = [
    ...new Set(
      jobs
        .filter((job) => !isKirk(job))
        .map((job) => mappingFileId(job.workspace)),
    ),
  ];

  const workspaceHistory =
    await deps.dwm.findLatestByWorkspace(nonKirkWorkspaces);

  const paramsByJobId = new Map<number, Record<string, string>>();

  for (const job of jobs) {
    paramsByJobId.set(job.id, await paramsForJob(deps.flow, job));
  }

  const kirkJobIds = [
    ...new Set(
      jobs
        .filter(isKirk)
        .map((job) => job.requestParams[KIRK_JOBID])
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const kirkHistory =
    await deps.store.findLatestResolvedByKirkJobId(kirkJobIds);

  return {
    ownDwmById,
    workspaceHistory,
    paramsByJobId,
    kirkHistory,
  };
}

/**
 * A skipped run is still stored, so later syncs count it as "already stored"
 * and stop paging.
 */
function buildSkippedRecord(
  job: FlowJob,
  params: Record<string, string>,
  ownDwm: DwmRow | undefined,
  reason: SkipReason,
): FlowJobRecord {
  const written = recordsWritten(job, ownDwm);

  return {
    flowJobId: job.id,
    category: "SKIPPED",
    skipReason: reason,
    repository: job.repository,
    workspace: job.workspace,
    kirkJobId: job.requestParams[KIRK_JOBID] || null,
    kirkJobLabel: job.requestParams[KIRK_JOBLABEL] || null,
    status: toStatus(job.statusRaw, written),
    statusRaw: job.statusRaw,
    statusMessage: job.statusMessage,
    numLines: job.numLines,
    timeStarted: job.timeStarted,
    timeFinished: job.timeFinished,
    sourceType: job.sourceType,
    sourceName: job.sourceName,
    datasource: null,
    destEnvKey: params[envKeyParam(job)]?.trim().toUpperCase() || null,
    dbInstance: null,
    destInstance: UNKNOWN,
    destSchema: UNMAPPED,
    destTable: null,
    destResolvedBy: "unmapped",
    recordsRead: recordsRead(ownDwm),
    recordsWritten: written,
    dwmMatched: ownDwm !== undefined,
  };
}

/**
 * Phase 3:
 * Turn the discovered Flow jobs into rows for our FME Flow table.
 *
 * Jobs are processed oldest to newest so a KIRK run can only inherit
 * destination evidence from an older run, never a newer one.
 */
function buildNewRecords(
  jobs: FlowJob[],
  context: NewJobContext,
  summary: SyncSummary,
): FlowJobRecord[] {
  const jobsOldestFirst = [...jobs].reverse();

  /**
   * A newer successful KIRK run overwrites an older entry in this map,
   * so later failed runs use the closest usable earlier run.
   */
  const kirkPreviousRunDwm = new Map<string, DwmRow>();

  const records: FlowJobRecord[] = [];

  for (const job of jobsOldestFirst) {
    const params = context.paramsByJobId.get(job.id) ?? {};

    const ownDwm = context.ownDwmById.get(job.id);

    const kirk = isKirk(job);

    const fmwHistory = kirk
      ? undefined
      : context.workspaceHistory.get(mappingFileId(job.workspace));

    /**
     * Tells whether this FMW has DWM evidence.
     * For a run with no env key, that determines whether it is kept.
     */
    const classification = classify(
      job,
      params,
      ownDwm !== undefined || fmwHistory !== undefined,
    );

    if (classification.kind === "skip") {
      summary.skipped++;
      records.push(
        buildSkippedRecord(job, params, ownDwm, classification.reason),
      );
      continue;
    }

    const kirkJobId = job.requestParams[KIRK_JOBID] || null;

    const destination = resolveDestination({
      kirk,
      params,
      ownDwm,
      workspaceHistory: fmwHistory,
      kirkHistory: kirkJobId ? context.kirkHistory.get(kirkJobId) : undefined,
      kirkPreviousRunDwm: kirkJobId
        ? kirkPreviousRunDwm.get(kirkJobId)
        : undefined,
    });

    const written = recordsWritten(job, ownDwm);

    const read = recordsRead(ownDwm);

    records.push({
      flowJobId: job.id,
      category: classification.category,
      skipReason: null,
      repository: job.repository,
      workspace: job.workspace,

      kirkJobId,
      kirkJobLabel: job.requestParams[KIRK_JOBLABEL] || null,

      status: toStatus(job.statusRaw, written),
      statusRaw: job.statusRaw,
      statusMessage: job.statusMessage,

      numLines: job.numLines,

      timeStarted: job.timeStarted,
      timeFinished: job.timeFinished,

      sourceType: job.sourceType,
      sourceName: job.sourceName,

      datasource: destination.datasource,

      destEnvKey: classification.envKey,
      dbInstance: toDbInstance(classification.envKey),

      destInstance: resolveInstance(ownDwm, destination.historyInstance),

      destSchema: destination.destSchema,
      destTable: destination.destTable,
      destResolvedBy: destination.destResolvedBy,

      recordsRead: read,
      recordsWritten: written,

      dwmMatched: ownDwm !== undefined,
    });

    /**
     * Usable DWM row of a processed KIRK job becomes history for newer runs of the same KIRK job.
     */
    if (kirkJobId && ownDwm?.destSchema?.trim() && ownDwm.destTable?.trim()) {
      kirkPreviousRunDwm.set(kirkJobId, ownDwm);
    }
  }

  return records;
}

/**
 * Phase 4:
 * Revisit records that may now have better DWM/history information.
 *
 * This runs even when Flow has no new jobs.
 */

/** True if any resolution field differs from what's stored. */
function hasChanged(stored: FlowJobRecord, update: ResolutionUpdate): boolean {
  return (Object.keys(update) as (keyof ResolutionUpdate)[]).some(
    (key) => update[key] !== stored[key],
  );
}
async function reResolveStoredJobs(
  deps: SyncDependencies,
  config: SyncConfig,
): Promise<number> {
  const unresolved = await deps.store.findUnresolved(
    config.unresolvedRecentHours,
    config.unmappedRetryDays,
  );

  if (unresolved.length === 0) {
    return 0;
  }

  const exactDwmById = await deps.dwm.findByFlowJobIds(
    unresolved.map((record) => record.flowJobId),
  );

  const nonKirkWorkspaces = [
    ...new Set(
      unresolved
        .filter((record) => !record.kirkJobId)
        .map((record) => mappingFileId(record.workspace)),
    ),
  ];

  const workspaceHistory =
    await deps.dwm.findLatestByWorkspace(nonKirkWorkspaces);

  const kirkJobIds = [
    ...new Set(
      unresolved
        .map((record) => record.kirkJobId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const kirkHistory =
    await deps.store.findLatestResolvedByKirkJobId(kirkJobIds);

  const updates: ResolutionUpdate[] = unresolved.map((record) => {
    const ownDwm = exactDwmById.get(record.flowJobId);

    const kirk = record.kirkJobId !== null;

    const fmwHistory = kirk
      ? undefined
      : workspaceHistory.get(mappingFileId(record.workspace));

    /**
     *
     * If the row already has a destination, use that destination
     * as the lowest-priority fallback during re-resolution.
     *
     * An UNMAPPED record has no parameter fallback.
     */
    const existingDestinationParams: Record<string, string> =
      record.destResolvedBy === "unmapped"
        ? {}
        : {
            DEST_SCHEMA: record.destSchema,
            DEST_FEATURE_1: record.destTable ?? "",
          };

    const destination = resolveDestination({
      kirk,
      params: existingDestinationParams,
      ownDwm,
      workspaceHistory: fmwHistory,
      kirkHistory: record.kirkJobId
        ? kirkHistory.get(record.kirkJobId)
        : undefined,
    });

    const written = ownDwm?.featuresWritten ?? record.recordsWritten;

    /**
     * If no stronger DWM source appears, preserve the original
     * resolution tag rather than relabeling an existing destination
     * as flow_params just because we passed it back to the resolver.
     */
    const destResolvedBy =
      destination.destResolvedBy === "flow_params"
        ? record.destResolvedBy
        : destination.destResolvedBy;

    return {
      flowJobId: record.flowJobId,

      destInstance: resolveInstance(ownDwm, destination.historyInstance),

      destSchema: destination.destSchema,
      destTable: destination.destTable,
      destResolvedBy,

      datasource:
        ownDwm?.datasource ?? destination.datasource ?? record.datasource,

      recordsRead: ownDwm?.featuresRead ?? record.recordsRead,

      recordsWritten: written,

      dwmMatched: ownDwm !== undefined,

      status: toStatus(record.statusRaw, written),
    };
  });

  const changed = updates.filter((update, i) =>
    hasChanged(unresolved[i], update),
  );
  return deps.store.updateResolution(changed);
}

export async function runSync(
  deps: SyncDependencies,
  config: SyncConfig,
): Promise<SyncSummary> {
  const summary = createSummary();

  const discoveredJobs = await discoverNewJobs(deps, config, summary);

  if (discoveredJobs.length > 0) {
    const context = await loadNewJobContext(deps, discoveredJobs);

    const records = buildNewRecords(discoveredJobs, context, summary);

    summary.inserted += await deps.store.insertMany(records);
  }

  summary.reResolved += await reResolveStoredJobs(deps, config);

  return summary;
}
