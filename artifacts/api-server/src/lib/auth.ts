import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable must be set in production.");
  } else {
    console.warn(
      "[auth] WARNING: SESSION_SECRET is not set. Using an insecure default. Set SESSION_SECRET before deploying.",
    );
  }
}

const EFFECTIVE_SECRET = JWT_SECRET ?? "locsetu-dev-only-insecure-secret";
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: number;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, EFFECTIVE_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  (req as any).user = payload;
  next();
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) (req as any).user = payload;
  }
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
