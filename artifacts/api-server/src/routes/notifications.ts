import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { MarkNotificationReadParams } from "@workspace/api-zod";

const router = Router();

router.get("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(notifications.map(n => ({
    id: n.id,
    userId: n.userId,
    title: n.title,
    body: n.body,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.patch("/notifications/:id/read", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [notif] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
    .returning();

  if (!notif) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: notif.id,
    userId: notif.userId,
    title: notif.title,
    body: notif.body,
    type: notif.type,
    isRead: notif.isRead,
    createdAt: notif.createdAt.toISOString(),
  });
});

router.post("/notifications/read-all", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, userId));
  res.json({ message: "All notifications marked as read" });
});

export default router;
