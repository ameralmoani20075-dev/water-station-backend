import { useState } from "react";
import {
  useGetTodaySummary,
  getGetTodaySummaryQueryKey,
  useGetSalesStats,
  getGetSalesStatsQueryKey,
  useListExpenses,
  getListExpensesQueryKey,
  useListDebts,
  getListDebtsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, TrendingUp, Calendar, RefreshCw, KeyRound, TrendingDown, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

  const currentMonth = format(new Date(), "yyyy-MM");
  const currentYear = format(new Date(), "yyyy");

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
  const { data: monthExpenses } = useListExpenses(
    { month: currentMonth },
    { query: { queryKey: getListExpensesQueryKey({ month: currentMonth }), enabled: unlocked } }
  );
  const { data: allDebts } = useListDebts(
    { query: { queryKey: getListDebtsQueryKey(), enabled: unlocked } }
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
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">الإيرادات</h2>
              <p className="text-sm text-muted-foreground mt-1">أدخل الرمز السري للوصول</p>
            </div>
            <div className="space-y-4">
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
              <p className="text-xs text-center text-muted-foreground">الرمز الافتراضي: 0000</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyRevenue = monthStats?.totalRevenue || 0;
  const monthlyExpenses = (monthExpenses || []).reduce((s, e) => s + e.amount, 0);
  const totalDebtPayments = (allDebts || []).filter(d => d.isPaid).reduce((s, d) => s + d.paidAmount, 0);
  const partialDebtPayments = (allDebts || []).filter(d => !d.isPaid && d.paidAmount > 0).reduce((s, d) => s + d.paidAmount, 0);
  const netProfit = monthlyRevenue + totalDebtPayments + partialDebtPayments - monthlyExpenses;

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
          <p className="text-muted-foreground mt-1">عرض الإيرادات والأرباح الصافية</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 font-medium mb-1 text-sm">إيرادات اليوم</p>
                <h3 className="text-2xl font-bold">{formatCurrency(todaySummary?.totalRevenue || 0)}</h3>
              </div>
              <div className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1 text-sm">إيرادات الشهر</p>
                <h3 className="text-2xl font-bold text-foreground">{formatCurrency(monthlyRevenue)}</h3>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1 text-sm">نفقات الشهر</p>
                <h3 className="text-2xl font-bold text-foreground">{formatCurrency(monthlyExpenses)}</h3>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-2 ${netProfit >= 0 ? 'border-emerald-300 dark:border-emerald-700' : 'border-red-300 dark:border-red-700'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1 text-sm">الربح الصافي (الشهر)</p>
                <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {netProfit >= 0 ? "" : "−"}{formatCurrency(Math.abs(netProfit))}
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                <Wallet className={`w-5 h-5 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">إيرادات + مدفوعات الديون − النفقات</p>
          </CardContent>
        </Card>
      </div>

      {(totalDebtPayments > 0 || partialDebtPayments > 0) && (
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">مدفوعات الديون المضافة للإيرادات</p>
            <div className="flex gap-6 flex-wrap">
              {totalDebtPayments > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">ديون مسدّدة بالكامل</p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalDebtPayments)}</p>
                </div>
              )}
              {partialDebtPayments > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">دفعات جزئية</p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(partialDebtPayments)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              إيرادات {currentYear} — شهر بشهر
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
              <Input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="أدخل الرمز الحالي" dir="ltr" className="text-center tracking-widest" />
            </div>
            <div className="space-y-2">
              <Label>الرمز الجديد</Label>
              <Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="أدخل الرمز الجديد" dir="ltr" className="text-center tracking-widest" />
            </div>
            <div className="space-y-2">
              <Label>تأكيد الرمز الجديد</Label>
              <Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="أعد إدخال الرمز الجديد" dir="ltr" className="text-center tracking-widest" />
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
