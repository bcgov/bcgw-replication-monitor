import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";

interface Me {
  roles: string[];
  displayName?: string;
  email?: string;
}

/**
 * Fetches the current user's info (roles) from /api/me.
 * Used to gate the app and decide what to render based on role.
 */
export function useAuth() {
  const query = useQuery<Me>({
    queryKey: ["me"],
    queryFn: () => apiFetch("/me"),
    retry: false, // don't retry auth failures
    staleTime: 10 * 60 * 1000, // roles rarely change during a session
  });

  const roles = query.data?.roles ?? [];

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    roles,
    isAdmin: roles.includes("admin"),
    user: query.data,
  };
}
