import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import Sidebar from "./sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // AuthProvider handles redirect
  }

  if (!user.isActive && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-xl border shadow-sm">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">حسابك موقوف</h1>
          <p className="text-muted-foreground">
            عذراً، لا يمكنك الوصول إلى النظام لأن حسابك موقوف. يرجى مراجعة المدير.
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              logoutMutation.mutate(undefined, {
                onSuccess: () => {
                  queryClient.clear();
                  window.location.href = "/login";
                }
              });
            }}
          >
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 md:mr-64 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
