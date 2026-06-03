/**
 * Base API client.
 *
 * All API requests go through this function.
 * Uses relative /api path
 */
export async function apiFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api${endpoint}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
