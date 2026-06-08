import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { FakeJobRunRepository } from "../adapters/FakeJobRunRepository";

const repo = new FakeJobRunRepository();
const app = createApp(repo);

describe("GET /api/job-runs", () => {
  it("returns all job runs with pagination metadata", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.limit).toBe(50);
    expect(res.body.offset).toBe(0);
  });

  it("filters by status", async () => {
    const res = await request(app).get("/api/job-runs?status=success");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].status).toBe("success");
    expect(res.body.total).toBe(1);
  });

  it("filters by search term", async () => {
    const res = await request(app).get("/api/job-runs?search=TABLE_A");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].srcTable).toBe("TABLE_A");
  });

  it("filters by gateway", async () => {
    const res = await request(app).get("/api/job-runs?gateway=fme");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].gateway).toBe("fme");
  });

  it("filters by dbInstance", async () => {
    const res = await request(app).get("/api/job-runs?dbInstance=dlv");

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(
      res.body.items.every(
        (r: { dbInstance: string }) => r.dbInstance === "dlv",
      ),
    ).toBe(true);
  });

  it("paginates with limit", async () => {
    const res = await request(app).get("/api/job-runs?limit=1");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.limit).toBe(1);
  });

  it("paginates with offset", async () => {
    const res = await request(app).get("/api/job-runs?limit=1&offset=1");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.offset).toBe(1);
  });

  it("returns empty items when offset exceeds total", async () => {
    const res = await request(app).get("/api/job-runs?offset=100");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(2);
  });

  it("sorts by status ascending", async () => {
    const res = await request(app).get(
      "/api/job-runs?sortBy=status&sortDir=asc",
    );

    expect(res.status).toBe(200);
    const statuses = res.body.items.map((r: { status: string }) => r.status);
    expect(statuses).toEqual([...statuses].sort());
  });

  it("sorts by status descending", async () => {
    const res = await request(app).get(
      "/api/job-runs?sortBy=status&sortDir=desc",
    );

    expect(res.status).toBe(200);
    const statuses = res.body.items.map((r: { status: string }) => r.status);
    expect(statuses).toEqual([...statuses].sort().reverse());
  });

  it("defaults to sorting by lastConverted desc", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.status).toBe(200);
    const dates = res.body.items.map(
      (r: { lastConverted: string }) => r.lastConverted,
    );
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("returns dates as ISO strings", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.body.items[0].lastChecked).toBe("2024-01-15T10:00:00.000Z");
    expect(res.body.items[0].lastConverted).toBe("2024-01-15T09:55:00.000Z");
  });

  it("returns 400 for invalid status", async () => {
    const res = await request(app).get("/api/job-runs?status=invalid");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query");
  });

  it("returns 400 for invalid gateway", async () => {
    const res = await request(app).get("/api/job-runs?gateway=invalid");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query");
  });

  it("returns 400 for invalid dbInstance", async () => {
    const res = await request(app).get("/api/job-runs?dbInstance=invalid");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query");
  });

  it("returns 400 for invalid sortBy", async () => {
    const res = await request(app).get("/api/job-runs?sortBy=invalid");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query");
  });

  it("returns 400 for invalid sortDir", async () => {
    const res = await request(app).get("/api/job-runs?sortDir=invalid");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query");
  });
});
