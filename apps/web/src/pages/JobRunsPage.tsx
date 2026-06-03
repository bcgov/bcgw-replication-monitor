import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";

export function JobRunsPage() {
  const { data, isLoading, isError } = useQuery<JobRun[]>({
    queryKey: ["job-runs"],
    queryFn: () => apiFetch("/job-runs"),
  });

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      {/* Left panel — checkbox filters */}
      <aside
        style={{
          width: "250px",
          borderRight: "1px solid #ddd",
          padding: "1rem",
        }}
      >
        <h2>Filters</h2>
        <div>Checkbox filters</div>
      </aside>

      {/* Right panel */}
      <section style={{ flex: 1, padding: "1rem" }}>
        {/* Advanced filters  */}
        <div style={{ marginBottom: "1rem" }}>
          <h2>Advanced Filters</h2>
          <div>Advanced filters</div>
        </div>

        {/* Results section */}
        <div>
          {/* Search */}
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Search job name..."
              style={{ width: "300px" }}
            />
          </div>

          <h2>Job Runs</h2>

          {isLoading && <div>Loading job runs...</div>}
          {isError && <div>Failed to load job runs</div>}

          {data && (
            <ul>
              {data.map((job) => (
                <li key={job.id}>
                  {job.srcTable} — {job.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
