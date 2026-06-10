import { useState } from "react";
import {
  useListTanks, getListTanksQueryKey,
  useCreateTank, useUpdateTank, useDeleteTank,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Droplets, Edit2 } from "lucide-react";
import type { Tank } from "@workspace/api-client-react";

export default function Tanks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tanks } = useListTanks({ query: { queryKey: getListTanksQueryKey() } });
  const createTank = useCreateTank();
  const updateTank = useUpdateTank();
  const deleteTank = useDeleteTank();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [name, setName] = useState("");
  const [isFull, setIsFull] = useState(false);

  const openAdd = () => { setEditingTank(null); setName(""); setIsFull(false); setDialogOpen(true); };
  const openEdit = (t: Tank) => { setEditingTank(t); setName(t.name); setIsFull(t.isFull); setDialogOpen(true); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingTank) {
      updateTank.mutate({ id: editingTank.id, data: { name, isFull } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTanksQueryKey() }); toast({ title: "تم التحديث" }); setDialogOpen(false); }
      });
    } else {
      createTank.mutate({ data: { name, isFull } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTanksQueryKey() }); toast({ title: "تمت الإضافة" }); setDialogOpen(false); }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("حذف هذا الخزان؟")) {
      deleteTank.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTanksQueryKey() }); toast({ title: "تم الحذف" }); } });
    }
  };

  const handleToggle = (tank: Tank) => {
    updateTank.mutate({ id: tank.id, data: { isFull: !tank.isFull } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTanksQueryKey() }); }
    });
  };

  const full = tanks?.filter(t => t.isFull) ?? [];
  const empty = tanks?.filter(t => !t.isFull) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الخزانات</h1>
          <p className="text-muted-foreground mt-1">إدارة خزانات المياه وحالتها</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />إضافة خزان</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tanks?.map(tank => (
          <Card key={tank.id} className={`overflow-hidden border-2 transition-colors ${tank.isFull ? 'border-blue-400 dark:border-blue-600' : 'border-muted'}`}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tank.isFull ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-muted'}`}>
                  <Droplets className={`w-6 h-6 ${tank.isFull ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{tank.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tank.isFull ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                    {tank.isFull ? "ممتلئ" : "فارغ"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant={tank.isFull ? "outline" : "default"} onClick={() => handleToggle(tank)} className="text-xs h-8 px-3">
                  {tank.isFull ? "تفريغ" : "تعبئة"}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(tank)}><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(tank.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!tanks || tanks.length === 0) && (
          <div className="col-span-full py-14 text-center border-2 border-dashed rounded-xl">
            <Droplets className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground">لا توجد خزانات. أضف خزاناً للبدء.</p>
          </div>
        )}
      </div>

      {tanks && tanks.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{full.length} ممتلئ</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />{empty.length} فارغ</span>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTank ? "تعديل الخزان" : "إضافة خزان جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم الخزان</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: خزان رقم 1" />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsFull(true)} className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${isFull ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'border-muted'}`}>
                  ممتلئ
                </button>
                <button type="button" onClick={() => setIsFull(false)} className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${!isFull ? 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' : 'border-muted'}`}>
                  فارغ
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={createTank.isPending || updateTank.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
