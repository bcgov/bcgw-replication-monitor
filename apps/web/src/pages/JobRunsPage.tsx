import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { TextField } from "@bcgov/design-system-react-components";
import { SearchIcon } from "../components/icons/SearchIcon";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";
import { FiltersPanel } from "../components/FiltersPanel";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { JobRunsResults } from "../components/JobRunsResults";
import { SummaryBar } from "../components/SummaryBar";
import { Pagination } from "../components/Pagination";
import { useSearchParams } from "react-router-dom";
import { jobRunsQueryReducer } from "./jobRunsQueryReducer";
import { parseQueryState, toSearchParams } from "./urlQueryState";
import type { JobRunsQueryAction } from "./jobRunsQueryReducer";
import { useDebounce } from "../hooks/useDebounce";

interface JobRunsResponse {
  items: JobRun[];
  total: number;
  counts: {
    all: number;
    success: number;
    failed: number;
  };
  limit: number;
  offset: number;
}

export function JobRunsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the source of truth: derive the query state from the URL.
  const query = parseQueryState(searchParams);
  const { filters, search, sort, page, advanced } = query;

  const dispatch = (action: JobRunsQueryAction) => {
    const next = jobRunsQueryReducer(query, action);
    // Writes the resulting state back to the URL.
    setSearchParams(toSearchParams(next), { replace: true });
  };

  const debouncedSearch = useDebounce(search, 300);

  const pageSize = 20;

  const { data, isLoading, isError } = useQuery<JobRunsResponse>({
    queryKey: ["job-runs", filters, advanced, debouncedSearch, sort, page],
    queryFn: () => {
      const params = new URLSearchParams();
      const appendArrayParam = (key: string, values: string[]) => {
        if (values.length === 0) {
          params.append(key, ""); // If empty, backend returns none
        } else {
          values.forEach((v) => params.append(key, v));
        }
      };

      appendArrayParam("status", filters.status);
      appendArrayParam("gateway", filters.gateway);
      appendArrayParam("dbInstance", filters.dbInstance);

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      if (advanced.destSchema) {
        params.append("destSchema", advanced.destSchema);
      }
      if (advanced.lastCheckedFrom) {
        params.append("lastCheckedFrom", advanced.lastCheckedFrom);
      }
      if (advanced.lastCheckedTo) {
        params.append("lastCheckedTo", advanced.lastCheckedTo);
      }

      params.append("sortBy", sort.sortBy);
      params.append("sortDir", sort.sortDir);

      //Pagination
      params.append("limit", String(pageSize));
      params.append("offset", String(page * pageSize));

      return apiFetch(`/job-runs?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <FiltersPanel
        filters={filters}
        onChange={(f) => dispatch({ type: "SET_FILTERS", payload: f })}
        onResetAll={() => dispatch({ type: "RESET_ALL" })}
      />

      <section style={{ flex: 1, padding: "0.5rem" }}>
        <AdvancedFilters
          value={advanced}
          onChange={(advanced) =>
            dispatch({ type: "SET_ADVANCED_FILTERS", payload: advanced })
          }
        />

        <div className="results-toolbar">
          <SummaryBar
            counts={data?.counts ?? { all: 0, success: 0, failed: 0 }}
            selectedStatuses={filters.status}
            onStatusChange={(statuses) =>
              dispatch({
                type: "SET_FILTERS",
                payload: { ...filters, status: statuses },
              })
            }
          />

          <TextField
            aria-label="Search"
            className="results-search"
            value={search}
            onChange={(value) =>
              dispatch({ type: "SET_SEARCH", payload: value })
            }
            iconLeft={<SearchIcon />}
          />
        </div>
        <JobRunsResults
          data={data}
          isLoading={isLoading}
          isError={isError}
          sort={sort}
          onSortChange={(s) => dispatch({ type: "SET_SORT", payload: s })}
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={data?.total ?? 0}
          onPageChange={(p) => dispatch({ type: "SET_PAGE", payload: p })}
        />
      </section>
    </div>
  );
}
