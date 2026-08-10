import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdvancedFilters } from "./AdvancedFilters";

// Mock the schemas hook so tests don't hit the network
vi.mock("../hooks/useSchemas", () => ({
  useSchemas: () => ({ data: { schemas: ["SCHEMA_A", "SCHEMA_B"] } }),
}));

// React Aria components use ResizeObserver, which jsdom lacks — polyfill it.
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - test env polyfill
  global.ResizeObserver = ResizeObserverMock;
});

const emptyValue = {
  destSchema: null,
  lastCheckedFrom: null,
  lastCheckedTo: null,
};

const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
};

describe("AdvancedFilters", () => {
  it("renders the accordion expanded by default", () => {
    renderWithClient(<AdvancedFilters value={emptyValue} onChange={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: /advanced filters/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("expands to show schema and date controls", async () => {
    const user = userEvent.setup();

    renderWithClient(<AdvancedFilters value={emptyValue} onChange={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: /advanced filters/i });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Schema combobox
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    // Date pickers by their labels
    expect(screen.getByText("Last checked from")).toBeInTheDocument();
    expect(screen.getByText("Last checked to")).toBeInTheDocument();
  });

  it("calls onChange with selected schema", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithClient(
      <AdvancedFilters value={emptyValue} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: /advanced filters/i }));

    // Open the combobox via its chevron button (aria-label="Show suggestions")
    await user.click(screen.getByRole("button", { name: /show suggestions/i }));

    // Options render asynchronously, use findBy + role "option"
    const option = await screen.findByRole("option", { name: "SCHEMA_A" });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ destSchema: "SCHEMA_A" }),
    );
  });
});
