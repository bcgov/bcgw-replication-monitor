import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";
import { FiltersPanel } from "../components/FiltersPanel";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { JobRunsResults } from "../components/JobRunsResults";

export function JobRunsPage() {
  const { data, isLoading, isError } = useQuery<JobRun[]>({
    queryKey: ["job-runs"],
    queryFn: () => apiFetch("/job-runs"),
  });

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <FiltersPanel />

      <section style={{ flex: 1, padding: "1rem" }}>
        <AdvancedFilters />

        <JobRunsResults data={data} isLoading={isLoading} isError={isError} />
      </section>
    </div>
  );
}
