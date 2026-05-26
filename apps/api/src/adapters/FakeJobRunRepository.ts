import { JobRun } from "../domain/JobRun";
import { JobRunRepository } from "../ports/JobRunRepository";

/**
 * Static seed data used when running without a real Oracle connection.
 */
const SAMPLE: JobRun[] = [
  {
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
    dbInstance: "dlv",
  },
  {
    gateway: "oracle",
    enabled: true,
    srcHost: "src-host-2",
    srcSchema: "SRC_SCHEMA",
    srcTable: "TABLE_B",
    destHost: "dest-host-1",
    destSchema: "DEST_SCHEMA",
    destTable: "TABLE_B",
    lastChecked: new Date("2024-01-15T10:05:00Z"),
    lastConverted: new Date("2024-01-15T09:50:00Z"),
    status: "failed",
    updateType: "incremental",
    recordsRead: 500,
    recordsWritten: 0,
    dbInstance: "dlv",
  },
];

/**
 * Fake implementation of {@link JobRunRepository}.
 *
 * Returns static data to allow development without a real data source.
 */
export class FakeJobRunRepository implements JobRunRepository {
  private readonly data: JobRun[];

  constructor(data: JobRun[] = SAMPLE) {
    this.data = data;
  }

  async getJobRuns(): Promise<JobRun[]> {
    return this.data;
  }
}
