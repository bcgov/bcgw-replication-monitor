import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { JobRunsResults } from "./JobRunsResults";
import type { JobRun } from "../types/jobRun";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const mockItems: JobRun[] = [
  {
    gateway: "fme",
    enabled: true,
    srcHost: "src-host-1",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_A",
    destHost: "dest-host-1",
    destSchema: "DEST_SCHEMA",
    destTable: "TABLE_A",
    lastChecked: "2024-01-15T10:00:00.000Z",
    lastConverted: "2024-01-15T09:55:00.000Z",
    status: "success",
    updateType: "full",
    recordsRead: 1000,
    recordsWritten: 1000,
    dbInstance: "prod",
    logFilename: "fme_table_a.log",
  },
  {
    gateway: "mvw",
    enabled: true,
    srcHost: "src-host-2",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_B",
    destHost: "dest-host-2",
    destSchema: "DEST_SCHEMA",
    destTable: "TABLE_B",
    lastChecked: "2024-01-15T10:05:00.000Z",
    lastConverted: "2024-01-15T09:50:00.000Z",
    status: "failed",
    updateType: "incremental",
    recordsRead: 500,
    recordsWritten: 0,
    dbInstance: "test",
    logFilename: "oracle_table_b.log",
  },
];

const mockData = {
  items: mockItems,
  total: 2,
  counts: { all: 2, success: 1, failed: 1 },
  limit: 50,
  offset: 0,
};

const defaultSort = { sortBy: "lastChecked", sortDir: "desc" as const };

describe("JobRunsResults", () => {
  it("renders job runs table", () => {
    renderWithRouter(
      <JobRunsResults
        data={mockData}
        isLoading={false}
        isError={false}
        sort={defaultSort}
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText("TABLE_A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TABLE_B").length).toBeGreaterThan(0);
    expect(screen.getByText("fme")).toBeInTheDocument();
    expect(screen.getByText("mvw")).toBeInTheDocument();
  });

  it("defaults a newly selected column to descending", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    renderWithRouter(
      <JobRunsResults
        data={mockData}
        isLoading={false}
        isError={false}
        sort={{ sortBy: "lastChecked", sortDir: "desc" }} // active = lastChecked
        onSortChange={onSortChange}
      />,
    );

    // Click a DIFFERENT (new) column should default to desc
    await user.click(screen.getByText(/Records Read/i));

    expect(onSortChange).toHaveBeenCalledWith({
      sortBy: "recordsRead",
      sortDir: "desc",
    });
  });

  it("toggles direction when the active column is clicked", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    renderWithRouter(
      <JobRunsResults
        data={mockData}
        isLoading={false}
        isError={false}
        sort={{ sortBy: "lastChecked", sortDir: "desc" }}
        onSortChange={onSortChange}
      />,
    );

    // Click the ACTIVE column, toggles desc to asc
    await user.click(screen.getByText(/Last Checked/i));

    expect(onSortChange).toHaveBeenCalledWith({
      sortBy: "lastChecked",
      sortDir: "asc",
    });
  });

  it("shows loading state", () => {
    renderWithRouter(
      <JobRunsResults
        data={undefined}
        isLoading={true}
        isError={false}
        sort={defaultSort}
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading job runs...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    renderWithRouter(
      <JobRunsResults
        data={undefined}
        isLoading={false}
        isError={true}
        sort={defaultSort}
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Failed to load job runs")).toBeInTheDocument();
  });

  it("displays status with badge", () => {
    renderWithRouter(
      <JobRunsResults
        data={mockData}
        isLoading={false}
        isError={false}
        sort={defaultSort}
        onSortChange={vi.fn()}
      />,
    );

    const successBadge = screen.getByText("success");
    const failedBadge = screen.getByText("failed");

    expect(successBadge).toHaveClass("status-success");
    expect(failedBadge).toHaveClass("status-failed");
  });

  it("opens the job history in a new tab on row click", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderWithRouter(
      <JobRunsResults
        data={mockData}
        isLoading={false}
        isError={false}
        sort={defaultSort}
        onSortChange={vi.fn()}
      />,
    );

    // Click the first data row
    const firstRow = screen.getByText("fme").closest("tr");
    await user.click(firstRow!);

    expect(openSpy).toHaveBeenCalledWith(
      "/history/DEST_SCHEMA/TABLE_A",
      "_blank",
      "noopener noreferrer",
    );

    openSpy.mockRestore();
  });
});
