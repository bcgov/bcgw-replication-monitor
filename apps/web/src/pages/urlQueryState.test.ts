import { describe, it, expect } from "vitest";
import { parseQueryState, toSearchParams } from "./urlQueryState";
import { DEFAULT_FILTERS } from "../constants/filterDefaults";

describe("parseQueryState", () => {
  it("returns defaults for a bare URL", () => {
    const state = parseQueryState(new URLSearchParams(""));
    expect(state.filters.gateway).toEqual(DEFAULT_FILTERS.gateway);
    expect(state.filters.status).toEqual(DEFAULT_FILTERS.status);
    expect(state.filters.dbInstance).toEqual(DEFAULT_FILTERS.dbInstance);
    expect(state.page).toBe(0);
    expect(state.sort).toEqual({ sortBy: "lastChecked", sortDir: "desc" });
  });

  it("parses valid params", () => {
    const params = new URLSearchParams();
    params.append("status", "success");
    params.append("gateway", "fme");
    params.set("sortBy", "recordsRead");
    params.set("sortDir", "asc");
    params.set("page", "3");

    const state = parseQueryState(params);
    expect(state.filters.status).toEqual(["success"]);
    expect(state.filters.gateway).toEqual(["fme"]);
    expect(state.sort).toEqual({ sortBy: "recordsRead", sortDir: "asc" });
    expect(state.page).toBe(3);
  });

  it("ignores invalid enum values", () => {
    const params = new URLSearchParams();
    params.append("status", "banana");
    params.append("status", "success");
    params.append("gateway", "xyz");

    const state = parseQueryState(params);
    expect(state.filters.status).toEqual(["success"]); // banana dropped
    expect(state.filters.gateway).toEqual([]); // xyz dropped
  });

  it("falls back to defaults for invalid sort and page", () => {
    const params = new URLSearchParams();
    params.set("sortBy", "nope");
    params.set("sortDir", "sideways");
    params.set("page", "-5");

    const state = parseQueryState(params);
    expect(state.sort).toEqual({ sortBy: "lastChecked", sortDir: "desc" });
    expect(state.page).toBe(0);
  });

  it("ignores invalid dates", () => {
    const params = new URLSearchParams();
    params.set("lastCheckedFrom", "notadate");
    params.set("sortBy", "status"); // makes it an explicit view

    const state = parseQueryState(params);
    expect(state.advanced.lastCheckedFrom).toBeNull();
  });

  it("respects empty filters when the view is explicit", () => {
    // sortBy present → explicit view → empty gateway stays empty
    const params = new URLSearchParams();
    params.set("sortBy", "status");

    const state = parseQueryState(params);
    expect(state.filters.gateway).toEqual([]); // NOT defaults
  });
});

describe("toSearchParams", () => {
  it("round-trips through parseQueryState", () => {
    const params = new URLSearchParams();
    params.append("status", "failed");
    params.append("gateway", "oracle");
    params.set("search", "abc");
    params.set("sortBy", "recordsRead");
    params.set("sortDir", "asc");
    params.set("page", "2");

    const state = parseQueryState(params);
    const back = parseQueryState(toSearchParams(state));

    expect(back).toEqual(state); // round-trip preserves state
  });
});
