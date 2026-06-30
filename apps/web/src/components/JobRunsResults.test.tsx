import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { JobRunsResults } from "./JobRunsResults";
import type { JobRun } from "../types/jobRun";

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

describe("JobRunsResults", () => {
  it("renders job runs", () => {
    render(
      <JobRunsResults
        data={mockData}
        isLoading={false}
        isError={false}
        search=""
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/TABLE_A/)).toBeInTheDocument();
    expect(screen.getByText(/TABLE_B/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <JobRunsResults
        data={undefined}
        isLoading={true}
        isError={false}
        search=""
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading job runs...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <JobRunsResults
        data={undefined}
        isLoading={false}
        isError={true}
        search=""
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Failed to load job runs")).toBeInTheDocument();
  });

  it("calls onSearchChange when user types in search box", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <JobRunsResults
        data={mockData}
        isLoading={false}
        isError={false}
        search=""
        onSearchChange={onSearchChange}
      />,
    );

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, "T");

    expect(onSearchChange).toHaveBeenCalled();
  });
});
