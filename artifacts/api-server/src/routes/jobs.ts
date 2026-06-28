import { Router } from "express";
import { db, jobsTable, usersTable, workerProfilesTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { CreateJobBody, GetJobParams, UpdateJobParams, UpdateJobBody } from "@workspace/api-zod";

const router = Router();

async function buildJobResponse(job: any) {
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
}

async function createNotification(userId: number, title: string, body: string, type: string) {
  await db.insert(notificationsTable).values({ userId, title, body, type });
}

router.get("/jobs", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const role = (req as any).user.role;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const queryRole = typeof req.query.role === "string" ? req.query.role : undefined;

  let allJobs;
  if (role === "worker") {
    const [wp] = await db.select().from(workerProfilesTable).where(eq(workerProfilesTable.userId, userId)).limit(1);
    if (wp) {
      allJobs = await db.select().from(jobsTable).where(eq(jobsTable.workerId, userId)).orderBy(desc(jobsTable.createdAt));
    } else {
      allJobs = [];
    }
  } else if (role === "admin") {
    allJobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
  } else {
    allJobs = await db.select().from(jobsTable).where(eq(jobsTable.customerId, userId)).orderBy(desc(jobsTable.createdAt));
  }

  if (status) {
    allJobs = allJobs.filter((j: any) => j.status === status);
  }

  const result = await Promise.all(allJobs.map(buildJobResponse));
  res.json(result);
});

router.post("/jobs", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, skill, location, workerId, budget, scheduledAt } = parsed.data;

  const [job] = await db.insert(jobsTable).values({
    title,
    description,
    skill,
    location,
    customerId: userId,
    workerId: workerId ?? null,
    budget: budget ?? null,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    status: workerId ? "assigned" : "open",
  }).returning();

  if (workerId) {
    const [worker] = await db.select().from(usersTable).where(eq(usersTable.id, workerId)).limit(1);
    if (worker) {
      await createNotification(workerId, "New Job Request", `You have a new job request: ${title}`, "job_request");
    }
  }

  res.status(201).json(await buildJobResponse(job));
});

router.get("/jobs/:id", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  res.json(await buildJobResponse(job));
});

router.patch("/jobs/:id", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Job not found" }); return; }
  if (existing.customerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const updateData: any = {};
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.description) updateData.description = parsed.data.description;
  if (parsed.data.location) updateData.location = parsed.data.location;
  if (parsed.data.budget !== undefined) updateData.budget = parsed.data.budget;
  if (parsed.data.scheduledAt !== undefined) updateData.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;

  const [job] = await db.update(jobsTable).set(updateData).where(eq(jobsTable.id, id)).returning();
  res.json(await buildJobResponse(job));
});

router.post("/jobs/:id/accept", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const [updated] = await db.update(jobsTable)
    .set({ status: "in_progress", workerId: userId })
    .where(eq(jobsTable.id, id)).returning();

  await createNotification(job.customerId, "Job Accepted", `Your job "${job.title}" has been accepted`, "job_accepted");
  res.json(await buildJobResponse(updated));
});

router.post("/jobs/:id/reject", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const [updated] = await db.update(jobsTable)
    .set({ status: "open", workerId: null })
    .where(eq(jobsTable.id, id)).returning();

  res.json(await buildJobResponse(updated));
});

router.post("/jobs/:id/complete", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const [updated] = await db.update(jobsTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(jobsTable.id, id)).returning();

  if (job.workerId) {
    const completedCount = await db.select().from(jobsTable)
      .where(and(eq(jobsTable.workerId, job.workerId), eq(jobsTable.status, "completed")));
    await db.update(workerProfilesTable)
      .set({ completedJobs: completedCount.length })
      .where(eq(workerProfilesTable.userId, job.workerId));

    await createNotification(job.workerId, "Job Completed", `Job "${job.title}" has been marked as completed`, "job_completed");
    await createNotification(job.customerId, "Job Completed", `Your job "${job.title}" is complete. Please leave a review!`, "job_completed");
  }

  res.json(await buildJobResponse(updated));
});

router.post("/jobs/:id/cancel", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  if (job.customerId !== userId && (req as any).user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db.update(jobsTable)
    .set({ status: "cancelled" })
    .where(eq(jobsTable.id, id)).returning();

  if (job.workerId) {
    await createNotification(job.workerId, "Job Cancelled", `Job "${job.title}" has been cancelled`, "job_cancelled");
  }

  res.json(await buildJobResponse(updated));
});

export default router;
