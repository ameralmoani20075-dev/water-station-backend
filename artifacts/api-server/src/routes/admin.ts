import { Router, type IRouter } from "express";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { db, stationsTable, salesTable } from "@workspace/db";
import { AdminToggleStationParams, AdminToggleStationBody, AdminCreateStationBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";

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

function serializeStation(s: typeof stationsTable.$inferSelect, totalSalesToday: number) {
  return {
    id: s.id,
    username: s.username,
    name: s.name,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    totalSalesToday,
    lastLoginAt: s.lastLoginAt ? s.lastLoginAt.toISOString() : null,
  };
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
    .map((s) => serializeStation(s, salesTodayMap[s.id] ?? 0));

  res.json(result);
});

router.post("/admin/stations", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const parsed = AdminCreateStationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, name } = parsed.data;

  const existing = await db
    .select({ id: stationsTable.id })
    .from(stationsTable)
    .where(eq(stationsTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "اسم المستخدم مستخدم بالفعل" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [station] = await db
    .insert(stationsTable)
    .values({ username, passwordHash: hashedPassword, name, role: "station", isActive: true })
    .returning();

  res.status(201).json(serializeStation(station, 0));
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

  res.json(serializeStation(station, 0));
});

router.patch("/admin/stations/:id/username", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
  if (username.length < 2) {
    res.status(400).json({ error: "اسم المستخدم يجب أن يكون حرفين على الأقل" });
    return;
  }

  const existing = await db
    .select({ id: stationsTable.id })
    .from(stationsTable)
    .where(eq(stationsTable.username, username))
    .limit(1);

  if (existing.length > 0 && existing[0].id !== id) {
    res.status(409).json({ error: "اسم المستخدم مستخدم بالفعل" });
    return;
  }

  const [station] = await db
    .update(stationsTable)
    .set({ username })
    .where(and(eq(stationsTable.id, id), eq(stationsTable.role, "station")))
    .returning();

  if (!station) {
    res.status(404).json({ error: "المحطة غير موجودة" });
    return;
  }

  res.json(serializeStation(station, 0));
});

router.post("/admin/stations/:id/reset-password", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
  if (newPassword.length < 4) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const [station] = await db
    .update(stationsTable)
    .set({ passwordHash: hashedPassword })
    .where(and(eq(stationsTable.id, id), eq(stationsTable.role, "station")))
    .returning();

  if (!station) {
    res.status(404).json({ error: "المحطة غير موجودة" });
    return;
  }

  res.json({ success: true });
});

export default router;
