import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { JobHistoryTable } from "./JobHistoryTable";
import type { JobRun } from "../types/jobRun";

const mockRuns: JobRun[] = [
  {
    gateway: "fme",
    enabled: true,
    srcHost: "h",
    srcSchema: "SRC",
    srcTable: "TABLE_A",
    destHost: "h",
    destSchema: "DEST_A",
    destTable: "TABLE_A",
    lastChecked: "2024-01-15T10:00:00.000Z",
    lastConverted: "2024-01-15T09:55:00.000Z",
    status: "success",
    updateType: "full",
    recordsRead: 1000,
    recordsWritten: 1000,
    dbInstance: "prod",
    logFilename: "a.log",
  },
  {
    gateway: "fme",
    enabled: true,
    srcHost: "h",
    srcSchema: "SRC",
    srcTable: "TABLE_A",
    destHost: "h",
    destSchema: "DEST_A",
    destTable: "TABLE_A",
    lastChecked: "2024-01-14T10:00:00.000Z",
    lastConverted: "2024-01-14T09:55:00.000Z",
    status: "failed",
    updateType: "incremental",
    recordsRead: 500,
    recordsWritten: 0,
    dbInstance: "prod",
    logFilename: "b.log",
  },
];

const defaultSort = { sortBy: "lastChecked", sortDir: "desc" as const };

describe("JobHistoryTable", () => {
  it("renders a row for each run", () => {
    render(
      <JobHistoryTable
        runs={mockRuns}
        sort={defaultSort}
        onSortChange={vi.fn()}
      />,
    );

    // Two runs → two status badges
    expect(screen.getByText("success")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  it("calls onSortChange when a header is clicked", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(
      <JobHistoryTable
        runs={mockRuns}
        sort={defaultSort}
        onSortChange={onSortChange}
      />,
    );

    await user.click(screen.getByText(/Records Read/i));

    expect(onSortChange).toHaveBeenCalledWith({
      sortBy: "recordsRead",
      sortDir: "desc",
    });
  });

  it("toggles direction when the active sort header is clicked", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(
      <JobHistoryTable
        runs={mockRuns}
        sort={defaultSort}
        onSortChange={onSortChange}
      />,
    );

    // lastChecked is the active sort (desc) so clicking toggles to asc
    await user.click(screen.getByText(/Last Checked/i));

    expect(onSortChange).toHaveBeenCalledWith({
      sortBy: "lastChecked",
      sortDir: "asc",
    });
  });
});
