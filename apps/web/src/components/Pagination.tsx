import { Button } from "@bcgov/design-system-react-components";

interface Props {
  page: number; // 0-based current page
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls.
 *
 * Shows current range, total, and prev/next buttons.
 * Page is 0-based internally but displayed as 1-based.
 */
export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="pagination">
      <span className="pagination-info">
        {start}–{end} of {total}
      </span>

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
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
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
