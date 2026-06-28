import { Router } from "express";
import { db, savedWorkersTable, workerProfilesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { UnsaveWorkerParams } from "@workspace/api-zod";

const router = Router();

router.get("/saved-workers", authMiddleware, async (req, res): Promise<void> => {
  const customerId = (req as any).user.userId;
  const saved = await db.select().from(savedWorkersTable)
    .where(eq(savedWorkersTable.customerId, customerId));

  const result = await Promise.all(saved.map(async (s) => {
    const [wp] = await db.select().from(workerProfilesTable)
      .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
      .where(eq(workerProfilesTable.userId, s.workerId))
      .limit(1);
    if (!wp) return null;
    return {
      id: wp.worker_profiles.id,
      userId: wp.worker_profiles.userId,
      name: wp.users.name,
      avatarUrl: wp.users.avatarUrl,
      skills: wp.worker_profiles.skills,
      location: wp.worker_profiles.location,
      rating: wp.worker_profiles.rating,
      reviewCount: wp.worker_profiles.reviewCount,
      isAvailable: wp.worker_profiles.isAvailable,
      isVerified: wp.worker_profiles.isVerified,
      completedJobs: wp.worker_profiles.completedJobs,
      experience: wp.worker_profiles.experience,
      languages: wp.worker_profiles.languages,
    };
  }));

  res.json(result.filter(Boolean));
});

router.post("/saved-workers", authMiddleware, async (req, res): Promise<void> => {
  const customerId = (req as any).user.userId;
  const workerId = typeof req.body?.workerId === "number" ? req.body.workerId : parseInt(req.body?.workerId, 10);
  if (!workerId || isNaN(workerId)) { res.status(400).json({ error: "Invalid workerId" }); return; }

  try {
    await db.insert(savedWorkersTable).values({
      customerId,
      workerId,
    });
    res.status(201).json({ message: "Worker saved" });
  } catch {
    res.status(400).json({ error: "Already saved" });
  }
});

router.delete("/saved-workers/:workerId", authMiddleware, async (req, res): Promise<void> => {
  const customerId = (req as any).user.userId;
  const raw = Array.isArray(req.params.workerId) ? req.params.workerId[0] : req.params.workerId;
  const workerId = parseInt(raw, 10);
  if (isNaN(workerId)) { res.status(400).json({ error: "Invalid workerId" }); return; }

  await db.delete(savedWorkersTable).where(
    and(eq(savedWorkersTable.customerId, customerId), eq(savedWorkersTable.workerId, workerId))
  );

  res.json({ message: "Worker unsaved" });
});

export default router;
