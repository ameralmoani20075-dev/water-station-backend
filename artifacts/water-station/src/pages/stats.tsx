import { useState } from "react";
import { 
  useGetSalesStats, 
  getGetSalesStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import type { GetSalesStatsPeriod } from "@workspace/api-client-react/src/generated/api.schemas";

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

export default function Stats() {
  const [period, setPeriod] = useState<GetSalesStatsPeriod>("week");
  
  const { data: stats, isLoading } = useGetSalesStats(
    { period }, 
    { query: { queryKey: getGetSalesStatsQueryKey({ period }) } }
  );

  const formatChartDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  };

  const chartData = stats?.dailyRevenue.map(d => ({
    name: formatChartDate(d.date),
    value: d.revenue
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">الإحصائيات</h1>
          <p className="text-muted-foreground mt-1">تتبع أداء المحطة والمبيعات</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={period} onValueChange={(val: GetSalesStatsPeriod) => setPeriod(val)}>
            <SelectTrigger>
              <CalendarIcon className="w-4 h-4 ml-2 text-muted-foreground" />
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر 7 أيام</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">إجمالي الإيرادات للفترة</p>
                <h3 className="text-3xl font-bold text-foreground">{formatCurrency(stats?.totalRevenue || 0)}</h3>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>الإيرادات اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-muted-foreground">جاري التحميل...</span>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full mt-4" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 12}} 
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: number) => [`${value} دينار`, 'الإيرادات']}
                      labelStyle={{fontWeight: 'bold', marginBottom: '4px', color: '#111827'}}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-muted-foreground">لا توجد بيانات لهذه الفترة</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أكثر المنتجات مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats?.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">تم بيع {product.quantity} وحدة</p>
                      </div>
                    </div>
                    <div className="font-bold text-sm">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مبيعات في هذه الفترة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
