import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

export type AuthedRequest = Request & {
  user?: { id: string; email: string; name: string };
};

const COOKIE = "ttm_session";

export function getSessionToken(req: Request): string | undefined {
  const c = req.cookies?.[COOKIE];
  if (typeof c === "string" && c.length > 0) return c;
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return undefined;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = getSessionToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export const sessionCookieName = COOKIE;

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
