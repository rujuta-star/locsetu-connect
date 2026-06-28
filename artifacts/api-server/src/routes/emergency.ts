import { Router } from "express";
import { db, emergencyRequestsTable, workerProfilesTable, usersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

const EMERGENCY_SKILLS = ["electrician", "plumber", "carpenter", "mechanic", "locksmith"];

router.get("/emergency/workers", async (req, res): Promise<void> => {
  const { skill, location } = req.query as Record<string, string>;

  const results = await db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .where(eq(workerProfilesTable.isAvailable, true));

  const filtered = results.filter(r => {
    if (skill && !r.worker_profiles.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) return false;
    if (location && !r.worker_profiles.location.toLowerCase().includes(location.toLowerCase())) return false;
    return EMERGENCY_SKILLS.some(es => r.worker_profiles.skills.some(s => s.toLowerCase().includes(es)));
  });

  const sorted = filtered.sort((a, b) => b.worker_profiles.rating - a.worker_profiles.rating);

  const workers = sorted.slice(0, 10).map(r => ({
    id: r.worker_profiles.id,
    userId: r.worker_profiles.userId,
    name: r.users.name,
    avatarUrl: r.users.avatarUrl,
    skills: r.worker_profiles.skills,
    location: r.worker_profiles.location,
    rating: r.worker_profiles.rating,
    reviewCount: r.worker_profiles.reviewCount,
    isAvailable: r.worker_profiles.isAvailable,
    isVerified: r.worker_profiles.isVerified,
    completedJobs: r.worker_profiles.completedJobs,
    phone: r.users.phone,
    estimatedArrival: Math.floor(Math.random() * 20) + 10,
  }));

  res.json(workers);
});

router.post("/emergency/request", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const { skill, location, description } = req.body;

  if (!skill || !location) {
    res.status(400).json({ error: "skill and location required" });
    return;
  }

  const [req_] = await db.insert(emergencyRequestsTable).values({
    customerId: userId,
    skill,
    location,
    description: description ?? null,
    status: "pending",
    estimatedArrival: Math.floor(Math.random() * 20) + 10,
  }).returning();

  res.status(201).json(req_);
});

router.get("/emergency/requests", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const requests = await db.select().from(emergencyRequestsTable)
    .where(eq(emergencyRequestsTable.customerId, userId));
  res.json(requests);
});

export default router;
