import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";
import { Button } from "@bcgov/design-system-react-components";

interface HistoryResponse {
  items: JobRun[];
}

export function JobHistoryPage() {
  const { destSchema, destTable } = useParams<{
    destSchema: string;
    destTable: string;
  }>();

  const { data, isLoading, isError, refetch } = useQuery<HistoryResponse>({
    queryKey: ["history", destSchema, destTable],
    queryFn: () => apiFetch(`/history/${destSchema}/${destTable}`),
    enabled: !!destSchema && !!destTable,
  });

  const runs = data?.items ?? [];
  const latestRun = runs[0]; // default sort is lastChecked desc so first is most recent

  return (
    <div className="job-history">
      <nav className="navbar">
        <div className="breadcrumb">
          <Link to="/">BCGW Replication Monitor</Link>
          <span>
            {" "}
            &gt; {destSchema}.{destTable}
          </span>
        </div>
        <Button variant="secondary" size="small" onPress={() => refetch()}>
          Refresh ⟳
        </Button>
      </nav>

      {isLoading && <div>Loading…</div>}
      {isError && <div>Failed to load job history.</div>}
      {!isLoading && !isError && runs.length === 0 && (
        <div>No history found for this job.</div>
      )}

      {!isLoading && !isError && latestRun && (
        <>
          <div className="job-history-header">
            <h1>Job History</h1>
            <span className={`status-badge status-${latestRun.status}`}>
              Last Run:
              <br />
              {latestRun.status}
            </span>
          </div>

          <table className="summary-table">
            <thead>
              <tr>
                <th>Source Schema</th>
                <th>Source Table</th>
                <th>Destination Schema</th>
                <th>Destination Table</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{latestRun.srcSchema}</td>
                <td>{latestRun.srcTable}</td>
                <td>{latestRun.destSchema}</td>
                <td>{latestRun.destTable}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
