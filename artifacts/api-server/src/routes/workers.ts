import { Router } from "express";
import { db, usersTable, workerProfilesTable, savedWorkersTable } from "@workspace/db";
import { eq, and, gte, ilike, or, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import {
  ListWorkersQueryParams,
  GetWorkerParams,
  UpdateWorkerProfileBody,
} from "@workspace/api-zod";

const router = Router();

const SKILL_CATEGORIES = [
  { id: "electrician", name: "Electrician", icon: "Zap" },
  { id: "plumber", name: "Plumber", icon: "Droplets" },
  { id: "carpenter", name: "Carpenter", icon: "Hammer" },
  { id: "painter", name: "Painter", icon: "Paintbrush" },
  { id: "tailor", name: "Tailor", icon: "Scissors" },
  { id: "maid", name: "Maid", icon: "Home" },
  { id: "driver", name: "Driver", icon: "Car" },
  { id: "mechanic", name: "Mechanic", icon: "Wrench" },
  { id: "tutor", name: "Tutor", icon: "BookOpen" },
  { id: "technician", name: "Technician", icon: "Monitor" },
];

async function buildWorkerResponse(worker: any, user: any) {
  return {
    id: worker.id,
    userId: worker.userId,
    name: user.name,
    avatarUrl: user.avatarUrl,
    skills: worker.skills,
    location: worker.location,
    rating: worker.rating,
    reviewCount: worker.reviewCount,
    isAvailable: worker.isAvailable,
    isVerified: worker.isVerified,
    verificationStatus: worker.verificationStatus,
    completedJobs: worker.completedJobs,
    experience: worker.experience,
    about: worker.about,
    languages: worker.languages,
    idProofUrl: worker.idProofUrl,
    phone: user.phone,
    email: user.email,
    createdAt: worker.createdAt.toISOString(),
  };
}

router.get("/workers/skills", (_req, res): void => {
  res.json(SKILL_CATEGORIES);
});

router.get("/workers/recommendations", async (req, res): Promise<void> => {
  const skill = typeof req.query.skill === "string" ? req.query.skill : undefined;
  const location = typeof req.query.location === "string" ? req.query.location : undefined;

  let query = db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .where(eq(workerProfilesTable.isAvailable, true))
    .$dynamic();

  const results = await query.orderBy(desc(workerProfilesTable.rating)).limit(6);

  const filtered = results.filter(r => {
    if (skill && !r.worker_profiles.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) return false;
    if (location && !r.worker_profiles.location.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });

  const workers = filtered.map(r => ({
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
    experience: r.worker_profiles.experience,
    languages: r.worker_profiles.languages,
  }));

  res.json(workers);
});

router.get("/workers/me", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const [result] = await db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .where(eq(workerProfilesTable.userId, userId))
    .limit(1);

  if (!result) {
    res.status(404).json({ error: "Worker profile not found" });
    return;
  }

  res.json(await buildWorkerResponse(result.worker_profiles, result.users));
});

router.put("/workers/me", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const parsed = UpdateWorkerProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = {};
  if (parsed.data.skills !== undefined) updateData.skills = parsed.data.skills;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.isAvailable !== undefined) updateData.isAvailable = parsed.data.isAvailable;
  if (parsed.data.experience !== undefined) updateData.experience = parsed.data.experience;
  if (parsed.data.about !== undefined) updateData.about = parsed.data.about;
  if (parsed.data.languages !== undefined) updateData.languages = parsed.data.languages;
  if (parsed.data.idProofUrl !== undefined) {
    updateData.idProofUrl = parsed.data.idProofUrl;
    updateData.verificationStatus = "pending";
  }

  const [worker] = await db.update(workerProfilesTable)
    .set(updateData)
    .where(eq(workerProfilesTable.userId, userId))
    .returning();

  if (!worker) {
    res.status(404).json({ error: "Worker profile not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json(await buildWorkerResponse(worker, user));
});

router.get("/workers", async (req, res): Promise<void> => {
  const params = ListWorkersQueryParams.safeParse(req.query);

  const results = await db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .orderBy(desc(workerProfilesTable.rating));

  const filtered = results.filter(r => {
    const p = params.success ? params.data : {};
    if (p.skill && !r.worker_profiles.skills.some(s => s.toLowerCase().includes((p.skill as string).toLowerCase()))) return false;
    if (p.location && !r.worker_profiles.location.toLowerCase().includes((p.location as string).toLowerCase())) return false;
    if (p.available !== undefined && r.worker_profiles.isAvailable !== p.available) return false;
    return true;
  });

  const workers = filtered.map(r => ({
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
    experience: r.worker_profiles.experience,
    languages: r.worker_profiles.languages,
  }));

  res.json(workers);
});

router.get("/workers/top", async (_req, res): Promise<void> => {
  const results = await db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .where(eq(workerProfilesTable.isVerified, true))
    .orderBy(desc(workerProfilesTable.rating))
    .limit(6);

  const workers = results.map(r => ({
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
    experience: r.worker_profiles.experience,
    languages: r.worker_profiles.languages,
  }));

  res.json(workers);
});

router.get("/workers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [result] = await db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .where(eq(workerProfilesTable.id, id))
    .limit(1);

  if (!result) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }

  res.json(await buildWorkerResponse(result.worker_profiles, result.users));
});

export default router;
