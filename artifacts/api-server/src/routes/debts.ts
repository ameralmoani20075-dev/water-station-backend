import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, debtsTable } from "@workspace/db";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  return (req.session as any)?.userId ?? null;
}

function serializeDebt(d: typeof debtsTable.$inferSelect) {
  return {
    ...d,
    amount: Number(d.amount),
    paidAmount: Number(d.paidAmount),
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/debts", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const debts = await db.select().from(debtsTable).where(eq(debtsTable.stationId, userId));
  res.json(debts.map(serializeDebt));
});

router.post("/debts", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const { customerName, amount, note } = req.body;
  if (!customerName) { res.status(400).json({ error: "اسم العميل مطلوب" }); return; }
  const [debt] = await db.insert(debtsTable).values({
    stationId: userId,
    customerName,
    amount: String(amount ?? 0),
    paidAmount: "0",
    note: note ?? "",
    isPaid: false,
  }).returning();
  res.status(201).json(serializeDebt(debt));
});

router.patch("/debts/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);

  const [existing] = await db.select().from(debtsTable).where(and(eq(debtsTable.id, id), eq(debtsTable.stationId, userId)));
  if (!existing) { res.status(404).json({ error: "الدين غير موجود" }); return; }

  const updates: Record<string, unknown> = {};
  if (req.body.customerName !== undefined) updates.customerName = req.body.customerName;
  if (req.body.amount !== undefined) updates.amount = String(req.body.amount);
  if (req.body.note !== undefined) updates.note = req.body.note;

  if (req.body.paidAmount !== undefined) {
    const paid = Number(req.body.paidAmount);
    const total = req.body.amount !== undefined ? Number(req.body.amount) : Number(existing.amount);
    updates.paidAmount = String(paid);
    updates.isPaid = paid >= total;
  }

  if (req.body.isPaid !== undefined && req.body.paidAmount === undefined) {
    updates.isPaid = req.body.isPaid;
    if (req.body.isPaid) {
      updates.paidAmount = updates.amount ?? existing.amount;
    } else {
      updates.paidAmount = "0";
    }
  }

  const [debt] = await db.update(debtsTable).set(updates).where(and(eq(debtsTable.id, id), eq(debtsTable.stationId, userId))).returning();
  if (!debt) { res.status(404).json({ error: "الدين غير موجود" }); return; }
  res.json(serializeDebt(debt));
});

router.delete("/debts/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);
  await db.delete(debtsTable).where(and(eq(debtsTable.id, id), eq(debtsTable.stationId, userId)));
  res.status(204).end();
});

export default router;
