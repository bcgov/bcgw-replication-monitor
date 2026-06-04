import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { FakeJobRunRepository } from "../adapters/FakeJobRunRepository";

const repo = new FakeJobRunRepository();
const app = createApp(repo);

describe("GET /api/job-runs", () => {
  it("returns all job runs", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("filters by status", async () => {
    const res = await request(app).get("/api/job-runs?status=success");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("success");
  });

  it("filters by search term", async () => {
    const res = await request(app).get("/api/job-runs?search=TABLE_A");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].srcTable).toBe("TABLE_A");
  });

  it("returns 400 for invalid status", async () => {
    const res = await request(app).get("/api/job-runs?status=invalid");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query");
  });

  it("returns dates as ISO strings", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.body[0].lastChecked).toBe("2024-01-15T10:00:00.000Z");
    expect(res.body[0].lastConverted).toBe("2024-01-15T09:55:00.000Z");
  });

  it("filters by gateway", async () => {
    const res = await request(app).get("/api/job-runs?gateway=fme");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].gateway).toBe("fme");
  });

  it("filters by dbInstance", async () => {
    const res = await request(app).get("/api/job-runs?dbInstance=dlv");

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every((r: { dbInstance: string }) => r.dbInstance === "dlv"),
    ).toBe(true);
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
});
