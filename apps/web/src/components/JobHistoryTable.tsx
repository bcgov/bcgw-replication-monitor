import type { JobRun } from "../types/jobRun";

interface Sort {
  sortBy: string;
  sortDir: "asc" | "desc";
}

interface Props {
  runs: JobRun[];
  sort: Sort;
  onSortChange: (sort: Sort) => void;
}

const COLUMNS: { key: string; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "updateType", label: "Update Type" },
  { key: "recordsRead", label: "Records Read" },
  { key: "recordsWritten", label: "Records Written" },
  { key: "lastChecked", label: "Last Checked" },
  { key: "lastConverted", label: "Last Converted" },
];

export function JobHistoryTable({ runs, sort, onSortChange }: Props) {
  const handleSort = (key: string) => {
    if (sort.sortBy === key) {
      // toggle direction
      onSortChange({
        sortBy: key,
        sortDir: sort.sortDir === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ sortBy: key, sortDir: "desc" });
    }
  };

  const renderSortIcon = (key: string) => {
    if (sort.sortBy !== key) return null;
    return sort.sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <table className="job-runs-table">
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th
              key={col.key}
              className={`sortable ${sort.sortBy === col.key ? "sorted" : ""}`}
              onClick={() => handleSort(col.key)}
            >
              {col.label}
              {renderSortIcon(col.key)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {runs.map((run, i) => (
          <tr key={i}>
            <td>
              <span className={`status-badge status-${run.status}`}>
                {run.status}
              </span>
            </td>
            <td>{run.updateType}</td>
            <td>{run.recordsRead ?? "—"}</td>
            <td>{run.recordsWritten ?? "—"}</td>
            <td>{new Date(run.lastChecked).toLocaleString()}</td>
            <td>{new Date(run.lastConverted).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
