import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
/**
 * Fetches the distinct destination schemas for the advanced filter dropdown.
 *
 * Cached by React Query with a long staleTime — schemas rarely change,
 * so this avoids refetching on every render or filter change.
 */
export function useSchemas() {
  return useQuery<{ schemas: string[] }>({
    queryKey: ["schemas"],
    queryFn: () => apiFetch("/schemas"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
