import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { CreateProductBody, UpdateProductBody, UpdateProductParams, DeleteProductParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return null;
  }
  return userId;
}

router.get("/products", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.stationId, userId));

  res.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
      stationId: p.stationId,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.post("/products", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      stationId: userId,
      name: parsed.data.name,
      price: String(parsed.data.price),
      stock: parsed.data.stock,
    })
    .returning();

  res.status(201).json({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    stock: product.stock,
    stationId: product.stationId,
    createdAt: product.createdAt.toISOString(),
  });
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
  if (parsed.data.stock !== undefined) updateData.stock = parsed.data.stock;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.stationId, userId)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.json({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    stock: product.stock,
    stationId: product.stationId,
    createdAt: product.createdAt.toISOString(),
  });
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(productsTable)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.stationId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  res.sendStatus(204);
});

export default router;
