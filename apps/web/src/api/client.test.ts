import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, ForbiddenError } from "./client";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws ForbiddenError on 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      }),
    );

    await expect(apiFetch("/job-runs")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws generic error on other failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
      }),
    );

    await expect(apiFetch("/job-runs")).rejects.toThrow("API error: 500");
  });

  it("returns json on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      }),
    );

    const result = await apiFetch("/job-runs");
    expect(result).toEqual({ items: [] });
  });
});
