import { 
  useGetTodaySummary, 
  getGetTodaySummaryQueryKey,
  useListProducts,
  getListProductsQueryKey,
  useCreateSale,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Droplets, DollarSign, Plus, Package, ShoppingCart } from "lucide-react";

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-IQ') + " دينار";
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: summary } = useGetTodaySummary({ query: { queryKey: getGetTodaySummaryQueryKey() } });
  const { data: products } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  
  const createSale = useCreateSale();

  const handleSale = (productId: number) => {
    createSale.mutate({ data: { productId, quantity: 1, isCoupon: false } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTodaySummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "تمت عملية البيع بنجاح" });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">نقطة البيع</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            المنتجات
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products?.map(product => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-4 pb-2 bg-muted/30 border-b">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base leading-tight">{product.name}</CardTitle>
                  <span className="font-bold text-primary text-sm whitespace-nowrap">{formatCurrency(product.price)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  المخزون: <span className={`font-medium ${product.stock <= 5 ? 'text-destructive' : 'text-foreground'}`}>{product.stock}</span>
                </p>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col justify-end">
                <Button 
                  onClick={() => handleSale(product.id)}
                  className="w-full h-12 text-base shadow-sm"
                  disabled={product.stock <= 0 || createSale.isPending}
                >
                  <Plus className="w-5 h-5 ml-2" />
                  بيع
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
    </div>
  );
}
