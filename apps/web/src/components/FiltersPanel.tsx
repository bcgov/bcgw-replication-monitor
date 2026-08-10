import {
  Accordion,
  AccordionGroup,
  Button,
  Checkbox,
  CheckboxGroup,
} from "@bcgov/design-system-react-components";

type Filters = {
  status: string[];
  gateway: string[];
  dbInstance: string[];
};

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onResetAll: () => void;
}

/**
 * Left sidebar filter panel.
 *
 * Contains checkbox filters inside a collapsible accordion.
 * Uses BC Gov design system components.
 */
export function FiltersPanel({ filters, onChange, onResetAll }: Props) {
  return (
    <aside className="filters-panel">
      <AccordionGroup defaultExpandedKeys={["jobs"]}>
        <Accordion id="jobs" label="Jobs">
          <div className="filter-groups">
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

            <Button variant="secondary" size="small" onPress={onResetAll}>
              Reset Filters
            </Button>
          </div>
        </Accordion>
      </AccordionGroup>
    </aside>
  );
}
