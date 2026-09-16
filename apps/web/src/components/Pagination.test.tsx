import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("shows the current range and total", () => {
    render(
      <Pagination
        page={0}
        pageSize={20}
        total={100}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/1.*20.*of.*100/)).toBeInTheDocument();
    expect(screen.getByLabelText(/page number/i)).toHaveValue("1");
  });

  it("disables Previous on the first page", () => {
    render(
      <Pagination
        page={0}
        pageSize={20}
        total={100}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("changes page size", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        page={0}
        pageSize={20}
        total={100}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /rows per page/i }));
    await user.click(screen.getByRole("option", { name: "50" }));

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("jumps to a typed page on Enter", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        page={0}
        pageSize={20}
        total={100}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/page number/i);
    await user.clear(input);
    await user.type(input, "3{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("clamps a page number beyond the last page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        page={0}
        pageSize={20}
        total={100}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/page number/i);
    await user.clear(input);
    await user.type(input, "999{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
