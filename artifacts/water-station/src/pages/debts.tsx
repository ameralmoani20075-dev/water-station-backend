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
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, CheckCircle2, BookOpen, User, CreditCard } from "lucide-react";
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

  const [partialDialogOpen, setPartialDialogOpen] = useState(false);
  const [partialDebt, setPartialDebt] = useState<Debt | null>(null);
  const [partialAmount, setPartialAmount] = useState("0");

  const openAdd = () => { setEditingDebt(null); setCustomerName(""); setAmount("0"); setNote(""); setDialogOpen(true); };
  const openEdit = (d: Debt) => { setEditingDebt(d); setCustomerName(d.customerName); setAmount(String(d.amount)); setNote(d.note); setDialogOpen(true); };

  const openPartialPayment = (d: Debt) => {
    setPartialDebt(d);
    setPartialAmount(String(d.paidAmount > 0 ? d.paidAmount : 0));
    setPartialDialogOpen(true);
  };

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

  const handleMarkFullyPaid = (debt: Debt) => {
    const newIsPaid = !debt.isPaid;
    updateDebt.mutate({ id: debt.id, data: { isPaid: newIsPaid } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() });
        toast({ title: newIsPaid ? "تم تسجيل التسديد الكامل" : "تم إلغاء التسديد" });
      }
    });
  };

  const handlePartialPayment = () => {
    if (!partialDebt) return;
    const paid = parseFloat(partialAmount) || 0;
    if (paid < 0 || paid > partialDebt.amount) {
      toast({ variant: "destructive", title: "المبلغ غير صحيح" });
      return;
    }
    updateDebt.mutate({ id: partialDebt.id, data: { paidAmount: paid } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() });
        toast({ title: paid >= partialDebt.amount ? "تم التسديد الكامل" : `تم تسجيل دفع ${formatCurrency(paid)}` });
        setPartialDialogOpen(false);
      }
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
  const totalPaidAmount = unpaid.reduce((s, d) => s + d.paidAmount, 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">إجمالي الديون غير المسددة</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300">{formatCurrency(totalUnpaid)}</p>
              </div>
              <BookOpen className="w-8 h-8 text-red-400" />
            </CardContent>
          </Card>
          {totalPaidAmount > 0 && (
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">مدفوعات جزئية</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">{formatCurrency(totalPaidAmount)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-400" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {unpaid.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            غير مسددة ({unpaid.length})
          </h2>
          {unpaid.map(debt => (
            <DebtCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={handleDelete} onTogglePaid={handleMarkFullyPaid} onPartialPay={openPartialPayment} />
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
            <DebtCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={handleDelete} onTogglePaid={handleMarkFullyPaid} onPartialPay={openPartialPayment} />
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

      <Dialog open={partialDialogOpen} onOpenChange={setPartialDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل دفعة — {partialDebt?.customerName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الدين:</span><span className="font-bold">{partialDebt ? formatCurrency(partialDebt.amount) : ""}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">المدفوع سابقاً:</span><span className="font-bold text-green-600">{partialDebt ? formatCurrency(partialDebt.paidAmount) : ""}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">المتبقي:</span><span className="font-bold text-red-600">{partialDebt ? formatCurrency(partialDebt.amount - partialDebt.paidAmount) : ""}</span></div>
            </div>
            <div className="space-y-2">
              <Label>المبلغ المدفوع الإجمالي (دينار)</Label>
              <Input
                type="number"
                min="0"
                max={partialDebt?.amount}
                step="0.001"
                value={partialAmount}
                onChange={e => setPartialAmount(e.target.value)}
                dir="ltr"
                className="text-right text-lg"
              />
              <p className="text-xs text-muted-foreground">أدخل إجمالي ما دفعه العميل حتى الآن</p>
            </div>
            {partialDebt && parseFloat(partialAmount) >= partialDebt.amount && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 rounded-lg p-2 text-sm text-green-700 dark:text-green-400 text-center font-medium">
                ✓ سيتم تسجيل الدين كمسدّد بالكامل
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartialDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handlePartialPayment} disabled={updateDebt.isPending}>تسجيل الدفعة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DebtCard({ debt, onEdit, onDelete, onTogglePaid, onPartialPay }: {
  debt: Debt;
  onEdit: (d: Debt) => void;
  onDelete: (id: number) => void;
  onTogglePaid: (d: Debt) => void;
  onPartialPay: (d: Debt) => void;
}) {
  const remaining = debt.amount - debt.paidAmount;
  const paidPercent = debt.amount > 0 ? Math.min(100, (debt.paidAmount / debt.amount) * 100) : 0;
  const isPartial = !debt.isPaid && debt.paidAmount > 0;

  return (
    <div className={`rounded-xl border-2 transition-all ${debt.isPaid ? 'opacity-60 border-green-200 dark:border-green-800' : isPartial ? 'border-amber-300 dark:border-amber-700' : 'border-red-200 dark:border-red-800/50'}`}>
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${debt.isPaid ? 'bg-green-100 dark:bg-green-900/30' : isPartial ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <User className={`w-5 h-5 ${debt.isPaid ? 'text-green-600' : isPartial ? 'text-amber-600' : 'text-red-600'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${debt.isPaid ? 'line-through text-muted-foreground' : ''}`}>{debt.customerName}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-bold text-primary">{formatCurrency(debt.amount)}</p>
              {isPartial && (
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  دفع {formatCurrency(debt.paidAmount)} — متبقي {formatCurrency(remaining)}
                </span>
              )}
              {debt.isPaid && debt.paidAmount > 0 && (
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">مسدّد بالكامل</span>
              )}
            </div>
            {isPartial && (
              <div className="mt-1.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            )}
            {debt.note && <p className="text-sm text-muted-foreground mt-0.5">{debt.note}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
          <div className="flex items-center gap-1">
            {!debt.isPaid && (
              <Button size="sm" variant="outline" onClick={() => onPartialPay(debt)} className="h-8 gap-1 text-xs px-2">
                <CreditCard className="w-3.5 h-3.5" />
                دفع جزئي
              </Button>
            )}
            <Button size="sm" variant={debt.isPaid ? "outline" : "default"} onClick={() => onTogglePaid(debt)} className="h-8 gap-1 text-xs px-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {debt.isPaid ? "إلغاء" : "سُدّد"}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(debt)}><Edit2 className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(debt.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
