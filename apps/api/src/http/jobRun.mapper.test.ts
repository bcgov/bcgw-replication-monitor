import { describe, it, expect } from "vitest";
import { toDto } from "./jobRun.mapper";
import { JobRun } from "../domain/JobRun";

describe("toDto", () => {
  it("maps domain JobRun to DTO correctly", () => {
    const run: JobRun = {
      gateway: "fme",
      enabled: true,
      srcHost: "src-host-1",
      srcSchema: "SRC_SCHEMA",
      srcTable: "TABLE_A",
      destHost: "dest-host-1",
      destSchema: "DEST_SCHEMA",
      destTable: "TABLE_A",
      lastChecked: new Date("2024-01-15T10:00:00Z"),
      lastConverted: new Date("2024-01-15T09:55:00Z"),
      status: "success",
      updateType: "full",
      recordsRead: 1000,
      recordsWritten: 1000,
      dbInstance: "prod",
      logFilename: "fme_table_a_20240115.log",
    };

    const dto = toDto(run);

    expect(dto.gateway).toBe("fme");
    expect(dto.enabled).toBe(true);
    expect(dto.srcHost).toBe("src-host-1");
    expect(dto.srcSchema).toBe("SRC_SCHEMA");
    expect(dto.srcTable).toBe("TABLE_A");
    expect(dto.destHost).toBe("dest-host-1");
    expect(dto.destSchema).toBe("DEST_SCHEMA");
    expect(dto.destTable).toBe("TABLE_A");
    expect(dto.lastChecked).toBe("2024-01-15T10:00:00.000Z");
    expect(dto.lastConverted).toBe("2024-01-15T09:55:00.000Z");
    expect(dto.status).toBe("success");
    expect(dto.updateType).toBe("full");
    expect(dto.recordsRead).toBe(1000);
    expect(dto.recordsWritten).toBe(1000);
    expect(dto.dbInstance).toBe("prod");
    expect(dto.logFilename).toBe("fme_table_a_20240115.log");
  });

  it("handles null records correctly", () => {
    const run: JobRun = {
      gateway: "oracle",
      enabled: true,
      srcHost: "src-host-2",
      srcSchema: "SRC",
      srcTable: "TABLE_B",
      destHost: "dest-host-2",
      destSchema: "DEST",
      destTable: "TABLE_B",
      lastChecked: new Date("2024-01-15T10:00:00Z"),
      lastConverted: new Date("2024-01-15T09:55:00Z"),
      status: "failed",
      updateType: "incremental",
      recordsRead: null,
      recordsWritten: null,
      dbInstance: "prod",
      logFilename: null,
    };

    const dto = toDto(run);

    expect(dto.recordsRead).toBeNull();
    expect(dto.recordsWritten).toBeNull();
    expect(dto.logFilename).toBeNull();
  });
});
