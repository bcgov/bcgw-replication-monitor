import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { TextField } from "@bcgov/design-system-react-components";
import { SearchIcon } from "../components/icons/SearchIcon";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";
import { FiltersPanel } from "../components/FiltersPanel";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { JobRunsResults } from "../components/JobRunsResults";
import { SummaryBar } from "../components/SummaryBar";
import { DEFAULT_FILTERS } from "../constants/filterDefaults";
import { useDebounce } from "../hooks/useDebounce";
import { useState } from "react";

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
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState<{
    sortBy: string;
    sortDir: "asc" | "desc";
  }>({
    sortBy: "lastChecked",
    sortDir: "desc",
  });

  const { data, isLoading, isError } = useQuery<JobRunsResponse>({
    queryKey: ["job-runs", filters, debouncedSearch, sort],
    queryFn: () => {
      const params = new URLSearchParams();

      filters.status.forEach((s) => params.append("status", s));
      filters.gateway.forEach((g) => params.append("gateway", g));
      filters.dbInstance.forEach((d) => params.append("dbInstance", d));

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      params.append("sortBy", sort.sortBy);
      params.append("sortDir", sort.sortDir);

      return apiFetch(`/job-runs?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <FiltersPanel filters={filters} onChange={setFilters} />

      <section style={{ flex: 1, padding: "0.5rem" }}>
        <AdvancedFilters />
        <div className="results-toolbar">
          <SummaryBar
            counts={data?.counts ?? { all: 0, success: 0, failed: 0 }}
            selectedStatuses={filters.status}
            onStatusChange={(statuses) =>
              setFilters({ ...filters, status: statuses })
            }
          />

          <TextField
            aria-label="Search"
            value={search}
            onChange={setSearch}
            iconLeft={<SearchIcon />}
          />
        </div>
        <JobRunsResults
          data={data}
          isLoading={isLoading}
          isError={isError}
          sort={sort}
          onSortChange={setSort}
        />{" "}
      </section>
    </div>
  );
}
