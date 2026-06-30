import type { JobRun } from "../types/jobRun";

interface Props {
  data?: {
    items: JobRun[];
    total: number;
    counts: { all: number; success: number; failed: number };
    limit: number;
    offset: number;
  };
  isLoading: boolean;
  isError: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

export function JobRunsResults({
  data,
  isLoading,
  isError,
  search,
  onSearchChange,
}: Props) {
  const items = data?.items ?? [];

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search dest table or log filename..."
          style={{ width: "300px" }}
        />
      </div>

      <h2>Job Runs</h2>

      {isLoading && <div>Loading job runs...</div>}
      {isError && <div>Failed to load job runs</div>}

      {items.length > 0 && (
        <ul>
          {items.map((job) => (
            <li key={job.destSchema + job.destTable}>
              {job.destTable} — {job.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
