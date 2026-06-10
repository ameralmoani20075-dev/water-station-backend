import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, filtersTable } from "@workspace/db";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  return (req.session as any)?.userId ?? null;
}

router.get("/filters", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const filters = await db.select().from(filtersTable).where(eq(filtersTable.stationId, userId));
  res.json(filters.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/filters", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const { name, isFull } = req.body;
  if (!name) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
  const [filter] = await db.insert(filtersTable).values({ stationId: userId, name, isFull: isFull ?? true }).returning();
  res.status(201).json({ ...filter, createdAt: filter.createdAt.toISOString() });
});

router.patch("/filters/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);
  const updates: Record<string, unknown> = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.isFull !== undefined) updates.isFull = req.body.isFull;
  const [filter] = await db.update(filtersTable).set(updates).where(and(eq(filtersTable.id, id), eq(filtersTable.stationId, userId))).returning();
  if (!filter) { res.status(404).json({ error: "الفلتر غير موجود" }); return; }
  res.json({ ...filter, createdAt: filter.createdAt.toISOString() });
});

router.delete("/filters/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);
  await db.delete(filtersTable).where(and(eq(filtersTable.id, id), eq(filtersTable.stationId, userId)));
  res.status(204).end();
});

export default router;
