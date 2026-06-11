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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tanks?.map(tank => (
          <TankVisual key={tank.id} tank={tank} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />
        ))}

        {(!tanks || tanks.length === 0) && (
          <div className="col-span-full py-14 text-center border-2 border-dashed rounded-xl">
            <CylinderIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
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

function CylinderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    </svg>
  );
}

function TankVisual({ tank, onToggle, onEdit, onDelete }: {
  tank: Tank;
  onToggle: (t: Tank) => void;
  onEdit: (t: Tank) => void;
  onDelete: (id: number) => void;
}) {
  const fillLevel = tank.isFull ? 85 : 15;
  const waterColor = tank.isFull
    ? "from-blue-400 to-blue-600"
    : "from-orange-200 to-orange-400";
  const borderColor = tank.isFull
    ? "border-blue-300 dark:border-blue-700"
    : "border-orange-300 dark:border-orange-700";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative w-full rounded-2xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md ${borderColor}`}
        style={{ height: 140 }}
        onClick={() => onToggle(tank)}
        title={tank.isFull ? "اضغط للتفريغ" : "اضغط للتعبئة"}
      >
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700"
          style={{ height: `${fillLevel}%` }}
        >
          <div className={`w-full h-full bg-gradient-to-t ${waterColor} opacity-80`} />
          <div
            className="absolute top-0 left-0 right-0 h-3 rounded-full"
            style={{
              background: tank.isFull
                ? "rgba(147,210,255,0.7)"
                : "rgba(253,200,160,0.7)",
              filter: "blur(2px)",
            }}
          />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-10">
          <CylinderIcon className={`w-8 h-8 ${tank.isFull ? 'text-blue-800 dark:text-blue-200' : 'text-orange-800 dark:text-orange-200'} drop-shadow`} />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shadow ${tank.isFull ? 'bg-blue-100/90 text-blue-900' : 'bg-orange-100/90 text-orange-900'}`}>
            {tank.isFull ? "ممتلئ" : "فارغ"}
          </span>
        </div>

        <div className="absolute top-1.5 left-0 right-0 flex justify-center">
          <div className={`w-3/4 h-2 rounded-full ${tank.isFull ? 'bg-blue-300/60' : 'bg-orange-200/60'}`} />
        </div>
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
          <div className={`w-3/4 h-2 rounded-full ${tank.isFull ? 'bg-blue-600/60' : 'bg-orange-400/60'}`} />
        </div>
      </div>

      <p className="text-sm font-semibold text-center truncate w-full px-1">{tank.name}</p>

      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(tank)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(tank.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
