import { useState } from "react";
import { 
  useListProducts, 
  getListProductsQueryKey, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Edit2, Trash2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import type { Product } from "@workspace/api-client-react/src/generated/api.schemas";

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  price: z.coerce.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
  stock: z.coerce.number().min(0, "المخزون يجب أن يكون 0 أو أكثر"),
});

type ProductFormValues = z.infer<typeof productSchema>;

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

export default function Products() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: products, isLoading } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock: 0,
    },
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      form.reset({
        name: product.name,
        price: product.price,
        stock: product.stock,
      });
    } else {
      setEditingProduct(null);
      form.reset({
        name: "",
        price: 0,
        stock: 0,
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "تم التحديث بنجاح" });
          setDialogOpen(false);
        }
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "تمت الإضافة بنجاح" });
          setDialogOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "تم الحذف بنجاح" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">المنتجات</h1>
          <p className="text-muted-foreground mt-1">إدارة المنتجات وأسعارها ومخزونها</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة منتج
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Package className="w-5 h-5" />
                      </div>
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    لا توجد منتجات. أضف منتجاً جديداً للبدء.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>اسم المنتج</Label>
                    <FormControl>
                      <Input placeholder="مثال: قنينة 20 لتر" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <Label>السعر (دينار)</Label>
                    <FormControl>
                      <Input type="number" min="0" step="0.001" {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <Label>الكمية في المخزون</Label>
                    <FormControl>
                      <Input type="number" min="0" {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  حفظ
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
