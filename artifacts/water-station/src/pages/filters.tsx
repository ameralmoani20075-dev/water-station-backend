import { useState } from "react";
import {
  useListFilters, getListFiltersQueryKey,
  useCreateFilter, useUpdateFilter, useDeleteFilter,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Filter, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import type { StationFilter } from "@workspace/api-client-react";

const REMINDER_DAYS = 30;

function getDaysSinceChange(filter: StationFilter): number | null {
  if (!filter.lastChangedAt) return null;
  return differenceInDays(new Date(), parseISO(filter.lastChangedAt));
}

function needsReminder(filter: StationFilter): boolean {
  const days = getDaysSinceChange(filter);
  if (days === null) return false;
  return days >= REMINDER_DAYS;
}

export default function Filters() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: filters } = useListFilters({ query: { queryKey: getListFiltersQueryKey() } });
  const createFilter = useCreateFilter();
  const updateFilter = useUpdateFilter();
  const deleteFilter = useDeleteFilter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<StationFilter | null>(null);
  const [name, setName] = useState("");
  const [isFull, setIsFull] = useState(true);

  const openAdd = () => { setEditingFilter(null); setName(""); setIsFull(true); setDialogOpen(true); };
  const openEdit = (f: StationFilter) => { setEditingFilter(f); setName(f.name); setIsFull(f.isFull); setDialogOpen(true); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingFilter) {
      updateFilter.mutate({ id: editingFilter.id, data: { name, isFull } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFiltersQueryKey() }); toast({ title: "تم التحديث" }); setDialogOpen(false); }
      });
    } else {
      createFilter.mutate({ data: { name, isFull } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFiltersQueryKey() }); toast({ title: "تمت الإضافة" }); setDialogOpen(false); }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("حذف هذا الفلتر؟")) {
      deleteFilter.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFiltersQueryKey() }); toast({ title: "تم الحذف" }); } });
    }
  };

  const handleToggle = (filter: StationFilter) => {
    updateFilter.mutate({ id: filter.id, data: { isFull: !filter.isFull } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFiltersQueryKey() });
        if (!filter.isFull) {
          toast({ title: "تم تسجيل تغيير الفلتر ✓" });
        }
      }
    });
  };

  const overdueFilters = filters?.filter(f => f.isFull && needsReminder(f)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الفلاتر</h1>
          <p className="text-muted-foreground mt-1">إدارة فلاتر المياه وحالتها</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />إضافة فلتر</Button>
      </div>

      {overdueFilters.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">تنبيه: فلاتر تحتاج تغييراً</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              {overdueFilters.map(f => f.name).join("، ")} — مرّ أكثر من {REMINDER_DAYS} يوماً على آخر تغيير
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filters?.map(filter => {
          const daysSince = getDaysSinceChange(filter);
          const overdue = filter.isFull && needsReminder(filter);
          return (
            <Card key={filter.id} className={`overflow-hidden border-2 transition-colors ${
              overdue
                ? 'border-amber-400 dark:border-amber-600'
                : filter.isFull
                  ? 'border-green-400 dark:border-green-600'
                  : 'border-destructive/50'
            }`}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    overdue
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : filter.isFull
                        ? 'bg-green-100 dark:bg-green-900/40'
                        : 'bg-red-100 dark:bg-red-900/40'
                  }`}>
                    {overdue ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Filter className={`w-6 h-6 ${filter.isFull ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{filter.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      overdue
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : filter.isFull
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {filter.isFull ? (overdue ? "يحتاج تغيير (تنبيه)" : "يعمل بشكل جيد") : "يحتاج تغيير"}
                    </span>
                    {filter.lastChangedAt && daysSince !== null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        آخر تغيير: {formatDistanceToNow(parseISO(filter.lastChangedAt), { addSuffix: true, locale: ar })}
                        {daysSince > 0 && ` (${daysSince} يوم)`}
                      </p>
                    )}
                    {!filter.lastChangedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">لم يُسجّل تغيير بعد</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-1">
                  <Button size="sm" variant={filter.isFull ? "outline" : "default"} onClick={() => handleToggle(filter)} className="text-xs h-8 px-3">
                    {filter.isFull ? "تعطّل" : "تم التغيير"}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(filter)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(filter.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!filters || filters.length === 0) && (
          <div className="col-span-full py-14 text-center border-2 border-dashed rounded-xl">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground">لا توجد فلاتر. أضف فلتراً للبدء.</p>
          </div>
        )}
      </div>

      {filters && filters.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{filters.filter(f => f.isFull && !needsReminder(f)).length} يعمل</span>
          {overdueFilters.length > 0 && (
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{overdueFilters.length} يحتاج تغيير (تنبيه)</span>
          )}
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{filters.filter(f => !f.isFull).length} يحتاج تغيير</span>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFilter ? "تعديل الفلتر" : "إضافة فلتر جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم الفلتر</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: فلتر رقم 1" />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsFull(true)} className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${isFull ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'border-muted'}`}>
                  يعمل بشكل جيد
                </button>
                <button type="button" onClick={() => setIsFull(false)} className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${!isFull ? 'border-red-400 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300' : 'border-muted'}`}>
                  يحتاج تغيير
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={createFilter.isPending || updateFilter.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
