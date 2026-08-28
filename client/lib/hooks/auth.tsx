import {User} from "@/lib/api/types";
import React, {createContext, useContext, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {authApi} from "@/lib/api/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
                                 children,
                             }: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");

        if (!storedToken) {
            setLoading(false);
            return;
        }

        setToken(storedToken);

        authApi
            .getCurrentUser()
            .then((response) => {
                setUser(response);
            })
            .catch(() => {
                setToken(null);
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // useEffect(() => {
    //     if (token) {
    //         localStorage.setItem("token", token);
    //     } else {
    //         localStorage.removeItem("token");
    //     }
    // }, [token]);

    const login = (newToken: string, user: User) => {
        localStorage.setItem("token", newToken);

        setToken(newToken);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem("token");

        setToken(null);
        setUser(null);

        router.push("/auth/login");
    };

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