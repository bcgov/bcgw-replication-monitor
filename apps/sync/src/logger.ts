import { FlowApiError } from "./infrastructure/flow/v3/FlowV3JobSource";

export type LogLevel = "info" | "warn" | "error";

/** One JSON line per event, readable in `oc logs` and easy to search. */
export function log(
  level: LogLevel,
  msg: string,
  extra: Record<string, unknown> = {},
): void {
  console.log(
    JSON.stringify({ time: new Date().toISOString(), level, msg, ...extra }),
  );
}

/** Short, safe description of an error for logs. Never includes the token. */
export function describeError(err: unknown): Record<string, unknown> {
  if (err instanceof FlowApiError) {
    return {
      source: "flow",
      error: err.message,
      status: err.status,
      retryable: err.retryable,
    };
  }
  if (err instanceof Error) {
    return { error: err.message, name: err.name };
  }
  return { error: String(err) };
}
