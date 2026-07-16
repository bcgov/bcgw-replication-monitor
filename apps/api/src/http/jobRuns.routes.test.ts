import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { FakeJobRunRepository } from "../adapters/FakeJobRunRepository";

const repo = new FakeJobRunRepository();
const app = createApp(repo);

/*
 * Test suite for job runs API
 */
describe("GET /api/job-runs", () => {
  it("returns all job runs with pagination metadata", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.limit).toBe(50);
    expect(res.body.offset).toBe(0);
  });

  it("filters by single status", async () => {
    const res = await request(app).get("/api/job-runs?status=success");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].status).toBe("success");
  });

  it("filters by multiple statuses", async () => {
    const res = await request(app).get(
      "/api/job-runs?status=success&status=failed",
    );

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });

  it("filters by destTable", async () => {
    const res = await request(app).get("/api/job-runs?search=TABLE_A");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].destTable).toBe("TABLE_A");
  });

  it("filters by logFilename", async () => {
    const res = await request(app).get("/api/job-runs?search=fme_table_a");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].logFilename).toContain("fme_table_a");
  });

  it("search no longer matches srcSchema", async () => {
    // SRC_SCHEMA exists in data but should not match (search only covers destTable + logFilename)
    const res = await request(app).get("/api/job-runs?search=SRC_SCHEMA");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it("filters by single gateway", async () => {
    const res = await request(app).get("/api/job-runs?gateway=fme");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].gateway).toBe("fme");
  });

  it("filters by multiple gateways", async () => {
    const res = await request(app).get(
      "/api/job-runs?gateway=fme&gateway=oracle",
    );

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });

  it("filters by single dbInstance", async () => {
    const res = await request(app).get("/api/job-runs?dbInstance=prod");

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(
      res.body.items.every(
        (r: { dbInstance: string }) => r.dbInstance === "prod",
      ),
    ).toBe(true);
  });

  it("filters by multiple dbInstances", async () => {
    const res = await request(app).get(
      "/api/job-runs?dbInstance=prod&dbInstance=test",
    );

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
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

  it("defaults to sorting by lastChecked desc", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.status).toBe(200);
    const dates = res.body.items.map(
      (r: { lastChecked: string }) => r.lastChecked,
    );
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("returns dates as ISO strings", async () => {
    const res = await request(app).get("/api/job-runs");

    // Find a specific row
    const row = res.body.items.find(
      (r: { lastChecked: string }) =>
        r.lastChecked === "2024-01-15T10:00:00.000Z",
    );

    expect(row).toBeDefined();
    expect(row.lastConverted).toBe("2024-01-15T09:55:00.000Z");
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

  it("returns counts in response", async () => {
    const res = await request(app).get("/api/job-runs");

    expect(res.status).toBe(200);
    expect(res.body.counts).toBeDefined();
    expect(res.body.counts.all).toBe(2);
    expect(res.body.counts.success).toBe(1);
    expect(res.body.counts.failed).toBe(1);
  });

  it("counts ignore the status filter", async () => {
    // Filter by only "success" — counts should still show both
    const res = await request(app).get("/api/job-runs?status=success");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.counts.all).toBe(2);
    expect(res.body.counts.success).toBe(1);
    expect(res.body.counts.failed).toBe(1);
  });

  it("counts respect non-status filters", async () => {
    const res = await request(app).get("/api/job-runs?gateway=fme");

    expect(res.status).toBe(200);
    expect(res.body.counts.all).toBe(1);
    expect(res.body.counts.success).toBe(1);
    expect(res.body.counts.failed).toBe(0);
  });
});

/*
 * Test suite for schemas API
 */
describe("GET /api/schemas", () => {
  it("returns distinct schemas", async () => {
    const res = await request(app).get("/api/schemas");

    expect(res.status).toBe(200);
    expect(res.body.schemas).toBeDefined();
    expect(Array.isArray(res.body.schemas)).toBe(true);
  });

  it("returns schemas sorted alphabetically", async () => {
    const res = await request(app).get("/api/schemas");

    const schemas = res.body.schemas;
    expect(schemas).toEqual([...schemas].sort());
  });

  it("returns no duplicate schemas", async () => {
    const res = await request(app).get("/api/schemas");

    const schemas = res.body.schemas;
    expect(schemas.length).toBe(new Set(schemas).size);
  });

  it("filters by lastCheckedFrom", async () => {
    const res = await request(app).get(
      "/api/job-runs?lastCheckedFrom=2024-01-15T10:03:00.000Z",
    );

    expect(res.status).toBe(200);
    // Only rows with lastChecked >= the given time
    res.body.items.forEach((r: { lastChecked: string }) => {
      expect(new Date(r.lastChecked).getTime()).toBeGreaterThanOrEqual(
        new Date("2024-01-15T10:03:00.000Z").getTime(),
      );
    });
  });

  it("filters by lastCheckedTo (inclusive of full day)", async () => {
    // Date-only "to" should include all rows from that day
    const res = await request(app).get(
      "/api/job-runs?lastCheckedTo=2024-01-15",
    );

    expect(res.status).toBe(200);
    res.body.items.forEach((r: { lastChecked: string }) => {
      const endOfDay = new Date("2024-01-15T23:59:59.999Z").getTime();
      expect(new Date(r.lastChecked).getTime()).toBeLessThanOrEqual(endOfDay);
    });
  });

  it("returns 400 for invalid date", async () => {
    const res = await request(app).get(
      "/api/job-runs?lastCheckedFrom=not-a-date",
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid query");
  });

  it("returns case-insensitive distinct schemas", async () => {
    const res = await request(app).get("/api/schemas");
    const schemas = res.body.schemas;

    // No two entries should differ only by case
    const lower = schemas.map((s: string) => s.toLowerCase());
    expect(lower.length).toBe(new Set(lower).size);
  });
});
