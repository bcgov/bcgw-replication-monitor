import { Request, Response, NextFunction } from "express";

export interface UserInfo {
  client_roles: string[];
  display_name?: string;
  email?: string;
}

/**
 * Decodes the base64-encoded X-Userinfo header that Kong forwards.
 * Returns null if the header is missing or malformed.
 */
export function decodeUserInfo(req: Request): UserInfo | null {
  const raw = req.headers["x-userinfo"];
  if (typeof raw !== "string") return null;

  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    return {
      client_roles: decoded.client_roles ?? [],
      display_name: decoded.display_name,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

const ADMIN_ROLE = "admin";

/**
 * Admin authorization middleware.
 *
 * Rejects requests from users who are not in the admin role with a 403.
 * Relies on the X-Userinfo header forwarded by Kong.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const user = decodeUserInfo(req);

  if (!user || !user.client_roles.includes(ADMIN_ROLE)) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
}
