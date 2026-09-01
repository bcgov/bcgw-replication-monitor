import { useParams, useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "../api/client";
import type { JobRun } from "../types/jobRun";
import { Button } from "@bcgov/design-system-react-components";
import { JobHistoryTable } from "../components/JobHistoryTable";

interface HistoryResponse {
  items: JobRun[];
}

export function JobHistoryPage() {
  const navigate = useNavigate();

  const [sort, setSort] = useState({
    sortBy: "lastChecked",
    sortDir: "desc" as "asc" | "desc",
  });
  const { destSchema, destTable } = useParams<{
    destSchema: string;
    destTable: string;
  }>();

  /**
   * Breadcrumb navigation back to the landing page.
   *
   * If the user navigated here from within the app, go back so their
   * landing-page filters (stored in the URL) are preserved. If the history page
   * was opened directly (bookmark, shared link, refresh) there's no in-app
   * history to return to, so fall back to the landing page.
   */
  const handleBreadcrumb = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<HistoryResponse>({
      queryKey: ["history", destSchema, destTable, sort],
      queryFn: () =>
        apiFetch(
          `/history/${destSchema}/${destTable}?sortBy=${sort.sortBy}&sortDir=${sort.sortDir}`,
        ),
      enabled: !!destSchema && !!destTable,
      placeholderData: keepPreviousData,
    });

  const runs = data?.items ?? [];
  const latestRun = runs[0]; // default sort is lastChecked desc so first is most recent

  return (
    <div className="job-history">
      <nav className="navbar">
        <div className="breadcrumb">
          <a href="/" onClick={handleBreadcrumb} style={{ cursor: "pointer" }}>
            BCGW Replication Monitor
          </a>
          <span>
            {" "}
            &gt; {destSchema}.{destTable}
          </span>
        </div>
        <Button
          variant="secondary"
          size="small"
          onPress={() => refetch()}
          isDisabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh ⟳"}
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
          <h2 className="section-title">Job Details</h2>
          <table className="job-runs-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Source Schema</th>
                <th>Source Table</th>
                <th>Destination Schema</th>
                <th>Destination Table</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{latestRun.gateway}</td>
                <td>{latestRun.srcSchema}</td>
                <td>{latestRun.srcTable}</td>
                <td>{latestRun.destSchema}</td>
                <td>{latestRun.destTable}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="section-title">Run History</h2>
          <JobHistoryTable runs={runs} sort={sort} onSortChange={setSort} />
        </>
      )}
    </div>
  );
}
