import { Button } from "@bcgov/design-system-react-components";

interface Counts {
  all: number;
  success: number;
  failed: number;
}

interface Props {
  counts: Counts;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

/**
 * Summary bar showing counts of filtered results by status.
 *
 * Clicking a badge updates the status filter
 */
export function SummaryBar({
  counts,
  selectedStatuses,
  onStatusChange,
}: Props) {
  const isAllActive =
    selectedStatuses.includes("success") && selectedStatuses.includes("failed");

  const isSuccessActive =
    selectedStatuses.includes("success") &&
    !selectedStatuses.includes("failed");

  const isFailedActive =
    selectedStatuses.includes("failed") &&
    !selectedStatuses.includes("success");

  return (
    <div className="summary-bar">
      <Button
        variant={isAllActive ? "primary" : "secondary"}
        size="small"
        onPress={() => onStatusChange(["success", "failed"])}
      >
        All ({counts.all})
      </Button>

      <Button
        variant="secondary"
        size="small"
        onPress={() => onStatusChange(["success"])}
        className={`summary-badge success ${isSuccessActive ? "active" : ""}`}
      >
        Successful ({counts.success})
      </Button>

      <Button
        variant="secondary"
        size="small"
        onPress={() => onStatusChange(["failed"])}
        className={`summary-badge failed ${isFailedActive ? "active" : ""}`}
      >
        Failed ({counts.failed})
      </Button>
    </div>
  );
}
