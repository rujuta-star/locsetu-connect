import { Router } from "express";
import { db, reviewsTable, usersTable, workerProfilesTable } from "@workspace/db";
import { eq, avg, count, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { CreateReviewBody, GetWorkerReviewsParams } from "@workspace/api-zod";

const router = Router();

router.post("/reviews", authMiddleware, async (req, res): Promise<void> => {
  const customerId = (req as any).user.userId;
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { workerId, rating, comment } = parsed.data;
  const jobId = typeof req.body?.jobId === "number" ? req.body.jobId : (req.body?.jobId ? parseInt(req.body.jobId, 10) : undefined);

  const [review] = await db.insert(reviewsTable).values({
    workerId,
    customerId,
    jobId: jobId ?? null,
    rating,
    comment: comment ?? null,
  }).returning();

  // Update worker average rating
  const [stats] = await db.select({
    avg: avg(reviewsTable.rating),
    count: count(reviewsTable.id),
  }).from(reviewsTable).where(eq(reviewsTable.workerId, workerId));

  const newRating = parseFloat(stats.avg as string) || 0;
  const newCount = Number(stats.count) || 0;

  const [wp] = await db.select().from(workerProfilesTable).where(eq(workerProfilesTable.userId, workerId)).limit(1);
  if (wp) {
    await db.update(workerProfilesTable)
      .set({ rating: Math.round(newRating * 10) / 10, reviewCount: newCount })
      .where(eq(workerProfilesTable.userId, workerId));
  }

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, customerId)).limit(1);

  res.status(201).json({
    id: review.id,
    workerId: review.workerId,
    customerId: review.customerId,
    customerName: customer?.name ?? "Unknown",
    customerAvatar: customer?.avatarUrl ?? null,
    jobId: review.jobId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  });
});

router.get("/reviews/worker/:workerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.workerId) ? req.params.workerId[0] : req.params.workerId;
  const workerId = parseInt(raw, 10);
  if (isNaN(workerId)) { res.status(400).json({ error: "Invalid workerId" }); return; }

  const reviews = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.workerId, workerId))
    .orderBy(desc(reviewsTable.createdAt));

  const result = await Promise.all(reviews.map(async (r) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, r.customerId)).limit(1);
    return {
      id: r.id,
      workerId: r.workerId,
      customerId: r.customerId,
      customerName: customer?.name ?? "Unknown",
      customerAvatar: customer?.avatarUrl ?? null,
      jobId: r.jobId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

export default router;
