import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, salesTable, productsTable } from "@workspace/db";
import { CreateSaleBody, ListSalesQueryParams, GetSalesStatsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return null;
  }
  return userId;
}

function formatSale(s: any) {
  return {
    id: s.id,
    stationId: s.stationId,
    productId: s.productId,
    productName: s.productName,
    quantity: s.quantity,
    unitPrice: Number(s.unitPrice),
    totalPrice: Number(s.totalPrice),
    isCoupon: s.isCoupon,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/sales", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = ListSalesQueryParams.safeParse(req.query);
  const dateStr = params.success ? params.data.date : undefined;

  let query = db.select().from(salesTable).where(eq(salesTable.stationId, userId)).$dynamic();

  if (dateStr) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    query = query.where(and(
      eq(salesTable.stationId, userId),
      gte(salesTable.createdAt, start),
      lte(salesTable.createdAt, end)
    ));
  }

  const sales = await query.orderBy(sql`${salesTable.createdAt} DESC`);
  res.json(sales.map(formatSale));
});

router.post("/sales", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, quantity, isCoupon } = parsed.data;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.stationId, userId)));

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  const unitPrice = Number(product.price);
  const totalPrice = isCoupon ? Math.max(0, unitPrice * quantity - 5) : unitPrice * quantity;

  const [sale] = await db
    .insert(salesTable)
    .values({
      stationId: userId,
      productId,
      productName: product.name,
      quantity,
      unitPrice: String(unitPrice),
      totalPrice: String(totalPrice),
      isCoupon,
    })
    .returning();

  // Decrease stock
  if (product.stock > 0) {
    await db
      .update(productsTable)
      .set({ stock: Math.max(0, product.stock - quantity) })
      .where(eq(productsTable.id, productId));
  }

  res.status(201).json(formatSale(sale));
});

router.get("/sales/today-summary", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sales = await db
    .select()
    .from(salesTable)
    .where(and(
      eq(salesTable.stationId, userId),
      gte(salesTable.createdAt, today),
      lte(salesTable.createdAt, tomorrow)
    ));

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
  const totalSales = sales.length;
  const couponCount = sales.filter((s) => s.isCoupon).length;
  const waterBottleCount = sales.filter((s) => !s.isCoupon).reduce((sum, s) => sum + s.quantity, 0);

  res.json({
    totalRevenue,
    totalSales,
    couponCount,
    waterBottleCount,
    date: today.toISOString().split("T")[0],
  });
});

router.get("/sales/stats", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetSalesStatsQueryParams.safeParse(req.query);
  const period = (params.success ? params.data.period : undefined) ?? "week";

  const now = new Date();
  let startDate = new Date();

  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  const sales = await db
    .select()
    .from(salesTable)
    .where(and(
      eq(salesTable.stationId, userId),
      gte(salesTable.createdAt, startDate)
    ));

  // Group by day
  const byDay: Record<string, number> = {};
  for (const s of sales) {
    const day = s.createdAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] ?? 0) + Number(s.totalPrice);
  }

  const dailyRevenue = Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);

  // Top products
  const byProduct: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const s of sales) {
    if (!byProduct[s.productName]) {
      byProduct[s.productName] = { name: s.productName, quantity: 0, revenue: 0 };
    }
    byProduct[s.productName].quantity += s.quantity;
    byProduct[s.productName].revenue += Number(s.totalPrice);
  }

  const topProducts = Object.values(byProduct)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({ period, dailyRevenue, totalRevenue, topProducts });
});

export default router;
