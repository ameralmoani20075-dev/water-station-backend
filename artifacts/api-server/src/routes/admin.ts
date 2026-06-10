import { Router, type IRouter } from "express";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { db, stationsTable, salesTable } from "@workspace/db";
import { AdminToggleStationParams, AdminToggleStationBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAdmin(req: any, res: any): boolean {
  const userId = (req.session as any)?.userId;
  const role = (req.session as any)?.role;
  if (!userId || role !== "admin") {
    res.status(403).json({ error: "غير مصرح" });
    return false;
  }
  return true;
}

router.get("/admin/stations", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const stations = await db.select().from(stationsTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySales = await db
    .select({
      stationId: salesTable.stationId,
      total: sql<number>`COALESCE(SUM(${salesTable.totalPrice}::float), 0)`,
    })
    .from(salesTable)
    .where(and(gte(salesTable.createdAt, today), lte(salesTable.createdAt, tomorrow)))
    .groupBy(salesTable.stationId);

  const salesTodayMap: Record<number, number> = {};
  for (const s of todaySales) {
    salesTodayMap[s.stationId] = Number(s.total) ?? 0;
  }

  const result = stations
    .filter((s) => s.role !== "admin")
    .map((s) => ({
      id: s.id,
      username: s.username,
      name: s.name,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      totalSalesToday: salesTodayMap[s.id] ?? 0,
      lastLoginAt: s.lastLoginAt ? s.lastLoginAt.toISOString() : null,
    }));

  res.json(result);
});

router.patch("/admin/stations/:id/toggle", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = AdminToggleStationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminToggleStationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [station] = await db
    .update(stationsTable)
    .set({ isActive: parsed.data.isActive })
    .where(eq(stationsTable.id, params.data.id))
    .returning();

  if (!station) {
    res.status(404).json({ error: "المحطة غير موجودة" });
    return;
  }

  res.json({
    id: station.id,
    username: station.username,
    name: station.name,
    isActive: station.isActive,
    createdAt: station.createdAt.toISOString(),
    totalSalesToday: 0,
    lastLoginAt: station.lastLoginAt ? station.lastLoginAt.toISOString() : null,
  });
});

export default router;
