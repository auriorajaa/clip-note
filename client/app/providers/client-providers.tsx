"use client";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import React, {useState} from "react";
import {AuthProvider} from "@/lib/hooks/auth";

export function ClientProviders({children}: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5, // 5 minutes
                retry: 1
            }
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
    );
}