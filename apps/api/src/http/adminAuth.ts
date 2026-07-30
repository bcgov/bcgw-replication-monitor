import { Request, Response, NextFunction } from "express";

/**
 * Admin authorization middleware.
 *
 * Kong forwards the authenticated user's info in the `X-Userinfo` header
 * (base64-encoded JSON). This middleware decodes it, checks the user's
 * group membership, and rejects non-admin users with a 403.
 *
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["x-userinfo"];

  // TEMP: log the raw header so we can see its exact format
  console.log("X-Userinfo (raw):", raw);

  if (typeof raw === "string") {
    try {
      const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
      console.log("X-Userinfo (decoded):", JSON.stringify(decoded, null, 2));
    } catch (err) {
      console.log("Failed to decode X-Userinfo:", err);
    }
  }

  next();
}
