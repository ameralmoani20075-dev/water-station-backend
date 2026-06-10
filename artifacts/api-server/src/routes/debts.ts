import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, debtsTable } from "@workspace/db";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  return (req.session as any)?.userId ?? null;
}

router.get("/debts", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const debts = await db.select().from(debtsTable).where(eq(debtsTable.stationId, userId));
  res.json(debts.map(d => ({ ...d, amount: Number(d.amount), createdAt: d.createdAt.toISOString() })));
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
    note: note ?? "",
    isPaid: false,
  }).returning();
  res.status(201).json({ ...debt, amount: Number(debt.amount), createdAt: debt.createdAt.toISOString() });
});

router.patch("/debts/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);
  const updates: Record<string, unknown> = {};
  if (req.body.customerName !== undefined) updates.customerName = req.body.customerName;
  if (req.body.amount !== undefined) updates.amount = String(req.body.amount);
  if (req.body.note !== undefined) updates.note = req.body.note;
  if (req.body.isPaid !== undefined) updates.isPaid = req.body.isPaid;
  const [debt] = await db.update(debtsTable).set(updates).where(and(eq(debtsTable.id, id), eq(debtsTable.stationId, userId))).returning();
  if (!debt) { res.status(404).json({ error: "الدين غير موجود" }); return; }
  res.json({ ...debt, amount: Number(debt.amount), createdAt: debt.createdAt.toISOString() });
});

router.delete("/debts/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "غير مصرح" }); return; }
  const id = parseInt(req.params.id);
  await db.delete(debtsTable).where(and(eq(debtsTable.id, id), eq(debtsTable.stationId, userId)));
  res.status(204).end();
});

export default router;
