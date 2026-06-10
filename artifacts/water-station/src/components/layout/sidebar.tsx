import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Store, Package, Wallet, Clock, BarChart3, Settings,
  ShieldAlert, LogOut, Droplets, TrendingUp, Waves,
  Filter, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const navItems = [
  { href: "/", label: "نقطة البيع", icon: Store, roles: ["station", "admin"] },
  { href: "/products", label: "المنتجات", icon: Package, roles: ["station", "admin"] },
  { href: "/tanks", label: "الخزانات", icon: Waves, roles: ["station", "admin"] },
  { href: "/filters", label: "الفلاتر", icon: Filter, roles: ["station", "admin"] },
  { href: "/expenses", label: "النفقات", icon: Wallet, roles: ["station", "admin"] },
  { href: "/debts", label: "الديون", icon: BookOpen, roles: ["station", "admin"] },
  { href: "/shifts", label: "المناوبات", icon: Clock, roles: ["station", "admin"] },
  { href: "/stats", label: "الإحصائيات", icon: BarChart3, roles: ["station", "admin"] },
  { href: "/revenue", label: "الإيرادات", icon: TrendingUp, roles: ["station", "admin"] },
  { href: "/settings", label: "الإعدادات", icon: Settings, roles: ["station", "admin"] },
  { href: "/admin", label: "لوحة المدير", icon: ShieldAlert, roles: ["admin"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/login";
      }
    });
  };

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role || ""));

  return (
    <div className="fixed top-0 right-0 h-screen w-64 bg-card border-l flex flex-col z-10 shadow-sm hidden md:flex">
      <div className="p-5 flex items-center gap-3 border-b">
        {user?.logoUrl ? (
          <img src={user.logoUrl} alt="logo" className="w-10 h-10 rounded-xl object-cover shrink-0 border" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-base leading-tight truncate" title={user?.name}>{user?.name}</span>
          <span className="text-xs text-muted-foreground">نظام إدارة محطة المياه</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t">
        <div className="mb-3 px-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold shrink-0 text-sm">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{user?.username}</span>
            <span className="text-xs text-muted-foreground">
              {user?.role === 'admin' ? <span className="text-destructive font-bold">مدير</span> : "محطة"}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-sm h-9"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
