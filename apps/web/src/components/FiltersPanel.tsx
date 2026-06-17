import {
  Accordion,
  AccordionGroup,
  Button,
  Checkbox,
  CheckboxGroup,
} from "@bcgov/design-system-react-components";
import { DEFAULT_FILTERS } from "../constants/filterDefaults";

type Filters = {
  status: string[];
  gateway: string[];
  dbInstance: string[];
};

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

/**
 * Left sidebar filter panel.
 *
 * Contains checkbox filters inside a collapsible accordion.
 * Uses BC Gov design system components.
 */
export function FiltersPanel({ filters, onChange }: Props) {
  return (
    <aside
      style={{
        width: "250px",
        borderRight: "1px solid #ddd",
        padding: "1rem",
      }}
    >
      <AccordionGroup defaultExpandedKeys={["jobs"]}>
        <Accordion id="jobs" label="Jobs">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <CheckboxGroup
              label="Method"
              value={filters.gateway}
              onChange={(value: string[]) =>
                onChange({ ...filters, gateway: value })
              }
            >
              <span title="Oracle Materialized View">
                <Checkbox value="oracle">MVW</Checkbox>
              </span>

              <Checkbox value="fme">FME</Checkbox>

              <Checkbox value="sdr">SDR</Checkbox>
            </CheckboxGroup>

            <CheckboxGroup
              label="Status"
              value={filters.status}
              onChange={(value: string[]) =>
                onChange({ ...filters, status: value })
              }
            >
              <Checkbox value="success">Successful</Checkbox>
              <Checkbox value="failed">Failed</Checkbox>
            </CheckboxGroup>

            <CheckboxGroup
              label="Database"
              value={filters.dbInstance}
              onChange={(value: string[]) =>
                onChange({ ...filters, dbInstance: value })
              }
            >
              <Checkbox value="test">Test</Checkbox>
              <Checkbox value="prod">Prod</Checkbox>
            </CheckboxGroup>

            <Button
              variant="secondary"
              size="small"
              onPress={() => onChange(DEFAULT_FILTERS)}
              style={{ marginTop: "1rem" }}
            >
              Reset Filters
            </Button>
          </div>
        </Accordion>
      </AccordionGroup>
    </aside>
  );
}
