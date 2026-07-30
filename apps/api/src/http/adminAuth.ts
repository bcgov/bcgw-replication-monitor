import { Request, Response, NextFunction } from "express";

// The SSO role that grants access to this application.
const ADMIN_ROLE = "admin";

/**
 * Admin authorization middleware.
 *
 * Kong forwards the authenticated user's info in the `X-Userinfo` header
 * (base64-encoded JSON). This middleware decodes it and checks whether the
 * user has the admin role in `client_roles`. Non-admin users are rejected
 * with a 403 so the frontend can show an access-denied page.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["x-userinfo"];

  // No header, return 403
  if (typeof raw !== "string") {
    return res.status(403).json({ error: "Access denied" });
  }

  let userInfo: { client_roles?: string[] };
  try {
    userInfo = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    // Malformed header, return 403
    return res.status(403).json({ error: "Access denied" });
  }

  const roles = userInfo.client_roles ?? [];
  if (!roles.includes(ADMIN_ROLE)) {
    return res.status(403).json({ error: "Access denied" });
  }

  // User is an admin, allow the request through
  next();
}
