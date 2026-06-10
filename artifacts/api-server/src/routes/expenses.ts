import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import { CreateExpenseBody, ListExpensesQueryParams, DeleteExpenseParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return null;
  }
  return userId;
}

router.get("/expenses", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = ListExpensesQueryParams.safeParse(req.query);
  const monthStr = params.success ? params.data.month : undefined;

  let conditions: any[] = [eq(expensesTable.stationId, userId)];

  if (monthStr) {
    const [year, month] = monthStr.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    conditions.push(gte(expensesTable.createdAt, start), lte(expensesTable.createdAt, end));
  }

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(and(...conditions))
    .orderBy(expensesTable.createdAt);

  res.json(
    expenses.map((e) => ({
      id: e.id,
      stationId: e.stationId,
      description: e.description,
      amount: Number(e.amount),
      category: e.category,
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

router.post("/expenses", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db
    .insert(expensesTable)
    .values({
      stationId: userId,
      description: parsed.data.description,
      amount: String(parsed.data.amount),
      category: parsed.data.category,
    })
    .returning();

  res.status(201).json({
    id: expense.id,
    stationId: expense.stationId,
    description: expense.description,
    amount: Number(expense.amount),
    category: expense.category,
    createdAt: expense.createdAt.toISOString(),
  });
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(expensesTable)
    .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.stationId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "النفقة غير موجودة" });
    return;
  }

  res.sendStatus(204);
});

export default router;
