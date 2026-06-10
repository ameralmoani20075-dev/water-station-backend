import { useState } from "react";
import { 
  useGetTodaySummary, 
  getGetTodaySummaryQueryKey,
  useListProducts,
  getListProductsQueryKey,
  useCreateSale,
  useListSales,
  getListSalesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Droplets, Ticket, DollarSign, Plus, Package, Clock, Store } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: summary } = useGetTodaySummary({ query: { queryKey: getGetTodaySummaryQueryKey() } });
  const { data: products } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const { data: sales } = useListSales({ date: new Date().toISOString().split('T')[0] }, { query: { queryKey: getListSalesQueryKey({ date: new Date().toISOString().split('T')[0] }) } });
  
  const createSale = useCreateSale();
  
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponQuantity, setCouponQuantity] = useState("1");
  const [couponProductId, setCouponProductId] = useState<number | null>(null);

  const handleSale = (productId: number, quantity: number = 1, isCoupon: boolean = false) => {
    createSale.mutate({ data: { productId, quantity, isCoupon } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTodaySummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey({ date: new Date().toISOString().split('T')[0] }) });
        toast({
          title: "تمت عملية البيع بنجاح",
        });
        setCouponDialogOpen(false);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشلت عملية البيع، يرجى المحاولة مرة أخرى",
        });
      }
    });
  };

  const handleCouponSaleClick = (productId: number) => {
    setCouponProductId(productId);
    setCouponQuantity("1");
    setCouponDialogOpen(true);
  };

  const confirmCouponSale = () => {
    if (couponProductId && parseInt(couponQuantity) > 0) {
      handleSale(couponProductId, parseInt(couponQuantity), true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">نقطة البيع</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 font-medium mb-1">إيرادات اليوم</p>
                <h3 className="text-3xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</h3>
              </div>
              <div className="w-12 h-12 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">قناني المياه المباعة</p>
                <h3 className="text-3xl font-bold text-foreground">{summary?.waterBottleCount || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">الكوبونات المستخدمة</p>
                <h3 className="text-3xl font-bold text-foreground">{summary?.couponCount || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <Ticket className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">المنتجات</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products?.map(product => (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <CardHeader className="p-4 pb-2 bg-muted/30 border-b">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">المخزون: <span className="font-medium text-foreground">{product.stock}</span></p>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col gap-3 justify-end">
                  <Button 
                    onClick={() => handleSale(product.id, 1, false)}
                    className="w-full h-12 text-base shadow-sm hover-elevate"
                    disabled={product.stock <= 0 || createSale.isPending}
                  >
                    <Plus className="w-5 h-5 ml-2" />
                    بيع (نقدي)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleCouponSaleClick(product.id)}
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                    disabled={product.stock <= 0 || createSale.isPending}
                  >
                    <Ticket className="w-4 h-4 ml-2" />
                    بيع بكوبون مدفوع مسبقاً
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {(!products || products.length === 0) && (
              <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">لا توجد منتجات</h3>
                <p className="text-muted-foreground">أضف منتجات من صفحة المنتجات للبدء بالبيع</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <Card className="h-full flex flex-col border shadow-sm">
            <CardHeader className="border-b bg-muted/10 py-4">
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 ml-2 text-muted-foreground" />
                مبيعات اليوم
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                {sales?.length ? sales.map(sale => (
                  <div key={sale.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium">{sale.productName}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>الكمية: {sale.quantity}</span>
                        <span>•</span>
                        <span>{format(new Date(sale.createdAt), "h:mm a")}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      {sale.isCoupon ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          <Ticket className="w-3 h-3 ml-1" />
                          كوبون
                        </span>
                      ) : (
                        <span className="font-bold text-primary">{formatCurrency(sale.totalPrice)}</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-70">
                    <Store className="w-10 h-10 mb-2" />
                    <p>لا توجد مبيعات اليوم</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بيع باستخدام الكوبون</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">الكمية</Label>
            <Input 
              type="number" 
              min="1" 
              value={couponQuantity} 
              onChange={(e) => setCouponQuantity(e.target.value)} 
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground mt-2">ملاحظة: المبيعات بالكوبون لا تحسب ضمن إيرادات اليوم النقدية.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>إلغاء</Button>
            <Button onClick={confirmCouponSale} disabled={createSale.isPending}>تأكيد البيع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
