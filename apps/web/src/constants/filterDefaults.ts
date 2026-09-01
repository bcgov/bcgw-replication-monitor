export const DEFAULT_FILTERS = {
  gateway: ["fme", "oracle", "sdr"],
  status: ["success", "failed"],
  dbInstance: ["prod"],
};

// Allowed values for validation (URL params are untrusted input)
export const ALLOWED_GATEWAYS = ["oracle", "fme", "sdr"] as const;
export const ALLOWED_STATUSES = ["success", "failed"] as const;
export const ALLOWED_DB_INSTANCES = ["test", "prod"] as const;

export const ALLOWED_SORT_FIELDS = [
  "status",
  "gateway",
  "srcSchema",
  "srcTable",
  "destSchema",
  "destTable",
  "updateType",
  "recordsRead",
  "recordsWritten",
  "lastChecked",
  "lastConverted",
] as const;

export const ALLOWED_SORT_DIRS = ["asc", "desc"] as const;
