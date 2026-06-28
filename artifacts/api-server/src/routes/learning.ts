import { Router } from "express";
import { db, learningCoursesTable, learningProgressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router = Router();

const SEED_COURSES = [
  { title: "Basic Electrical Safety", category: "electrician", description: "Learn fundamental electrical safety, tools, and basic repairs.", duration: 45, language: "en", isFree: true },
  { title: "House Wiring Fundamentals", category: "electrician", description: "Complete guide to domestic wiring circuits and load calculation.", duration: 90, language: "en", isFree: true },
  { title: "विद्युत सुरक्षा मूल बातें", category: "electrician", description: "बेसिक इलेक्ट्रिकल सेफ्टी हिंदी में।", duration: 40, language: "hi", isFree: true },
  { title: "Plumbing Basics", category: "plumber", description: "Pipe types, fittings, and common leak repairs.", duration: 60, language: "en", isFree: true },
  { title: "Bathroom & Kitchen Plumbing", category: "plumber", description: "Fixtures, drainage, and toilet installation.", duration: 75, language: "en", isFree: true },
  { title: "Carpentry for Beginners", category: "carpenter", description: "Wood types, tools, joints, and finishing techniques.", duration: 80, language: "en", isFree: true },
  { title: "Furniture Making Basics", category: "carpenter", description: "Design and build simple furniture from scratch.", duration: 120, language: "en", isFree: true },
  { title: "Mobile Repair Fundamentals", category: "mobile_repair", description: "Screen replacement, battery, charging port repair.", duration: 90, language: "en", isFree: true },
  { title: "मोबाइल रिपेयर हिंदी", category: "mobile_repair", description: "मोबाइल रिपेयर की बुनियादी जानकारी।", duration: 85, language: "hi", isFree: true },
  { title: "Stitching Basics — Tailoring", category: "tailoring", description: "Measurements, fabric types, basic stitching.", duration: 60, language: "en", isFree: true },
  { title: "UPI & Digital Payments", category: "digital_payments", description: "Use UPI, net banking, and digital wallets confidently.", duration: 30, language: "en", isFree: true },
  { title: "डिजिटल पेमेंट हिंदी", category: "digital_payments", description: "UPI और डिजिटल वॉलेट का उपयोग करना सीखें।", duration: 28, language: "hi", isFree: true },
  { title: "Small Business Registration", category: "small_business", description: "MSME, GST, Udyam registration guide.", duration: 45, language: "en", isFree: true },
  { title: "Pricing Your Services", category: "small_business", description: "How to quote, invoice, and grow your client base.", duration: 35, language: "en", isFree: true },
  { title: "मोबाइल रिपेयर मराठी", category: "mobile_repair", description: "मोबाईल दुरुस्तीचे मूलभूत ज्ञान.", duration: 85, language: "mr", isFree: true },
];

router.get("/learning/courses", async (req, res): Promise<void> => {
  const { category, language } = req.query as Record<string, string>;

  const existing = await db.select().from(learningCoursesTable).limit(1);
  if (existing.length === 0) {
    await db.insert(learningCoursesTable).values(SEED_COURSES);
  }

  let courses = await db.select().from(learningCoursesTable);
  if (category) courses = courses.filter(c => c.category === category);
  if (language) courses = courses.filter(c => c.language === language);

  res.json(courses);
});

router.get("/learning/progress", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const progress = await db.select().from(learningProgressTable)
    .where(eq(learningProgressTable.userId, userId));
  res.json(progress);
});

router.post("/learning/progress/:courseId", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const courseId = parseInt(req.params.courseId, 10);
  const { progressPercent } = req.body;

  if (isNaN(courseId)) { res.status(400).json({ error: "Invalid course id" }); return; }

  const existing = await db.select().from(learningProgressTable)
    .where(and(eq(learningProgressTable.userId, userId), eq(learningProgressTable.courseId, courseId)))
    .limit(1);

  const isComplete = progressPercent >= 100;

  if (existing.length > 0) {
    const [updated] = await db.update(learningProgressTable)
      .set({
        progressPercent: Math.min(100, progressPercent),
        completedAt: isComplete ? new Date() : null,
        certificateIssued: isComplete,
      })
      .where(and(eq(learningProgressTable.userId, userId), eq(learningProgressTable.courseId, courseId)))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(learningProgressTable).values({
      userId,
      courseId,
      progressPercent: Math.min(100, progressPercent),
      completedAt: isComplete ? new Date() : null,
      certificateIssued: isComplete,
    }).returning();
    res.status(201).json(created);
  }
});

export default router;
