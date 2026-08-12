import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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
    gateway: "oracle",
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
    expect(screen.getByText("oracle")).toBeInTheDocument();
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

  it("navigates to history page on row click", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <JobRunsResults
                data={mockData}
                isLoading={false}
                isError={false}
                sort={defaultSort}
                onSortChange={vi.fn()}
              />
            }
          />
          <Route
            path="/history/:destSchema/:destTable"
            element={<div>History Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    // Click the first data row
    const firstRow = screen.getByText("fme").closest("tr");
    await user.click(firstRow!);

    expect(screen.getByText("History Page")).toBeInTheDocument();
  });
});
