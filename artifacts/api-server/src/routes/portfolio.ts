import { Router } from "express";
import { db, portfolioItemsTable, workerProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" }); return;
  }
  if (!mediaUrl || typeof mediaUrl !== "string" || mediaUrl.trim().length === 0) {
    res.status(400).json({ error: "mediaUrl is required" }); return;
  }

  const [worker] = await db.select().from(workerProfilesTable)
    .where(eq(workerProfilesTable.userId, userId)).limit(1);

  if (!worker) { res.status(403).json({ error: "Only workers can add portfolio items" }); return; }

  const [item] = await db.insert(portfolioItemsTable).values({
    workerId: worker.id,
    title: title.trim(),
    description: description ? String(description).trim() : null,
    mediaUrl: mediaUrl.trim(),
    mediaType: mediaType ?? "image",
    beforeUrl: beforeUrl ? String(beforeUrl).trim() : null,
    afterUrl: afterUrl ? String(afterUrl).trim() : null,
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

  if (!worker) { res.status(403).json({ error: "Only workers can delete portfolio items" }); return; }

  const [existing] = await db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), eq(portfolioItemsTable.workerId, worker.id)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Portfolio item not found" }); return; }

  await db.delete(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), eq(portfolioItemsTable.workerId, worker.id)));

  res.json({ message: "Deleted" });
});

export default router;
