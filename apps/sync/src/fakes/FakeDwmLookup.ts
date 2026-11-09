import { DwmRow } from "../domain/DwmRow";
import { DwmLookup } from "../ports/DwmLookup";

/** In-memory FME_STATUS_LOG. Read-only, like the real table. */
export class FakeDwmLookup implements DwmLookup {
  constructor(private readonly rows: DwmRow[] = []) {}

  async findByFlowJobIds(flowJobIds: number[]): Promise<Map<number, DwmRow>> {
    const wanted = new Set(flowJobIds);
    const result = new Map<number, DwmRow>();
    for (const row of this.rows) {
      if (row.flowJobId !== null && wanted.has(row.flowJobId)) {
        result.set(row.flowJobId, row);
      }
    }
    return result;
  }

  async findLatestByWorkspace(
    mappingFileIds: string[],
  ): Promise<Map<string, DwmRow>> {
    const wanted = new Set(mappingFileIds);
    const result = new Map<string, DwmRow>();
    for (const row of this.rows) {
      if (!wanted.has(row.mappingFileId) || row.startTime === null) continue;
      const current = result.get(row.mappingFileId);
      if (!current || row.startTime > (current.startTime ?? new Date(0))) {
        result.set(row.mappingFileId, row);
      }
    }
    return result;
  }
}
