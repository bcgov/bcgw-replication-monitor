import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { JobRunsResults } from "./JobRunsResults";

const mockData = {
  items: [
    {
      id: "1",
      srcTable: "TABLE_A",
      status: "success",
    },
    {
      id: "2",
      srcTable: "TABLE_B",
      status: "failed",
    },
  ],
  total: 2,
  limit: 50,
  offset: 0,
};

describe("JobRunsResults", () => {
  it("renders job runs", () => {
    render(
      <JobRunsResults data={mockData} isLoading={false} isError={false} />,
    );

    expect(screen.getByText(/TABLE_A/)).toBeInTheDocument();
    expect(screen.getByText(/TABLE_B/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <JobRunsResults data={undefined} isLoading={true} isError={false} />,
    );

    expect(screen.getByText("Loading job runs...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <JobRunsResults data={undefined} isLoading={false} isError={true} />,
    );

    expect(screen.getByText("Failed to load job runs")).toBeInTheDocument();
  });
});
