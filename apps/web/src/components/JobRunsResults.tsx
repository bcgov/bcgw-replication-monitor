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
}

export function JobRunsResults({ data, isLoading, isError }: Props) {
  const items = data?.items ?? [];

  return (
    <div>
      <h2>Results</h2>

      {isLoading && <div>Loading job runs...</div>}
      {isError && <div>Failed to load job runs</div>}

      {items.length > 0 && (
        <table className="job-runs-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Method</th>
              <th>Src Schema</th>
              <th>Src Table</th>
              <th>Dest Schema</th>
              <th>Dest Table</th>
              <th>Update Type</th>
              <th>Records Read</th>
              <th>Records Written</th>
              <th>Last Checked</th>
              <th>Last Converted</th>
            </tr>
          </thead>
          <tbody>
            {items.map((job) => (
              <tr key={`${job.destSchema}.${job.destTable}`}>
                <td>
                  <span className={`status-badge status-${job.status}`}>
                    {job.status}
                  </span>
                </td>
                <td>{job.gateway}</td>
                <td title={job.srcSchema}>{job.srcSchema}</td>
                <td title={job.srcTable}>{job.srcTable}</td>
                <td title={job.destSchema}>{job.destSchema}</td>
                <td title={job.destTable}>{job.destTable}</td>
                <td>{job.updateType}</td>
                <td>{job.recordsRead ?? "—"}</td>
                <td>{job.recordsWritten ?? "—"}</td>
                <td>{new Date(job.lastChecked).toLocaleString()}</td>
                <td>{new Date(job.lastConverted).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
