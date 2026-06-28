import { Router } from "express";
import { db, sosEventsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.post("/sos", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const { latitude, longitude, locationAddress, emergencyContact, message } = req.body;

  const [event] = await db.insert(sosEventsTable).values({
    userId,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    locationAddress: locationAddress ?? null,
    emergencyContact: emergencyContact ?? null,
    message: message ?? null,
  }).returning();

  // Notify admins
  const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
  for (const admin of admins) {
    await db.insert(notificationsTable).values({
      userId: admin.id,
      title: "SOS Alert!",
      body: `User sent SOS. Location: ${locationAddress ?? "Unknown"}`,
      type: "sos",
    });
  }

  res.status(201).json({ message: "SOS alert sent", event });
});

router.get("/sos/my", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const events = await db.select().from(sosEventsTable)
    .where(eq(sosEventsTable.userId, userId));
  res.json(events);
});

router.get("/sos/all", authMiddleware, async (req, res): Promise<void> => {
  const role = (req as any).user.role;
  if (role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const events = await db.select().from(sosEventsTable);
  res.json(events);
});

export default router;
