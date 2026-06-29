import { Router } from "express";
import { db, sosEventsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth";

const router = Router();

function parseOptionalFloat(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value));
  return isNaN(n) ? null : n;
}

router.post("/sos", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const { latitude, longitude, locationAddress, emergencyContact, message } = req.body;

  const lat = parseOptionalFloat(latitude);
  const lng = parseOptionalFloat(longitude);

  if (
    (locationAddress !== undefined && locationAddress !== null && typeof locationAddress !== "string") ||
    (emergencyContact !== undefined && emergencyContact !== null && typeof emergencyContact !== "string") ||
    (message !== undefined && message !== null && typeof message !== "string")
  ) {
    res.status(400).json({ error: "Invalid field types in SOS request" });
    return;
  }

  const [event] = await db.insert(sosEventsTable).values({
    userId,
    latitude: lat,
    longitude: lng,
    locationAddress: locationAddress ? String(locationAddress).trim() : null,
    emergencyContact: emergencyContact ? String(emergencyContact).trim() : null,
    message: message ? String(message).trim() : null,
  }).returning();

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

router.get("/sos/all", authMiddleware, adminMiddleware, async (_req, res): Promise<void> => {
  const events = await db.select().from(sosEventsTable);
  res.json(events);
});

export default router;
