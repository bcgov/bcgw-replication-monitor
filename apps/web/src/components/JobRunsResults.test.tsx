import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { JobRunsResults } from "./JobRunsResults";

const mockData = [
  { id: "1", srcTable: "Job A", status: "SUCCESS" },
  { id: "2", srcTable: "Job B", status: "FAILED" },
];

describe("JobRunsResults", () => {
  it("renders job runs", () => {
    render(
      <JobRunsResults data={mockData} isLoading={false} isError={false} />,
    );

    expect(screen.getByText(/Job A/)).toBeInTheDocument();
    expect(screen.getByText(/Job B/)).toBeInTheDocument();
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
