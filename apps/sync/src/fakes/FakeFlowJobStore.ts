import {
  FlowJobRecord,
  ResolutionUpdate,
  UNKNOWN,
} from "../domain/FlowJobRecord";
import { FlowJobStore } from "../ports/FlowJobStore";

/** In-memory FME_FLOW_JOB table. */
export class FakeFlowJobStore implements FlowJobStore {
  readonly rows = new Map<number, FlowJobRecord>();

  constructor(
    initial: FlowJobRecord[] = [],
    private readonly now: () => Date = () => new Date(),
  ) {
    for (const r of initial) this.rows.set(r.flowJobId, { ...r });
  }

  async findExistingIds(flowJobIds: number[]): Promise<Set<number>> {
    return new Set(flowJobIds.filter((id) => this.rows.has(id)));
  }

  async insertMany(records: FlowJobRecord[]): Promise<number> {
    let inserted = 0;
    for (const r of records) {
      if (this.rows.has(r.flowJobId)) continue; // existing rows are left unchanged
      this.rows.set(r.flowJobId, { ...r });
      inserted++;
    }
    return inserted;
  }

  async findUnresolved(recentHours: number): Promise<FlowJobRecord[]> {
    const cutoff = this.now().getTime() - recentHours * 3_600_000;
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.destResolvedBy === "unmapped" ||
          r.destInstance === UNKNOWN ||
          (!r.dwmMatched && (r.timeStarted?.getTime() ?? 0) >= cutoff),
      )
      .map((r) => ({ ...r }));
  }

  async updateResolution(updates: ResolutionUpdate[]): Promise<number> {
    let updated = 0;
    for (const u of updates) {
      const existing = this.rows.get(u.flowJobId);
      if (!existing) continue;
      this.rows.set(u.flowJobId, { ...existing, ...u });
      updated++;
    }
    return updated;
  }

  async findLatestResolvedByKirkJobId(
    kirkJobIds: string[],
  ): Promise<Map<string, FlowJobRecord>> {
    const wanted = new Set(kirkJobIds);
    const result = new Map<string, FlowJobRecord>();
    for (const r of this.rows.values()) {
      if (
        !r.kirkJobId ||
        !wanted.has(r.kirkJobId) ||
        r.destResolvedBy === "unmapped"
      )
        continue;
      const current = result.get(r.kirkJobId);
      if (
        !current ||
        (r.timeStarted?.getTime() ?? 0) > (current.timeStarted?.getTime() ?? 0)
      ) {
        result.set(r.kirkJobId, { ...r });
      }
    }
    return result;
  }
}
