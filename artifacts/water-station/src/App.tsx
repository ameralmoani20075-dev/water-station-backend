import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import AppLayout from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Expenses from "@/pages/expenses";
import Shifts from "@/pages/shifts";
import Stats from "@/pages/stats";
import Revenue from "@/pages/revenue";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/products">
        <ProtectedRoute component={Products} />
      </Route>
      <Route path="/expenses">
        <ProtectedRoute component={Expenses} />
      </Route>
      <Route path="/shifts">
        <ProtectedRoute component={Shifts} />
      </Route>
      <Route path="/stats">
        <ProtectedRoute component={Stats} />
      </Route>
      <Route path="/revenue">
        <ProtectedRoute component={Revenue} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} adminOnly={true} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
