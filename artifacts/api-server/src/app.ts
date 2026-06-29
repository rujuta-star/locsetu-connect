import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, usersTable, workerProfilesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedDemoUsers() {
  try {
    const demoUsers = [
      { name: "Admin User", email: "admin@locsetu.com", phone: null, password: "admin123", role: "admin" as const },
      { name: "Priya Sharma", email: "customer@locsetu.com", phone: "9876543210", password: "demo123", role: "customer" as const },
      { name: "Raju Electrician", email: "worker@locsetu.com", phone: "9123456789", password: "demo123", role: "worker" as const },
    ];

    for (const u of demoUsers) {
      const conditions = [eq(usersTable.email, u.email)];
      const existing = await db.select().from(usersTable).where(or(...conditions)).limit(1);
      if (existing.length > 0) continue;

      const passwordHash = await bcrypt.hash(u.password, 10);
      const [user] = await db.insert(usersTable).values({
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash,
        role: u.role,
      }).returning();

      if (u.role === "worker") {
        await db.insert(workerProfilesTable).values({
          userId: user.id,
          skills: ["electrician", "technician"],
          location: "Mumbai",
          languages: ["Hindi", "English"],
          about: "Experienced electrician with 8 years of work in residential and commercial wiring.",
          experience: "8 years",
          isVerified: true,
          isAvailable: true,
          rating: 4.7,
          reviewCount: 23,
          completedJobs: 47,
        });
      }
      logger.info({ email: u.email }, "Demo user seeded");
    }
  } catch (err) {
    logger.warn({ err }, "Demo user seeding skipped (DB may not be ready)");
  }
}

seedDemoUsers();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : undefined;

app.use(
  cors({
    origin: allowedOrigins ?? true,
    credentials: true,
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const sosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "SOS rate limit exceeded. Please wait before sending another alert." },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authLimiter);
app.use("/api/sos", sosLimiter);

app.use("/api", router);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(500).json({ error: "An unexpected error occurred." });
  void message;
});

export default app;
