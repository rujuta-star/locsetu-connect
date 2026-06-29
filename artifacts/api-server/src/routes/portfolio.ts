import { Router } from "express";
import { db, portfolioItemsTable, workerProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/portfolio/:workerId", async (req, res): Promise<void> => {
  const workerId = parseInt(req.params.workerId, 10);
  if (isNaN(workerId)) { res.status(400).json({ error: "Invalid worker id" }); return; }

  const items = await db.select().from(portfolioItemsTable)
    .where(eq(portfolioItemsTable.workerId, workerId));
  res.json(items);
});

router.post("/portfolio", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const { title, description, mediaUrl, mediaType, beforeUrl, afterUrl } = req.body;

  if (!title || !mediaUrl) { res.status(400).json({ error: "title and mediaUrl required" }); return; }

  const [worker] = await db.select().from(workerProfilesTable)
    .where(eq(workerProfilesTable.userId, userId)).limit(1);

  if (!worker) { res.status(404).json({ error: "Worker profile not found" }); return; }

  const [item] = await db.insert(portfolioItemsTable).values({
    workerId: worker.id,
    title,
    description: description ?? null,
    mediaUrl,
    mediaType: mediaType ?? "image",
    beforeUrl: beforeUrl ?? null,
    afterUrl: afterUrl ?? null,
  }).returning();

  res.status(201).json(item);
});

router.delete("/portfolio/:id", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [worker] = await db.select().from(workerProfilesTable)
    .where(eq(workerProfilesTable.userId, userId)).limit(1);

  if (!worker) { res.status(404).json({ error: "Worker profile not found" }); return; }

  await db.delete(portfolioItemsTable)
    .where(eq(portfolioItemsTable.id, id));

  res.json({ message: "Deleted" });
});

export default router;
