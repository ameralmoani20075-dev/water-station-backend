import { useState } from "react";
import {
  useListDebts, getListDebtsQueryKey,
  useCreateDebt, useUpdateDebt, useDeleteDebt,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, CheckCircle2, BookOpen, User } from "lucide-react";
import type { Debt } from "@workspace/api-client-react";

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

export default function Debts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: debts } = useListDebts({ query: { queryKey: getListDebtsQueryKey() } });
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");

  const openAdd = () => { setEditingDebt(null); setCustomerName(""); setAmount("0"); setNote(""); setDialogOpen(true); };
  const openEdit = (d: Debt) => { setEditingDebt(d); setCustomerName(d.customerName); setAmount(String(d.amount)); setNote(d.note); setDialogOpen(true); };

  const handleSave = () => {
    if (!customerName.trim()) return;
    const data = { customerName, amount: parseFloat(amount) || 0, note };
    if (editingDebt) {
      updateDebt.mutate({ id: editingDebt.id, data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() }); toast({ title: "تم التحديث" }); setDialogOpen(false); }
      });
    } else {
      createDebt.mutate({ data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() }); toast({ title: "تم تسجيل الدين" }); setDialogOpen(false); }
      });
    }
  };

  const handleMarkPaid = (debt: Debt) => {
    updateDebt.mutate({ id: debt.id, data: { isPaid: !debt.isPaid } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() }); toast({ title: debt.isPaid ? "تم إلغاء التسديد" : "تم تسجيل التسديد" }); }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("حذف هذا الدين؟")) {
      deleteDebt.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() }); toast({ title: "تم الحذف" }); } });
    }
  };

  const unpaid = debts?.filter(d => !d.isPaid) ?? [];
  const paid = debts?.filter(d => d.isPaid) ?? [];
  const totalUnpaid = unpaid.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الديون والملاحظات</h1>
          <p className="text-muted-foreground mt-1">تتبع ديون العملاء وملاحظاتهم</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />إضافة دين</Button>
      </div>

      {unpaid.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">إجمالي الديون غير المسددة</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-300">{formatCurrency(totalUnpaid)}</p>
            </div>
            <BookOpen className="w-8 h-8 text-red-400" />
          </CardContent>
        </Card>
      )}

      {unpaid.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            غير مسددة ({unpaid.length})
          </h2>
          {unpaid.map(debt => (
            <DebtCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={handleDelete} onTogglePaid={handleMarkPaid} />
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            مسددة ({paid.length})
          </h2>
          {paid.map(debt => (
            <DebtCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={handleDelete} onTogglePaid={handleMarkPaid} />
          ))}
        </div>
      )}

      {(!debts || debts.length === 0) && (
        <div className="py-14 text-center border-2 border-dashed rounded-xl">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="text-muted-foreground">لا توجد ديون مسجلة.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDebt ? "تعديل الدين" : "إضافة دين جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم العميل</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="مثال: أبو محمد" />
            </div>
            <div className="space-y-2">
              <Label>المبلغ (دينار)</Label>
              <Input type="number" min="0" step="0.001" value={amount} onChange={e => setAmount(e.target.value)} dir="ltr" className="text-right" />
            </div>
            <div className="space-y-2">
              <Label>الملاحظة</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="مثال: 2 قنينة ماء" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={createDebt.isPending || updateDebt.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DebtCard({ debt, onEdit, onDelete, onTogglePaid }: {
  debt: Debt;
  onEdit: (d: Debt) => void;
  onDelete: (id: number) => void;
  onTogglePaid: (d: Debt) => void;
}) {
  return (
    <Card className={`border ${debt.isPaid ? 'opacity-60' : ''}`}>
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${debt.isPaid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <User className={`w-5 h-5 ${debt.isPaid ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="min-w-0">
            <p className={`font-semibold ${debt.isPaid ? 'line-through text-muted-foreground' : ''}`}>{debt.customerName}</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(debt.amount)}</p>
            {debt.note && <p className="text-sm text-muted-foreground mt-0.5">{debt.note}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-1">
          <Button size="sm" variant={debt.isPaid ? "outline" : "default"} onClick={() => onTogglePaid(debt)} className="h-8 gap-1 text-xs px-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {debt.isPaid ? "إلغاء" : "سُدّد"}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(debt)}><Edit2 className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(debt.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
