import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { AccessDenied } from "./AccessDenied";

/**
 * Gates the app based on the user's authorization.
 *
 * Fetches /api/me first. While loading, shows a loading spinner.
 * Non-admin users see the access-denied page instead of the app
 *
 * NOTE: this is UX only, the API independently enforces admin access.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isError, isAdmin } = useAuth();

  if (isLoading) {
    return <div className="auth-loading">Loading…</div>;
  }

  // Not admin, deny access
  if (isError || !isAdmin) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
