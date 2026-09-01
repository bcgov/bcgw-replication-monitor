import {
  DEFAULT_FILTERS,
  ALLOWED_GATEWAYS,
  ALLOWED_STATUSES,
  ALLOWED_DB_INSTANCES,
  ALLOWED_SORT_FIELDS,
  ALLOWED_SORT_DIRS,
} from "../constants/filterDefaults";
import type { JobRunsQueryState } from "./jobRunsQueryReducer";
import { initialQueryState } from "./jobRunsQueryReducer";

// All query params this page recognizes. Used to detect whether a URL carries
// any explicit query state (vs. a bare, fresh URL).
const KNOWN_PARAMS = [
  "gateway",
  "status",
  "dbInstance",
  "destSchema",
  "lastCheckedFrom",
  "lastCheckedTo",
  "search",
  "sortBy",
  "sortDir",
  "page",
];

// Keep only values that are in the allowed list
function filterAllowed(values: string[], allowed: readonly string[]): string[] {
  return values.filter((v) => allowed.includes(v));
}

// Parse a date param; return the ISO string if valid, else null
function parseDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : value;
}

/**
 * Builds a clean, validated query state from URL search params.
 *
 * The URL is untrusted, user-editable input, so every field is validated
 * against its allowed values (or parsed/clamped) and falls back to a sensible
 * default. Anything invalid or unknown is ignored, so a malformed URL (e.g.
 * ?status=banana&page=-5) never breaks the page.
 *
 * Absent vs. explicitly empty:
 * - A completely bare URL (fresh open, no known params) is treated as "fresh"
 *   and uses DEFAULT_FILTERS for the checkbox filters.
 * - If the URL carries ANY known param, it is treated as an explicit view. In
 *   that case an empty filter (e.g. the user unchecked every gateway) is
 *   respected as an empty selection rather than being reset to defaults. This
 *   works reliably because toSearchParams always writes sortBy/sortDir, so any
 *   real filtered view has at least those params present.
 */
export function parseQueryState(params: URLSearchParams): JobRunsQueryState {
  // Any known param present, the URL describes an explicit view.
  const hasQueryState = KNOWN_PARAMS.some((key) => params.has(key));

  // --- Filters (arrays): respect empties when the view is explicit ---
  const gateway = hasQueryState
    ? filterAllowed(params.getAll("gateway"), ALLOWED_GATEWAYS)
    : DEFAULT_FILTERS.gateway;

  const status = hasQueryState
    ? filterAllowed(params.getAll("status"), ALLOWED_STATUSES)
    : DEFAULT_FILTERS.status;

  const dbInstance = hasQueryState
    ? filterAllowed(params.getAll("dbInstance"), ALLOWED_DB_INSTANCES)
    : DEFAULT_FILTERS.dbInstance;

  // --- Advanced filters ---
  const destSchema = params.get("destSchema") || null;
  const lastCheckedFrom = parseDate(params.get("lastCheckedFrom"));
  const lastCheckedTo = parseDate(params.get("lastCheckedTo"));

  // --- Search ---
  const search = params.get("search") ?? "";

  // --- Sort (validate against allowed fields/directions) ---
  const rawSortBy = params.get("sortBy") ?? "";
  const sortBy = ALLOWED_SORT_FIELDS.includes(
    rawSortBy as (typeof ALLOWED_SORT_FIELDS)[number],
  )
    ? rawSortBy
    : initialQueryState.sort.sortBy;

  const rawSortDir = params.get("sortDir") ?? "";
  const sortDir = ALLOWED_SORT_DIRS.includes(
    rawSortDir as (typeof ALLOWED_SORT_DIRS)[number],
  )
    ? (rawSortDir as "asc" | "desc")
    : initialQueryState.sort.sortDir;

  // --- Pagination (non-negative integer, else 0) ---
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;

  return {
    filters: { status, gateway, dbInstance },
    advanced: { destSchema, lastCheckedFrom, lastCheckedTo },
    search,
    sort: { sortBy, sortDir },
    page,
  };
}

/**
 * Serializes query state into URL search params.
 *
 * Only writes non-default / meaningful values to keep the URL clean. Arrays are
 * written as repeated params (e.g. ?status=success&status=failed). This is the
 * inverse of parseQueryState.
 */
export function toSearchParams(state: JobRunsQueryState): URLSearchParams {
  const params = new URLSearchParams();

  // Filters (arrays) — always write so the URL fully describes the view
  state.filters.gateway.forEach((v) => params.append("gateway", v));
  state.filters.status.forEach((v) => params.append("status", v));
  state.filters.dbInstance.forEach((v) => params.append("dbInstance", v));

  // Advanced
  if (state.advanced.destSchema) {
    params.set("destSchema", state.advanced.destSchema);
  }
  if (state.advanced.lastCheckedFrom) {
    params.set("lastCheckedFrom", state.advanced.lastCheckedFrom);
  }
  if (state.advanced.lastCheckedTo) {
    params.set("lastCheckedTo", state.advanced.lastCheckedTo);
  }

  // Search
  if (state.search.trim()) {
    params.set("search", state.search);
  }

  // Sort
  params.set("sortBy", state.sort.sortBy);
  params.set("sortDir", state.sort.sortDir);

  // Pagination, only write if not the first page
  if (state.page > 0) {
    params.set("page", String(state.page));
  }

  return params;
}
