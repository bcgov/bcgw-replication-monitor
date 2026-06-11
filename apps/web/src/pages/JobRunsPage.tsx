import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";
import { FiltersPanel } from "../components/FiltersPanel";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { JobRunsResults } from "../components/JobRunsResults";
import { DEFAULT_FILTERS } from "../constants/filterDefaults";
import { useState } from "react";

export function JobRunsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const { data, isLoading, isError } = useQuery<JobRun[]>({
    queryKey: ["job-runs", filters],
    queryFn: () => {
      const params = new URLSearchParams();

      filters.status.forEach((s) => params.append("status", s));
      filters.gateway.forEach((g) => params.append("gateway", g));
      filters.dbInstance.forEach((d) => params.append("dbInstance", d));

      return apiFetch(`/job-runs?${params.toString()}`);
    },
  });

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <FiltersPanel filters={filters} onChange={setFilters} />

      <section style={{ flex: 1, padding: "1rem" }}>
        <AdvancedFilters />

        <JobRunsResults data={data} isLoading={isLoading} isError={isError} />
      </section>
    </div>
  );
}
