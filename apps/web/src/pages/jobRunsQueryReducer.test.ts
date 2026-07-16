import { describe, it, expect } from "vitest";
import { jobRunsQueryReducer, initialQueryState } from "./jobRunsQueryReducer";

describe("jobRunsQueryReducer", () => {
  it("sets filters and resets page to 0", () => {
    const state = { ...initialQueryState, page: 3 };

    const next = jobRunsQueryReducer(state, {
      type: "SET_FILTERS",
      payload: { status: ["success"], gateway: [], dbInstance: [] },
    });

    expect(next.filters.status).toEqual(["success"]);
    expect(next.page).toBe(0);
  });

  it("sets search and resets page to 0", () => {
    const state = { ...initialQueryState, page: 5 };

    const next = jobRunsQueryReducer(state, {
      type: "SET_SEARCH",
      payload: "TABLE_A",
    });

    expect(next.search).toBe("TABLE_A");
    expect(next.page).toBe(0);
  });

  it("sets sort and resets page to 0", () => {
    const state = { ...initialQueryState, page: 2 };

    const next = jobRunsQueryReducer(state, {
      type: "SET_SORT",
      payload: { sortBy: "status", sortDir: "asc" },
    });

    expect(next.sort).toEqual({ sortBy: "status", sortDir: "asc" });
    expect(next.page).toBe(0);
  });

  it("sets page without resetting other state", () => {
    const state = {
      ...initialQueryState,
      search: "keep-me",
      page: 0,
    };

    const next = jobRunsQueryReducer(state, {
      type: "SET_PAGE",
      payload: 4,
    });

    expect(next.page).toBe(4);
    expect(next.search).toBe("keep-me"); // unchanged
  });

  it("sets advanced filters and resets page to 0", () => {
    const state = { ...initialQueryState, page: 4 };

    const next = jobRunsQueryReducer(state, {
      type: "SET_ADVANCED_FILTERS",
      payload: {
        destSchema: "SCHEMA_A",
        lastCheckedFrom: "2024-01-15",
        lastCheckedTo: "2024-01-20",
      },
    });

    expect(next.advanced.destSchema).toBe("SCHEMA_A");
    expect(next.advanced.lastCheckedFrom).toBe("2024-01-15");
    expect(next.advanced.lastCheckedTo).toBe("2024-01-20");
    expect(next.page).toBe(0); // reset
  });
});
