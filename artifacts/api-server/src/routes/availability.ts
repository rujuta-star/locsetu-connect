import { Router } from "express";
import { db, workerAvailabilityTable, workerProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get("/availability/:workerId", async (req, res): Promise<void> => {
  const workerId = parseInt(req.params.workerId, 10);
  if (isNaN(workerId)) { res.status(400).json({ error: "Invalid worker id" }); return; }

  const availability = await db.select().from(workerAvailabilityTable)
    .where(eq(workerAvailabilityTable.workerId, workerId));

  res.json(availability);
});

router.post("/availability", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const { date, status, note } = req.body;

  if (!date || !status) { res.status(400).json({ error: "date and status required" }); return; }

  const [worker] = await db.select().from(workerProfilesTable)
    .where(eq(workerProfilesTable.userId, userId)).limit(1);

  if (!worker) { res.status(404).json({ error: "Worker profile not found" }); return; }

  const existing = await db.select().from(workerAvailabilityTable)
    .where(and(eq(workerAvailabilityTable.workerId, worker.id), eq(workerAvailabilityTable.date, date)))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db.update(workerAvailabilityTable)
      .set({ status, note: note ?? null })
      .where(and(eq(workerAvailabilityTable.workerId, worker.id), eq(workerAvailabilityTable.date, date)))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(workerAvailabilityTable).values({
      workerId: worker.id,
      date,
      status,
      note: note ?? null,
    }).returning();
    res.status(201).json(created);
  }
});

router.delete("/availability/:date", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const { date } = req.params;

  const [worker] = await db.select().from(workerProfilesTable)
    .where(eq(workerProfilesTable.userId, userId)).limit(1);

  if (!worker) { res.status(404).json({ error: "Worker profile not found" }); return; }

  await db.delete(workerAvailabilityTable)
    .where(and(eq(workerAvailabilityTable.workerId, worker.id), eq(workerAvailabilityTable.date, date)));

  res.json({ message: "Deleted" });
});

export default router;
