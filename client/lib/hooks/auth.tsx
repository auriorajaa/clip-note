import {User} from "@/lib/api/types";
import React, {createContext, useContext, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {setTokenGetter} from "@/lib/api/client";
import {authApi} from "@/lib/api/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // set up token getter for API client
    useEffect(() => {
        setTokenGetter(() => token);
    }, [token]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
            setToken(storedToken);
            authApi.getCurrentUser()
                .then((response) => {
                    setUser(response.user);
                })
                .catch(() => {
                    setLoading(false);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    // update local storage when token changes
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    const login = (newToken: string, user: User) => {
        setToken(newToken);
        setUser(user);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        router.push("/auth/login");
    };

    return (
        <AuthContext.Provider value={{user, loading, token, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within a AuthProvider");
    }

    return context;
}

export function useRequireAuth() {
    const {user, loading} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [loading, user, router]);

    return {user, loading};
}