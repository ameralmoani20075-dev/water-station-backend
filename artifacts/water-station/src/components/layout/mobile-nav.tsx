import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Store, Package, Waves, BookOpen, BarChart3, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { navItems } from "./sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Droplets } from "lucide-react";

const primaryNav = [
  { href: "/", label: "البيع", icon: Store },
  { href: "/tanks", label: "الخزانات", icon: Waves },
  { href: "/products", label: "المنتجات", icon: Package },
  { href: "/debts", label: "الديون", icon: BookOpen },
  { href: "/stats", label: "الإحصاء", icon: BarChart3 },
];

export default function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
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

  const visibleAll = navItems.filter(item => item.roles.includes(user?.role || ""));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t md:hidden flex items-stretch h-16 safe-area-bottom">
        {primaryNav.map(item => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">المزيد</span>
        </button>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-3">
              {user?.logoUrl ? (
                <img src={user.logoUrl} alt="logo" className="w-10 h-10 rounded-xl object-cover border" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Droplets className="w-5 h-5" />
                </div>
              )}
              <div>
                <SheetTitle className="text-right">{user?.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{user?.username}</p>
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-2 pb-2">
            {visibleAll.map(item => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
