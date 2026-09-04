import type { JobRun } from "../types/jobRun";
import { useNavigate } from "react-router-dom";

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
  sort: { sortBy: string; sortDir: "asc" | "desc" };
  onSortChange: (sort: { sortBy: string; sortDir: "asc" | "desc" }) => void;
}

export function JobRunsResults({
  data,
  isLoading,
  isError,
  sort,
  onSortChange,
}: Props) {
  const navigate = useNavigate();

  const items = data?.items ?? [];

  const sortableClass = (field: string) =>
    `sortable ${sort.sortBy === field ? "sorted" : ""}`;

  const handleSort = (field: string) => {
    if (sort.sortBy === field) {
      // Toggle direction
      onSortChange({
        sortBy: field,
        sortDir: sort.sortDir === "asc" ? "desc" : "asc",
      });
    } else {
      // New column, default to asc
      onSortChange({ sortBy: field, sortDir: "asc" });
    }
  };

  const renderSortIcon = (field: string) => {
    if (sort.sortBy !== field) return null;
    return sort.sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div>
      {isLoading && <div>Loading job runs...</div>}
      {isError && <div>Failed to load job runs</div>}

      {items.length > 0 && (
        <div className="table-scroll">
          <table className="job-runs-table clickable-rows">
            {/* Status 
              Method
              Src 
              Src Table
              Dest Schema
              Dest Table
              Update Type
              Records Read
              Records Written
              Last Checked
              Last Converted */}
            <colgroup>
              <col style={{ width: "6rem" }} />
              <col style={{ width: "5rem" }} />
              <col />
              <col />
              <col />
              <col />
              <col style={{ width: "7rem" }} />
              <col style={{ width: "8rem" }} />
              <col style={{ width: "8rem" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "11%" }} />
            </colgroup>

            <thead>
              <tr>
                <th
                  onClick={() => handleSort("status")}
                  className={sortableClass("status")}
                >
                  Status{renderSortIcon("status")}
                </th>
                <th
                  onClick={() => handleSort("gateway")}
                  className={sortableClass("gateway")}
                >
                  Method{renderSortIcon("gateway")}
                </th>
                <th
                  onClick={() => handleSort("srcSchema")}
                  className={sortableClass("srcSchema")}
                >
                  Src Schema{renderSortIcon("srcSchema")}
                </th>
                <th
                  onClick={() => handleSort("srcTable")}
                  className={sortableClass("srcTable")}
                >
                  Src Table{renderSortIcon("srcTable")}
                </th>
                <th
                  onClick={() => handleSort("destSchema")}
                  className={sortableClass("destSchema")}
                >
                  Dest Schema{renderSortIcon("destSchema")}
                </th>
                <th
                  onClick={() => handleSort("destTable")}
                  className={sortableClass("destTable")}
                >
                  Dest Table{renderSortIcon("destTable")}
                </th>
                <th
                  onClick={() => handleSort("updateType")}
                  className={sortableClass("updateType")}
                >
                  Update Type{renderSortIcon("updateType")}
                </th>
                <th
                  onClick={() => handleSort("recordsRead")}
                  className={sortableClass("recordsRead")}
                >
                  Records Read{renderSortIcon("recordsRead")}
                </th>
                <th
                  onClick={() => handleSort("recordsWritten")}
                  className={sortableClass("recordsWritten")}
                >
                  Records Written{renderSortIcon("recordsWritten")}
                </th>
                <th
                  onClick={() => handleSort("lastChecked")}
                  className={sortableClass("lastChecked")}
                >
                  Last Checked{renderSortIcon("lastChecked")}
                </th>
                <th
                  onClick={() => handleSort("lastConverted")}
                  className={sortableClass("lastConverted")}
                >
                  Last Converted{renderSortIcon("lastConverted")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((job) => (
                <tr
                  key={`${job.destSchema}.${job.destTable}`}
                  onClick={() =>
                    window.open(
                      `/history/${encodeURIComponent(job.destSchema)}/${encodeURIComponent(job.destTable)}`,
                      "_blank",
                      "noopener noreferrer",
                    )
                  }
                >
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
        </div>
      )}
    </div>
  );
}
