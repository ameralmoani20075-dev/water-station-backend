import { useState } from "react";
import { 
  useListExpenses, 
  getListExpensesQueryKey, 
  useCreateExpense, 
  useDeleteExpense 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const expenseSchema = z.object({
  description: z.string().min(1, "الوصف مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون 0 أو أكثر"),
  category: z.string().min(1, "الفئة مطلوبة"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

const CATEGORIES = ["صيانة", "كهرباء", "وقود", "أجور", "أخرى"];

export default function Expenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: expenses } = useListExpenses({ month: currentMonth }, { query: { queryKey: getListExpensesQueryKey({ month: currentMonth }) } });
  
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: CATEGORIES[0],
    },
  });

  const handleOpenDialog = () => {
    form.reset({
      description: "",
      amount: 0,
      category: CATEGORIES[0],
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey({ month: currentMonth }) });
        toast({ title: "تم تسجيل النفقة بنجاح" });
        setDialogOpen(false);
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه النفقة؟")) {
      deleteExpense.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey({ month: currentMonth }) });
          toast({ title: "تم الحذف بنجاح" });
        }
      });
    }
  };

  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">النفقات</h1>
          <p className="text-muted-foreground mt-1">سجل نفقات المحطة لهذا الشهر</p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          تسجيل نفقة
        </Button>
      </div>

      <Card className="bg-gradient-to-l from-orange-500 to-red-500 text-white border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 font-medium mb-1">إجمالي النفقات ({format(new Date(), 'MMMM yyyy', { locale: ar })})</p>
              <h3 className="text-3xl font-bold">{formatCurrency(totalExpenses)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(expense.createdAt), 'dd MMMM yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border">
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-destructive">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(expense.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {expenses?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    لا توجد نفقات مسجلة لهذا الشهر.
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
            <DialogTitle>تسجيل نفقة جديدة</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <Label>الوصف</Label>
                    <FormControl>
                      <Input placeholder="مثال: فاتورة كهرباء" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <Label>الفئة</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <Label>المبلغ (دينار)</Label>
                    <FormControl>
                      <Input type="number" min="0" {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createExpense.isPending}>
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
