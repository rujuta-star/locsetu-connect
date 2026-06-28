import { Router } from "express";
import { db, usersTable, workerProfilesTable, jobsTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import { GetWorkerParams } from "@workspace/api-zod";

const router = Router();

router.get("/admin/stats", authMiddleware, adminMiddleware, async (_req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalWorkers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "worker"));
  const [totalCustomers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "customer"));
  const [totalJobs] = await db.select({ count: count() }).from(jobsTable);
  const [completedJobs] = await db.select({ count: count() }).from(jobsTable).where(eq(jobsTable.status, "completed"));
  const [pendingVerifs] = await db.select({ count: count() }).from(workerProfilesTable).where(eq(workerProfilesTable.verificationStatus, "pending"));
  const [activeJobs] = await db.select({ count: count() }).from(jobsTable).where(eq(jobsTable.status, "in_progress"));

  const total = Number(totalJobs.count);
  const completed = Number(completedJobs.count);

  res.json({
    totalUsers: Number(totalUsers.count),
    totalWorkers: Number(totalWorkers.count),
    totalCustomers: Number(totalCustomers.count),
    totalJobs: total,
    completedJobs: completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    pendingVerifications: Number(pendingVerifs.count),
    activeJobs: Number(activeJobs.count),
  });
});

router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const page = parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10) || 1;
  const limit = parseInt(typeof req.query.limit === "string" ? req.query.limit : "20", 10) || 20;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const offset = (page - 1) * limit;

  let allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  if (role) allUsers = allUsers.filter((u: any) => u.role === role);

  const total = allUsers.length;
  const paginated = allUsers.slice(offset, offset + limit);

  res.json({
    users: paginated.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/admin/workers/pending", authMiddleware, adminMiddleware, async (_req, res): Promise<void> => {
  const results = await db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .where(eq(workerProfilesTable.verificationStatus, "pending"));

  res.json(results.map(r => ({
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
    verificationStatus: r.worker_profiles.verificationStatus,
    completedJobs: r.worker_profiles.completedJobs,
    experience: r.worker_profiles.experience,
    about: r.worker_profiles.about,
    languages: r.worker_profiles.languages,
    idProofUrl: r.worker_profiles.idProofUrl,
    phone: r.users.phone,
    email: r.users.email,
    createdAt: r.worker_profiles.createdAt.toISOString(),
  })));
});

router.post("/admin/workers/:workerId/verify", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.workerId) ? req.params.workerId[0] : req.params.workerId;
  const workerId = parseInt(raw, 10);
  if (isNaN(workerId)) { res.status(400).json({ error: "Invalid workerId" }); return; }

  const status = typeof req.body?.status === "string" ? req.body.status : null;
  if (!status) { res.status(400).json({ error: "status is required" }); return; }
  const isVerified = status === "approved";

  const [wp] = await db.update(workerProfilesTable)
    .set({ verificationStatus: status, isVerified })
    .where(eq(workerProfilesTable.userId, workerId))
    .returning();

  if (!wp) { res.status(404).json({ error: "Worker not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, workerId)).limit(1);

  res.json({
    id: wp.id,
    userId: wp.userId,
    name: user?.name ?? "Unknown",
    avatarUrl: user?.avatarUrl ?? null,
    skills: wp.skills,
    location: wp.location,
    rating: wp.rating,
    reviewCount: wp.reviewCount,
    isAvailable: wp.isAvailable,
    isVerified: wp.isVerified,
    verificationStatus: wp.verificationStatus,
    completedJobs: wp.completedJobs,
    experience: wp.experience,
    about: wp.about,
    languages: wp.languages,
    idProofUrl: wp.idProofUrl,
    phone: user?.phone ?? null,
    email: user?.email ?? null,
    createdAt: wp.createdAt.toISOString(),
  });
});

router.get("/admin/jobs", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  let jobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
  if (status) jobs = jobs.filter((j: any) => j.status === status);

  const result = await Promise.all(jobs.map(async (job: any) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, job.customerId)).limit(1);
    let workerName: string | null = null;
    let workerAvatar: string | null = null;
    if (job.workerId) {
      const [worker] = await db.select().from(usersTable).where(eq(usersTable.id, job.workerId)).limit(1);
      if (worker) { workerName = worker.name; workerAvatar = worker.avatarUrl; }
    }
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      skill: job.skill,
      location: job.location,
      status: job.status,
      customerId: job.customerId,
      customerName: customer?.name ?? "Unknown",
      workerId: job.workerId,
      workerName,
      workerAvatar,
      budget: job.budget,
      scheduledAt: job.scheduledAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.get("/admin/top-workers", authMiddleware, adminMiddleware, async (_req, res): Promise<void> => {
  const results = await db.select().from(workerProfilesTable)
    .innerJoin(usersTable, eq(workerProfilesTable.userId, usersTable.id))
    .orderBy(desc(workerProfilesTable.rating))
    .limit(10);

  res.json(results.map(r => ({
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
  })));
});

export default router;
