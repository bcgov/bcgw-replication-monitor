import { useState } from "react";
import type { JobRun } from "../types/jobRun";

interface Props {
  data?: JobRun[];
  isLoading: boolean;
  isError: boolean;
}

export function JobRunsResults({ data, isLoading, isError }: Props) {
  const [search, setSearch] = useState("");

  const filteredData =
    data?.filter((job) =>
      job.srcTable.toLowerCase().includes(search.toLowerCase()),
    ) || [];

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

      {filteredData && (
        <ul>
          {filteredData.map((job) => (
            <li key={job.id}>
              {job.srcTable} — {job.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
