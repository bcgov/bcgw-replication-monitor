/**
 * Thrown when the API returns 403 (user is authenticated but not authorized)
 */
export class ForbiddenError extends Error {
  constructor() {
    super("Access denied");
    this.name = "ForbiddenError";
  }
}

/**
 * Base API client.
 *
 * All API requests go through this function.
 * Uses relative /api path.
 */
export async function apiFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api${endpoint}`);

  // 403 = authenticated but not an admin, throw a specific error
  if (response.status === 403) {
    throw new ForbiddenError();
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
