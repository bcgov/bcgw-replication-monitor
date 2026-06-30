import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";
import { FiltersPanel } from "../components/FiltersPanel";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { JobRunsResults } from "../components/JobRunsResults";
import { SummaryBar } from "../components/SummaryBar";
import { DEFAULT_FILTERS } from "../constants/filterDefaults";
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

  const { data, isLoading, isError } = useQuery<JobRunsResponse>({
    queryKey: ["job-runs", filters, search],
    queryFn: () => {
      const params = new URLSearchParams();

      filters.status.forEach((s) => params.append("status", s));
      filters.gateway.forEach((g) => params.append("gateway", g));
      filters.dbInstance.forEach((d) => params.append("dbInstance", d));

      if (search.trim()) {
        params.append("search", search.trim());
      }

      return apiFetch(`/job-runs?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <FiltersPanel filters={filters} onChange={setFilters} />

      <section style={{ flex: 1, padding: "1rem" }}>
        <AdvancedFilters />

        <SummaryBar
          counts={data?.counts ?? { all: 0, success: 0, failed: 0 }}
          selectedStatuses={filters.status}
          onStatusChange={(statuses) =>
            setFilters({ ...filters, status: statuses })
          }
        />

        <JobRunsResults data={data} isLoading={isLoading} isError={isError} />
      </section>
    </div>
  );
}
