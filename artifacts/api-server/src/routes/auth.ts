import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, workerProfilesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { signToken, authMiddleware } from "../lib/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, password, role } = parsed.data;
  const email = parsed.data.email?.trim() || null;
  const phone = parsed.data.phone?.trim() || null;

  if (!email && !phone) {
    res.status(400).json({ error: "Email or phone is required" });
    return;
  }

  const conditions = [];
  if (email) conditions.push(eq(usersTable.email, email));
  if (phone) conditions.push(eq(usersTable.phone, phone));

  const existing = await db.select().from(usersTable).where(or(...conditions)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "User already exists with this email or phone" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name,
    email: email ?? null,
    phone: phone ?? null,
    passwordHash,
    role: role as "customer" | "worker" | "admin",
  }).returning();

  if (role === "worker") {
    await db.insert(workerProfilesTable).values({
      userId: user.id,
      skills: [],
      location: "",
      languages: [],
    });
  }

  const token = signToken({ userId: user.id, role: user.role });

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { identifier, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(
    or(eq(usersTable.email, identifier), eq(usersTable.phone, identifier))
  ).limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
