import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { JobHistoryPage } from "./JobHistoryPage";

// Control the API response
vi.mock("../api/client", () => ({
  apiFetch: vi.fn(),
}));
import { apiFetch } from "../api/client";

const renderPage = (schema: string, table: string) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/history/${schema}/${table}`]}>
        <Routes>
          <Route
            path="/history/:destSchema/:destTable"
            element={<JobHistoryPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("JobHistoryPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the summary and last-run badge for a job", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      items: [
        {
          srcSchema: "SRC_SCHEMA",
          srcTable: "TABLE_A",
          destSchema: "DEST_SCHEMA_A",
          destTable: "TABLE_A",
          status: "failed",
        },
      ],
    });

    renderPage("DEST_SCHEMA_A", "TABLE_A");

    // Summary fields appear
    expect(await screen.findByText("SRC_SCHEMA")).toBeInTheDocument();
    expect(screen.getByText("DEST_SCHEMA_A")).toBeInTheDocument();

    // Last-run badge reflects the latest run status
    const badge = screen.getByText(/failed/i).closest(".status-badge");
    expect(badge).toHaveTextContent(/failed/i);
  });

  it("shows an empty state when there is no history", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ items: [] });

    renderPage("NOPE", "NOTHING");

    expect(await screen.findByText(/No history found/i)).toBeInTheDocument();
  });

  it("has a breadcrumb link back to the dashboard", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      items: [
        {
          srcSchema: "S",
          srcTable: "T",
          destSchema: "DS",
          destTable: "DT",
          status: "success",
        },
      ],
    });

    renderPage("DS", "DT");

    const link = await screen.findByRole("link", {
      name: /BCGW Replication Monitor/i,
    });
    expect(link).toHaveAttribute("href", "/");
  });
});
