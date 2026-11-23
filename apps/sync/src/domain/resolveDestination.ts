import { DwmRow } from "./DwmRow";
import { FlowJobRecord, ResolvedBy, UNKNOWN, UNMAPPED } from "./FlowJobRecord";
import { DEST_SCHEMA, DEST_TABLE } from "./params";

export interface DestinationInputs {
  kirk: boolean;
  /** Effective params (request merged with FMW defaults). */
  params: Record<string, string>;
  /** The run's own DWM row, if any. */
  ownDwm?: DwmRow;
  /** Non-KIRK only: the FMW's latest DWM row. */
  workspaceHistory?: DwmRow;
  /** KIRK only: latest resolved row for this KIRK_JOBID in our table. */
  kirkHistory?: FlowJobRecord;
  /** KIRK only: DWM row of an earlier run of the same KIRK job, from this sync run. */
  kirkPreviousRunDwm?: DwmRow;
}

export interface Destination {
  destSchema: string;
  destTable: string | null;
  destResolvedBy: ResolvedBy;
  datasource: string | null;
  /** Instance from the job's history, for resolveInstance. */
  historyInstance: string | null;
}

interface Candidate {
  schema: string | null;
  table: string | null;
  datasource: string | null;
  instance: string | null;
}

const clean = (v: string | null | undefined): string | null =>
  v?.trim() || null;

const fromDwm = (row: DwmRow): Candidate => ({
  schema: clean(row.destSchema),
  table: clean(row.destTable),
  datasource: row.datasource,
  instance: clean(row.destInstance),
});

function historyCandidate(i: DestinationInputs): Candidate | undefined {
  if (!i.kirk) return i.workspaceHistory && fromDwm(i.workspaceHistory);

  const h = i.kirkHistory;
  if (h && h.destResolvedBy !== "unmapped") {
    return {
      schema: clean(h.destSchema),
      table: clean(h.destTable),
      datasource: h.datasource,
      instance: h.destInstance === UNKNOWN ? null : clean(h.destInstance),
    };
  }
  return i.kirkPreviousRunDwm && fromDwm(i.kirkPreviousRunDwm);
}

export function resolveDestination(i: DestinationInputs): Destination {
  const own = i.ownDwm && fromDwm(i.ownDwm);
  const history = historyCandidate(i);

  const datasource = own?.datasource ?? history?.datasource ?? null;
  const historyInstance = history?.instance ?? null;
  const result = (
    destSchema: string,
    destTable: string | null,
    destResolvedBy: ResolvedBy,
  ): Destination => ({
    destSchema,
    destTable,
    destResolvedBy,
    datasource,
    historyInstance,
  });

  if (own?.schema && own.table)
    return result(own.schema, own.table, "dwm_exact");
  if (history?.schema && history.table)
    return result(history.schema, history.table, "dwm_history");

  const schema = clean(i.params[DEST_SCHEMA]);
  const table = clean(i.params[DEST_TABLE]);
  if (schema && table) return result(schema, table, "flow_params");

  return result(UNMAPPED, null, "unmapped");
}
