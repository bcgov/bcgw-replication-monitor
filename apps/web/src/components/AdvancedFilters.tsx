import {
  Accordion,
  AccordionGroup,
  DatePicker,
} from "@bcgov/design-system-react-components";
import {
  ComboBox,
  Label,
  Input,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
} from "react-aria-components";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { useSchemas } from "../hooks/useSchemas";
import type { AdvancedFilters as AdvancedFiltersType } from "../pages/jobRunsQueryReducer";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";

/**
 * Converts a stored ISO date string into a React Aria CalendarDate.
 *
 * The reducer stores dates as ISO strings (e.g. "2024-01-15") while the
 * BC Gov DatePicker (React Aria) works with CalendarDate objects, so we
 * convert at the boundary.
 *
 * - Empty/null input returns null (no date selected, so no filter)
 * - Takes only the date part (slice 0-10) in case a full timestamp is stored
 */
function toCalendarDate(iso: string | null): CalendarDate | null {
  if (!iso) return null;
  try {
    return parseDate(iso.slice(0, 10));
  } catch {
    return null;
  }
}

interface Props {
  value: AdvancedFiltersType;
  onChange: (value: AdvancedFiltersType) => void;
}

/**
 * Advanced filters panel (collapsible, folded by default).
 *
 * - Schema combo box to searchable/typeable, filters by dest_schema
 * - (Date pickers added next)
 */
export function AdvancedFilters({ value, onChange }: Props) {
  const { data } = useSchemas();
  const schemas = data?.schemas ?? [];

  return (
    <div className="advanced-filters">
      <AccordionGroup expandedKeys={["advanced"]}>
        <Accordion id="advanced" label="Advanced Filters">
          <div className="advanced-filters-content">
            <div className="date-filters">
              <DatePicker
                showFormatHelpText={false}
                label="Last checked from"
                value={toCalendarDate(value.lastCheckedFrom)}
                onChange={(date) =>
                  onChange({
                    ...value,
                    lastCheckedFrom: date ? date.toString() : null,
                  })
                }
              />

              <DatePicker
                label="Last checked to"
                showFormatHelpText={false}
                value={toCalendarDate(value.lastCheckedTo)}
                onChange={(date) =>
                  onChange({
                    ...value,
                    lastCheckedTo: date ? date.toString() : null,
                  })
                }
              />
            </div>
            <ComboBox
              className="schema-combobox"
              selectedKey={value.destSchema ?? null}
              onSelectionChange={(key) =>
                onChange({
                  ...value,
                  destSchema: key != null ? String(key) : null,
                })
              }
            >
              <Label>Schema</Label>
              <div className="schema-combobox-field">
                <Input placeholder="All schemas" />
                <Button>
                  <ChevronDownIcon />
                </Button>
              </div>
              <Popover className="schema-combobox-popover">
                <ListBox>
                  {schemas.map((schema) => (
                    <ListBoxItem key={schema} id={schema}>
                      {schema}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Popover>
            </ComboBox>
          </div>
        </Accordion>
      </AccordionGroup>
    </div>
  );
}
