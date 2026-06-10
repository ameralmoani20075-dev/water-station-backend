import { useState } from "react";
import { 
  useListShifts, 
  getListShiftsQueryKey, 
  useCreateShift, 
  useEndShift,
  useGetActiveShift,
  getGetActiveShiftQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Play, Square, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const shiftSchema = z.object({
  workerName: z.string().min(1, "اسم العامل مطلوب"),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

export default function Shifts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: activeShiftData } = useGetActiveShift({ query: { queryKey: getGetActiveShiftQueryKey() } });
  const activeShift = activeShiftData?.shift;

  const { data: shifts } = useListShifts({}, { query: { queryKey: getListShiftsQueryKey({}) } });
  
  const createShift = useCreateShift();
  const endShift = useEndShift();

  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      workerName: "",
    },
  });

  const handleStartShift = (data: ShiftFormValues) => {
    createShift.mutate({ 
      data: {
        workerName: data.workerName,
        startTime: new Date().toISOString()
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActiveShiftQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListShiftsQueryKey({}) });
        toast({ title: "بدأت المناوبة بنجاح" });
        setDialogOpen(false);
        form.reset();
      }
    });
  };

  const handleEndShift = () => {
    if (activeShift && confirm("هل تريد إنهاء المناوبة الحالية؟")) {
      endShift.mutate({ id: activeShift.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetActiveShiftQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListShiftsQueryKey({}) });
          toast({ title: "تم إنهاء المناوبة بنجاح" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">المناوبات</h1>
          <p className="text-muted-foreground mt-1">إدارة مناوبات العمال في المحطة</p>
        </div>
      </div>

      <Card className={`${activeShift ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : ''}`}>
        <CardContent className="p-6">
          {activeShift ? (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
                  <UserCircle className="w-8 h-8" />
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-card animate-pulse"></span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{activeShift.workerName}</h3>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    بدأت في: {format(new Date(activeShift.startTime), "h:mm a", { locale: ar })}
                  </p>
                </div>
              </div>
              <Button size="lg" variant="destructive" onClick={handleEndShift} disabled={endShift.isPending} className="w-full md:w-auto">
                <Square className="w-4 h-4 ml-2" />
                إنهاء المناوبة
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد مناوبة نشطة حالياً</h3>
              <p className="text-muted-foreground mb-6">ابدأ مناوبة جديدة لتسجيل عمل الموظف الحالي.</p>
              <Button size="lg" onClick={() => setDialogOpen(true)}>
                <Play className="w-4 h-4 ml-2" />
                بدء مناوبة جديدة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل المناوبات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>اسم العامل</TableHead>
                <TableHead>وقت البدء</TableHead>
                <TableHead>وقت الانتهاء</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts?.map(shift => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.workerName}</TableCell>
                  <TableCell dir="ltr" className="text-right">
                    {format(new Date(shift.startTime), "yyyy-MM-dd | h:mm a", { locale: ar })}
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">
                    {shift.endTime 
                      ? format(new Date(shift.endTime), "yyyy-MM-dd | h:mm a", { locale: ar }) 
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {!shift.endTime ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        نشطة
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border">
                        منتهية
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {shifts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    لا يوجد سجل للمناوبات
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
            <DialogTitle>بدء مناوبة جديدة</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleStartShift)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="workerName"
                render={({ field }) => (
                  <FormItem>
                    <Label>اسم العامل</Label>
                    <FormControl>
                      <Input placeholder="أدخل اسم العامل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createShift.isPending}>
                  بدء
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
