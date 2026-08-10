import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FiltersPanel } from "./FiltersPanel";
import { DEFAULT_FILTERS } from "../constants/filterDefaults";

// mock ResizeObserver (needed for design system / radix-style components)
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - test env polyfill
  global.ResizeObserver = ResizeObserverMock;
});

describe("FiltersPanel", () => {
  it("renders filter groups", () => {
    render(
      <FiltersPanel
        filters={DEFAULT_FILTERS}
        onChange={vi.fn()}
        onResetAll={vi.fn()}
      />,
    );

    expect(screen.getByText("Method")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
  });

  it("applies default checked values", () => {
    render(
      <FiltersPanel
        filters={DEFAULT_FILTERS}
        onChange={vi.fn()}
        onResetAll={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("FME")).toBeChecked();
    expect(screen.getByLabelText("MVW")).toBeChecked();
    expect(screen.getByLabelText("SDR")).toBeChecked();

    expect(screen.getByLabelText("Successful")).toBeChecked();
    expect(screen.getByLabelText("Failed")).toBeChecked();

    expect(screen.getByLabelText("Prod")).toBeChecked();
  });

  it("calls onChange when a checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <FiltersPanel
        filters={DEFAULT_FILTERS}
        onChange={onChange}
        onResetAll={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("FME"));

    expect(onChange).toHaveBeenCalled();
  });

  it("resets filters when clicking reset button", async () => {
    const user = userEvent.setup();
    const onResetAll = vi.fn();

    render(
      <FiltersPanel
        filters={{ ...DEFAULT_FILTERS, gateway: [] }}
        onChange={vi.fn()}
        onResetAll={onResetAll}
      />,
    );

    await user.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(onResetAll).toHaveBeenCalled();
  });
});
