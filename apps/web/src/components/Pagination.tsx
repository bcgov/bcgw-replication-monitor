import { Button, Select } from "@bcgov/design-system-react-components";
import { ALLOWED_PAGE_SIZES } from "../constants/filterDefaults";
import { useState } from "react";

interface Props {
  page: number; // 0-based current page
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Pagination controls.
 *
 * Shows current range, total, and prev/next buttons.
 * Page is 0-based internally but displayed as 1-based.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const [pageInput, setPageInput] = useState(String(page + 1));

  // Re-sync the input when the page changes elsewhere (Previous/Next, filter
  // change resetting to page 0, URL navigation). Adjusting state during render
  const [prevPage, setPrevPage] = useState(page);

  if (page !== prevPage) {
    setPrevPage(page);
    setPageInput(String(page + 1));
  }

  const commitPageInput = () => {
    const requested = Number(pageInput);

    if (!Number.isInteger(requested) || requested < 1 || totalPages === 0) {
      setPageInput(String(page + 1)); // revert
      return;
    }

    const clamped = Math.min(requested, totalPages);
    setPageInput(String(clamped));

    if (clamped - 1 !== page) {
      onPageChange(clamped - 1);
    }
  };

  return (
    <div className="pagination">
      <div className="pagination-left">
        <Select
          size="small"
          aria-label="Rows per page"
          items={ALLOWED_PAGE_SIZES.map((size) => ({
            id: String(size),
            label: String(size),
          }))}
          value={String(pageSize)}
          onChange={(key) => key != null && onPageSizeChange(Number(key))}
        />
        <span className="pagination-info">
          {start}–{end} of {total}
        </span>
      </div>

      <div className="pagination-controls">
        <Button
          variant="secondary"
          size="small"
          isDisabled={!canPrev}
          onPress={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        <span className="pagination-page">
          Page{" "}
          <input
            className="pagination-page-input"
            type="text"
            inputMode="numeric"
            aria-label="Page number"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={commitPageInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitPageInput();
                e.currentTarget.blur();
              }
            }}
            disabled={totalPages === 0}
          />{" "}
          of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="small"
          isDisabled={!canNext}
          onPress={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
