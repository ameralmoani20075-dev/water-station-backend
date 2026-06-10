import { useState, useEffect } from "react";
import {
  useGetTodaySummary,
  getGetTodaySummaryQueryKey,
  useGetSalesStats,
  getGetSalesStatsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, TrendingUp, Calendar, RefreshCw, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

function getPinKey(userId: number) {
  return `revenue_pin_${userId}`;
}

function getStoredPin(userId: number): string {
  return localStorage.getItem(getPinKey(userId)) || "0000";
}

function setStoredPin(userId: number, pin: string) {
  localStorage.setItem(getPinKey(userId), pin);
}

export default function Revenue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id ?? 0;

  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [changePinOpen, setChangePinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const { data: todaySummary } = useGetTodaySummary(
    { query: { queryKey: getGetTodaySummaryQueryKey(), enabled: unlocked } }
  );
  const { data: monthStats } = useGetSalesStats(
    { period: "month" },
    { query: { queryKey: getGetSalesStatsQueryKey({ period: "month" }), enabled: unlocked } }
  );
  const { data: yearStats } = useGetSalesStats(
    { period: "year" },
    { query: { queryKey: getGetSalesStatsQueryKey({ period: "year" }), enabled: unlocked } }
  );

  const handleUnlock = () => {
    const stored = getStoredPin(userId);
    if (pinInput === stored) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleLock = () => {
    setUnlocked(false);
    setPinInput("");
  };

  const handleChangePin = () => {
    const stored = getStoredPin(userId);
    if (currentPin !== stored) {
      toast({ variant: "destructive", title: "الرمز الحالي غير صحيح" });
      return;
    }
    if (newPin.length < 4) {
      toast({ variant: "destructive", title: "الرمز الجديد يجب أن يكون 4 أرقام على الأقل" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ variant: "destructive", title: "الرمز الجديد غير متطابق" });
      return;
    }
    setStoredPin(userId, newPin);
    toast({ title: "تم تغيير الرمز السري بنجاح" });
    setChangePinOpen(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  if (!unlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">الإيرادات</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">أدخل الرمز السري للوصول</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>الرمز السري</Label>
              <Input
                type="password"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="أدخل الرمز السري"
                dir="ltr"
                className={`text-center text-2xl tracking-widest h-14 ${pinError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                maxLength={8}
              />
              {pinError && (
                <p className="text-sm text-destructive text-center">الرمز السري غير صحيح</p>
              )}
            </div>
            <Button className="w-full h-12 text-base" onClick={handleUnlock}>
              فتح الإيرادات
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              الرمز الافتراضي: 0000
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyDays = monthStats?.dailyRevenue || [];
  const yearlyMonths: Record<string, number> = {};
  (yearStats?.dailyRevenue || []).forEach((d) => {
    const month = d.date.substring(0, 7);
    yearlyMonths[month] = (yearlyMonths[month] || 0) + d.revenue;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">الإيرادات</h1>
          <p className="text-muted-foreground mt-1">عرض الإيرادات اليومية والشهرية والسنوية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setChangePinOpen(true)} className="gap-2">
            <KeyRound className="w-4 h-4" />
            تغيير الرمز
          </Button>
          <Button variant="outline" size="sm" onClick={handleLock} className="gap-2">
            <Lock className="w-4 h-4" />
            قفل
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 font-medium mb-1">إيرادات اليوم</p>
                <h3 className="text-3xl font-bold">{formatCurrency(todaySummary?.totalRevenue || 0)}</h3>
              </div>
              <div className="w-12 h-12 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">إيرادات الشهر</p>
                <h3 className="text-3xl font-bold text-foreground">{formatCurrency(monthStats?.totalRevenue || 0)}</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">إيرادات السنة</p>
                <h3 className="text-3xl font-bold text-foreground">{formatCurrency(yearStats?.totalRevenue || 0)}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              إيرادات هذا الشهر — يوم بيوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyDays.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[...monthlyDays].reverse().map((d) => (
                  <div key={d.date} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{d.date}</span>
                    <span className="font-semibold">{formatCurrency(d.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">لا توجد بيانات هذا الشهر</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              إيرادات هذا العام — شهر بشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(yearlyMonths).length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(yearlyMonths)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([month, total]) => (
                    <div key={month} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm text-muted-foreground">{month}</span>
                      <span className="font-semibold">{formatCurrency(total)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">لا توجد بيانات هذا العام</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={changePinOpen} onOpenChange={setChangePinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير الرمز السري</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الرمز الحالي</Label>
              <Input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="أدخل الرمز الحالي"
                dir="ltr"
                className="text-center tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label>الرمز الجديد</Label>
              <Input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="أدخل الرمز الجديد"
                dir="ltr"
                className="text-center tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label>تأكيد الرمز الجديد</Label>
              <Input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="أعد إدخال الرمز الجديد"
                dir="ltr"
                className="text-center tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePinOpen(false)}>إلغاء</Button>
            <Button onClick={handleChangePin}>حفظ الرمز</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
