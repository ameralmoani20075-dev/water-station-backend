import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { 
  useAdminListStations, 
  getAdminListStationsQueryKey,
  useAdminToggleStation,
  useAdminCreateStation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Store, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

const createStationSchema = z.object({
  username: z.string().min(2, "اسم المستخدم يجب أن يكون حرفين على الأقل"),
  password: z.string().min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل"),
  name: z.string().min(1, "اسم المحطة مطلوب"),
});

type CreateStationValues = z.infer<typeof createStationSchema>;

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: stations } = useAdminListStations({ query: { queryKey: getAdminListStationsQueryKey() } });
  const toggleStation = useAdminToggleStation();
  const createStation = useAdminCreateStation();

  const form = useForm<CreateStationValues>({
    resolver: zodResolver(createStationSchema),
    defaultValues: { username: "", password: "", name: "" },
  });

  const handleToggle = (id: number, currentStatus: boolean) => {
    toggleStation.mutate(
      { id, data: { isActive: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListStationsQueryKey() });
          toast({ title: currentStatus ? "تم إيقاف المحطة" : "تم تفعيل المحطة" });
        }
      }
    );
  };

  const onSubmit = (data: CreateStationValues) => {
    createStation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListStationsQueryKey() });
          toast({ title: "تمت إضافة المحطة بنجاح" });
          setAddDialogOpen(false);
          form.reset();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error || "فشلت إضافة المحطة";
          toast({ variant: "destructive", title: "خطأ", description: msg });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">لوحة المدير</h1>
            <p className="text-muted-foreground mt-1">إدارة جميع المحطات ومراقبة مبيعاتها</p>
          </div>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة محطة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المحطات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>المحطة</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>مبيعات اليوم</TableHead>
                <TableHead>آخر ظهور</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations?.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-muted-foreground" />
                      {station.name}
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="text-right text-muted-foreground">
                    {station.username}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {formatCurrency(station.totalSalesToday)}
                  </TableCell>
                  <TableCell>
                    {station.lastLoginAt ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(station.lastLoginAt), "yyyy-MM-dd HH:mm")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs">لم يسجل دخول</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={station.isActive} 
                        onCheckedChange={() => handleToggle(station.id, station.isActive)}
                        disabled={toggleStation.isPending}
                      />
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        station.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {station.isActive ? "نشط" : "موقوف"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {stations?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    لا توجد محطات مسجلة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة محطة جديدة</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>اسم المحطة</Label>
                    <FormControl>
                      <Input placeholder="مثال: محطة الشمال" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <Label>اسم المستخدم (للدخول)</Label>
                    <FormControl>
                      <Input placeholder="مثال: station3" {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label>كلمة المرور</Label>
                    <FormControl>
                      <Input type="password" placeholder="4 أحرف على الأقل" {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createStation.isPending}>
                  {createStation.isPending ? "جاري الإضافة..." : "إضافة المحطة"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
