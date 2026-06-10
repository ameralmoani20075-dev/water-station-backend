import { createContext, useContext, useEffect, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { SessionUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (isError || !user) {
        if (location !== "/login") {
          setLocation("/login");
        }
      } else if (user && location === "/login") {
        setLocation("/");
      }
    }
  }, [user, isLoading, isError, location, setLocation]);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
