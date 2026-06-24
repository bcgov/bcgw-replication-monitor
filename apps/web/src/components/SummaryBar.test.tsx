import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SummaryBar } from "./SummaryBar";

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - test env polyfill
  global.ResizeObserver = ResizeObserverMock;
});

const counts = { all: 10, success: 7, failed: 3 };

describe("SummaryBar", () => {
  it("renders counts for all badges", () => {
    render(
      <SummaryBar
        counts={counts}
        selectedStatuses={["success", "failed"]}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/All \(10\)/)).toBeInTheDocument();
    expect(screen.getByText(/Successful \(7\)/)).toBeInTheDocument();
    expect(screen.getByText(/Failed \(3\)/)).toBeInTheDocument();
  });

  it("calls onStatusChange with both statuses when All is clicked", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(
      <SummaryBar
        counts={counts}
        selectedStatuses={["success"]}
        onStatusChange={onStatusChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /All/i }));

    expect(onStatusChange).toHaveBeenCalledWith(["success", "failed"]);
  });

  it("calls onStatusChange with success when Successful is clicked", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(
      <SummaryBar
        counts={counts}
        selectedStatuses={["success", "failed"]}
        onStatusChange={onStatusChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Successful/i }));

    expect(onStatusChange).toHaveBeenCalledWith(["success"]);
  });

  it("calls onStatusChange with failed when Failed is clicked", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    render(
      <SummaryBar
        counts={counts}
        selectedStatuses={["success", "failed"]}
        onStatusChange={onStatusChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Failed/i }));

    expect(onStatusChange).toHaveBeenCalledWith(["failed"]);
  });
});
