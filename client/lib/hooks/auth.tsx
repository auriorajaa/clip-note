import { User } from "@/lib/api/types";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // All setState calls are deferred inside this async callback so none of
    // them run synchronously within the effect body itself.
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");

      // If no token is stored, we can't proceed, so exit early.
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Restore the token in memory after a full page reload.
      setToken(storedToken);

      // Token is stored, so proceed with authentication.
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch {
        // Clear invalid sessions so the auth guard can redirect cleanly.
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Logs the user in by storing the token and user data, and redirecting to the home page.
  const login = (newToken: string, user: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(user);
  };

  // Logs the user out by clearing the token and user data, and redirecting to the login page.
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/auth/login");
  };

  // Returns the user, loading state, token, and login/logout functions.
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for accessing the authentication context.
// Throws an error if used outside of an AuthProvider.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for requiring authentication.
// Redirects to the login page if the user is not authenticated.
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}