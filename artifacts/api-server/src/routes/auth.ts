import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, stationsTable } from "@workspace/db";
import { LoginBody, ChangePasswordBody, ChangeStationNameBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [station] = await db
    .select()
    .from(stationsTable)
    .where(eq(stationsTable.username, username));

  if (!station) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  const valid = await bcrypt.compare(password, station.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  // Update last login
  await db
    .update(stationsTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(stationsTable.id, station.id));

  // Set session
  (req.session as any).userId = station.id;
  (req.session as any).role = station.role;

  res.json({
    id: station.id,
    username: station.username,
    name: station.name,
    role: station.role,
    isActive: station.isActive,
    logoUrl: station.logoUrl ?? null,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }

  const [station] = await db
    .select()
    .from(stationsTable)
    .where(eq(stationsTable.id, userId));

  if (!station) {
    res.status(401).json({ error: "الجلسة غير صالحة" });
    return;
  }

  res.json({
    id: station.id,
    username: station.username,
    name: station.name,
    role: station.role,
    isActive: station.isActive,
    logoUrl: station.logoUrl ?? null,
  });
});

router.patch("/auth/change-password", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  const [station] = await db
    .select()
    .from(stationsTable)
    .where(eq(stationsTable.id, userId));

  if (!station) {
    res.status(404).json({ error: "المحطة غير موجودة" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, station.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db
    .update(stationsTable)
    .set({ passwordHash: hash })
    .where(eq(stationsTable.id, userId));

  res.json({ ok: true });
});

router.patch("/stations/logo", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "غير مسجل الدخول" }); return; }
  const { logoUrl } = req.body;
  const [updated] = await db.update(stationsTable).set({ logoUrl }).where(eq(stationsTable.id, userId)).returning();
  res.json({ id: updated.id, username: updated.username, name: updated.name, isActive: updated.isActive, createdAt: updated.createdAt.toISOString(), logoUrl: updated.logoUrl });
});

router.get("/stations/logo", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "غير مسجل الدخول" }); return; }
  const [station] = await db.select({ logoUrl: stationsTable.logoUrl }).from(stationsTable).where(eq(stationsTable.id, userId));
  res.json({ logoUrl: station?.logoUrl ?? null });
});

router.patch("/auth/change-name", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }

  const parsed = ChangeStationNameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(stationsTable)
    .set({ name: parsed.data.name })
    .where(eq(stationsTable.id, userId))
    .returning();

  res.json({
    id: updated.id,
    username: updated.username,
    name: updated.name,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
