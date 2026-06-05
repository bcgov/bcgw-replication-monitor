import { JobRun } from "../domain/JobRun";
import { JobRunSortField, SortDirection } from "../domain/JobRun";

/**
 * Sorts job runs in-memory.
 *
 * Handles string, number, and Date comparisons.
 * Used by FakeJobRunRepository only — Oracle handles sorting via SQL.
 */
export function sortJobRuns(
  data: JobRun[],
  sortBy: JobRunSortField,
  sortDir: SortDirection,
): JobRun[] {
  return [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal == null || bVal == null) return 0;

    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDir === "asc"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}

/**
 * Applies offset/limit pagination to an array.
 */
export function paginate<T>(data: T[], offset: number, limit: number): T[] {
  return data.slice(offset, offset + limit);
}
