import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tanksTable } from "@workspace/db";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  return (req.session as any)?.userId ?? null;
}

router.get("/tanks", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const tanks = await db.select().from(tanksTable).where(eq(tanksTable.stationId, userId));
  res.json(tanks.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/tanks", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const { name, isFull } = req.body;
  if (!name) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
  const [tank] = await db.insert(tanksTable).values({ stationId: userId, name, isFull: isFull ?? false }).returning();
  res.status(201).json({ ...tank, createdAt: tank.createdAt.toISOString() });
});

router.patch("/tanks/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);
  const updates: Record<string, unknown> = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.isFull !== undefined) updates.isFull = req.body.isFull;
  const [tank] = await db.update(tanksTable).set(updates).where(and(eq(tanksTable.id, id), eq(tanksTable.stationId, userId))).returning();
  if (!tank) { res.status(404).json({ error: "الخزان غير موجود" }); return; }
  res.json({ ...tank, createdAt: tank.createdAt.toISOString() });
});

router.delete("/tanks/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);
  await db.delete(tanksTable).where(and(eq(tanksTable.id, id), eq(tanksTable.stationId, userId)));
  res.status(204).end();
});

export default router;
