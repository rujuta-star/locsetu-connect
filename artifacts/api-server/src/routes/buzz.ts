import { Router } from "express";
import { db, buzzPostsTable, usersTable } from "@workspace/db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { authMiddleware, optionalAuthMiddleware } from "../lib/auth";
import { CreateBuzzBody } from "@workspace/api-zod";

const router = Router();

function buildBuzzResponse(post: typeof buzzPostsTable.$inferSelect, authorName: string) {
  return {
    id: post.id,
    userId: post.userId,
    authorName,
    title: post.title,
    description: post.description,
    category: post.category,
    city: post.city,
    area: post.area ?? null,
    contactPhone: post.contactPhone ?? null,
    expiresAt: post.expiresAt ? post.expiresAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
  };
}

router.get("/buzz", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const city = typeof req.query.city === "string" ? req.query.city : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const page = Math.max(1, parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(typeof req.query.limit === "string" ? req.query.limit : "20", 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (city) conditions.push(ilike(buzzPostsTable.city, `%${city}%`));
  if (category) conditions.push(eq(buzzPostsTable.category, category));
  if (search) conditions.push(
    or(
      ilike(buzzPostsTable.title, `%${search}%`),
      ilike(buzzPostsTable.description, `%${search}%`)
    )!
  );
  conditions.push(
    or(
      sql`${buzzPostsTable.expiresAt} IS NULL`,
      sql`${buzzPostsTable.expiresAt} > NOW()`
    )!
  );

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [posts, countResult] = await Promise.all([
    db.select({
      post: buzzPostsTable,
      authorName: usersTable.name,
    })
      .from(buzzPostsTable)
      .innerJoin(usersTable, eq(buzzPostsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(buzzPostsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` })
      .from(buzzPostsTable)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  res.json({
    posts: posts.map(r => buildBuzzResponse(r.post, r.authorName)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/buzz/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select({
    post: buzzPostsTable,
    authorName: usersTable.name,
  })
    .from(buzzPostsTable)
    .innerJoin(usersTable, eq(buzzPostsTable.userId, usersTable.id))
    .where(eq(buzzPostsTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  res.json(buildBuzzResponse(row.post, row.authorName));
});

router.post("/buzz", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateBuzzBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const userId = (req as any).user.userId;
  const { title, description, category, city, area, contactPhone, expiresAt } = parsed.data;

  const [post] = await db.insert(buzzPostsTable).values({
    userId,
    title,
    description: description ?? "",
    category,
    city,
    area: area ?? null,
    contactPhone: contactPhone ?? null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  }).returning();

  const user = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json(buildBuzzResponse(post, user[0]?.name ?? ""));
});

router.delete("/buzz/:id", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.userId;
  const role = (req as any).user.role;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const condition = role === "admin"
    ? eq(buzzPostsTable.id, id)
    : and(eq(buzzPostsTable.id, id), eq(buzzPostsTable.userId, userId));

  const [deleted] = await db.delete(buzzPostsTable).where(condition).returning();

  if (!deleted) { res.status(404).json({ error: "Not found or not authorized" }); return; }

  res.json({ message: "Deleted" });
});

export default router;
