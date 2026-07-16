import { DEFAULT_FILTERS } from "../constants/filterDefaults";

export interface Filters {
  status: string[];
  gateway: string[];
  dbInstance: string[];
}

export interface Sort {
  sortBy: string;
  sortDir: "asc" | "desc";
}

export interface AdvancedFilters {
  destSchema: string | null;
  lastCheckedFrom: string | null; // ISO string or null
  lastCheckedTo: string | null;
}

export interface JobRunsQueryState {
  filters: Filters;
  advanced: AdvancedFilters;
  search: string;
  sort: Sort;
  page: number;
}

export type JobRunsQueryAction =
  | { type: "SET_FILTERS"; payload: Filters }
  | { type: "SET_ADVANCED_FILTERS"; payload: AdvancedFilters }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SORT"; payload: Sort }
  | { type: "SET_PAGE"; payload: number };

export const initialQueryState: JobRunsQueryState = {
  filters: DEFAULT_FILTERS,
  advanced: {
    destSchema: null,
    lastCheckedFrom: null,
    lastCheckedTo: null,
  },
  search: "",
  sort: { sortBy: "lastChecked", sortDir: "desc" },
  page: 0,
};

/**
 * Reducer for the job runs query state.
 *
 * Any change to filters, search, or sort resets page to 0,
 * so the user always starts at the first page of new results.
 * Page changes do NOT reset anything else.
 */
export function jobRunsQueryReducer(
  state: JobRunsQueryState,
  action: JobRunsQueryAction,
): JobRunsQueryState {
  switch (action.type) {
    case "SET_FILTERS":
      return { ...state, filters: action.payload, page: 0 };
    case "SET_ADVANCED_FILTERS":
      return { ...state, advanced: action.payload, page: 0 };
    case "SET_SEARCH":
      return { ...state, search: action.payload, page: 0 };
    case "SET_SORT":
      return { ...state, sort: action.payload, page: 0 };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    default:
      return state;
  }
}
