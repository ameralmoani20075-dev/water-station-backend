import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, Store, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type TabType = "station" | "admin";

export default function Login() {
  const [tab, setTab] = useState<TabType>("station");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const stationForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const adminForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const loginMutation = useLogin();

  const onStationSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (userData) => {
          queryClient.setQueryData(["/api/auth/me"], userData);
          setLocation("/");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "خطأ في تسجيل الدخول",
            description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          });
        },
      }
    );
  };

  const onAdminSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (userData) => {
          if (userData.role !== "admin") {
            toast({
              variant: "destructive",
              title: "غير مصرح",
              description: "هذا الحساب ليس حساب مدير",
            });
            loginMutation.reset();
            return;
          }
          queryClient.setQueryData(["/api/auth/me"], userData);
          setLocation("/admin");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "خطأ في تسجيل الدخول",
            description: "بيانات المدير غير صحيحة",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-primary/5 pattern-boxes pattern-primary/10 pattern-size-4 pattern-opacity-20" />
      <div className="absolute top-0 w-full h-1/3 bg-gradient-to-b from-primary/10 to-transparent" />
      
      <div className="w-full max-w-md bg-card border shadow-xl rounded-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <Droplets className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">نظام إدارة محطة المياه</h1>
        </div>

        <div className="flex rounded-xl border overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setTab("station")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === "station"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Store className="w-4 h-4" />
            تسجيل دخول محطة
          </button>
          <button
            type="button"
            onClick={() => setTab("admin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === "admin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            إضافة محطة جديدة
          </button>
        </div>

        {tab === "station" ? (
          <Form {...stationForm}>
            <form onSubmit={stationForm.handleSubmit(onStationSubmit)} className="space-y-5">
              <FormField
                control={stationForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <Label>اسم المستخدم</Label>
                    <FormControl>
                      <Input placeholder="أدخل اسم المستخدم" {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stationForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label>كلمة المرور</Label>
                    <FormControl>
                      <Input type="password" placeholder="أدخل كلمة المرور" {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-5">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
              أدخل بيانات حساب المدير لإضافة محطة جديدة
            </div>
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-5">
                <FormField
                  control={adminForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <Label>اسم المستخدم (مدير)</Label>
                      <FormControl>
                        <Input placeholder="أدخل اسم المستخدم" {...field} dir="ltr" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label>كلمة المرور</Label>
                      <FormControl>
                        <Input type="password" placeholder="أدخل كلمة المرور" {...field} dir="ltr" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-medium"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "جاري التحقق..." : "دخول للوحة المدير"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
