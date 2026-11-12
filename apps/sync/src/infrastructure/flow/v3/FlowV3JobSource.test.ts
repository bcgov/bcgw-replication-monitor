import { describe, it, expect, vi } from "vitest";
import page from "./__fixtures__/completed-page.json";
import params from "./__fixtures__/workspace-parameters.json";
import { FlowApiError, FlowV3JobSource } from "./FlowV3JobSource";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const make = (fetchFn: typeof fetch) => {
  const sleep = vi.fn(async () => {});
  const src = new FlowV3JobSource(
    { baseUrl: "http://flow.test/fmerest/v3/", token: "secret-token" },
    fetchFn,
    sleep,
  );
  return { src, sleep };
};

describe("FlowV3JobSource", () => {
  it("calls the completed-jobs endpoint with the token and maps the page", async () => {
    const fetchFn = vi.fn(async () => json(page));
    const { src } = make(fetchFn as unknown as typeof fetch);

    const result = await src.getCompletedJobs(0, 2);

    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "http://flow.test/fmerest/v3/transformations/jobs/completed?offset=0&limit=2",
    );
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "fmetoken token=secret-token",
    );
    expect(result.totalCount).toBe(2);
    expect(result.items.map((j) => j.id)).toEqual([1001, 1000]);
  });

  it("encodes the workspace path and returns defaults", async () => {
    const fetchFn = vi.fn(async () => json(params));
    const { src } = make(fetchFn as unknown as typeof fetch);

    const defaults = await src.getWorkspaceDefaults("MY REPO", "a b.fmw");

    const [url] = fetchFn.mock.calls[0] as unknown as [string];
    expect(url).toBe(
      "http://flow.test/fmerest/v3/repositories/MY%20REPO/items/a%20b.fmw/parameters",
    );
    expect(defaults.DEST_DB_ENV_KEY).toBe("DLV");
  });

  it("retries after a network error, then succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new TypeError("fetch failed"), {
          cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
        }),
      )
      .mockResolvedValueOnce(json(page));
    const { src, sleep } = make(fetchFn as unknown as typeof fetch);

    const result = await src.getCompletedJobs(0, 2);

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1000);
    expect(result.items).toHaveLength(2);
  });

  it("does not retry on 401", async () => {
    const fetchFn = vi.fn(async () => json({ message: "unauthorized" }, 401));
    const { src } = make(fetchFn as unknown as typeof fetch);

    await expect(src.getCompletedJobs(0, 2)).rejects.toMatchObject({
      status: 401,
      retryable: false,
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("gives up after max attempts on 503", async () => {
    const fetchFn = vi.fn(async () => json({}, 503));
    const { src, sleep } = make(fetchFn as unknown as typeof fetch);

    await expect(src.getCompletedJobs(0, 2)).rejects.toBeInstanceOf(
      FlowApiError,
    );
    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000, 4000]);
  });

  it("fails without retrying when the response shape is wrong", async () => {
    const fetchFn = vi.fn(async () => json({ unexpected: true }));
    const { src } = make(fetchFn as unknown as typeof fetch);

    await expect(src.getCompletedJobs(0, 2)).rejects.toMatchObject({
      retryable: false,
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("never puts the token in error messages", async () => {
    const fetchFn = vi.fn(async () => json({}, 500));
    const { src } = make(fetchFn as unknown as typeof fetch);

    const err = await src.getCompletedJobs(0, 2).catch((e: Error) => e);
    expect(String(err.message)).not.toContain("secret-token");
  });
});
