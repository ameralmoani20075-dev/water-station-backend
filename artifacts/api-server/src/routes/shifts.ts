import { Router, type IRouter } from "express";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { db, shiftsTable } from "@workspace/db";
import { CreateShiftBody, ListShiftsQueryParams, EndShiftParams, DeleteShiftParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return null;
  }
  return userId;
}

function formatShift(s: any) {
  return {
    id: s.id,
    stationId: s.stationId,
    workerName: s.workerName,
    startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
    endTime: s.endTime ? (s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime) : null,
    notes: s.notes ?? null,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  };
}

router.get("/shifts", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = ListShiftsQueryParams.safeParse(req.query);
  const dateStr = params.success ? params.data.date : undefined;

  let conditions: any[] = [eq(shiftsTable.stationId, userId)];

  if (dateStr) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    conditions.push(gte(shiftsTable.startTime, start), lte(shiftsTable.startTime, end));
  }

  const shifts = await db
    .select()
    .from(shiftsTable)
    .where(and(...conditions))
    .orderBy(shiftsTable.startTime);

  res.json(shifts.map(formatShift));
});

router.post("/shifts", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateShiftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [shift] = await db
    .insert(shiftsTable)
    .values({
      stationId: userId,
      workerName: parsed.data.workerName,
      startTime: new Date(parsed.data.startTime),
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(formatShift(shift));
});

router.get("/shifts/active", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [shift] = await db
    .select()
    .from(shiftsTable)
    .where(and(eq(shiftsTable.stationId, userId), isNull(shiftsTable.endTime)))
    .orderBy(shiftsTable.startTime)
    .limit(1);

  res.json({ shift: shift ? formatShift(shift) : null });
});

router.patch("/shifts/:id/end", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = EndShiftParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [shift] = await db
    .update(shiftsTable)
    .set({ endTime: new Date() })
    .where(and(eq(shiftsTable.id, params.data.id), eq(shiftsTable.stationId, userId)))
    .returning();

  if (!shift) {
    res.status(404).json({ error: "المناوبة غير موجودة" });
    return;
  }

  res.json(formatShift(shift));
});

router.delete("/shifts/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = DeleteShiftParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(shiftsTable)
    .where(and(eq(shiftsTable.id, params.data.id), eq(shiftsTable.stationId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "المناوبة غير موجودة" });
    return;
  }

  res.sendStatus(204);
});

export default router;
