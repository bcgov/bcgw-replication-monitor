import { useState } from "react";
import type { JobRun } from "../types/jobRun";

interface Props {
  data?: {
    items: JobRun[];
    total: number;
    limit: number;
    offset: number;
  };
  isLoading: boolean;
  isError: boolean;
}

export function JobRunsResults({ data, isLoading, isError }: Props) {
  const [search, setSearch] = useState("");

  const items = data?.items ?? [];

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search job ..."
          style={{ width: "300px" }}
        />
      </div>

      <h2>Job Runs</h2>

      {isLoading && <div>Loading job runs...</div>}
      {isError && <div>Failed to load job runs</div>}

      {items.length > 0 && (
        <ul>
          {items.map((job) => (
            <li key={job.id}>
              {job.srcTable} — {job.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
