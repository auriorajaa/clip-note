import React from "react";
import {ClientProviders} from "@/app/providers/client-providers";

export function Providers({children}: { children: React.ReactNode }) {
    return <ClientProviders>{children}</ClientProviders>;
}