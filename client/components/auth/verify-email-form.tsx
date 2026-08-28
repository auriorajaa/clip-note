"use client";

import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {toast} from "sonner";
import {apiClient} from "@/lib/api/client";

export function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const hasVerified = useRef(false); // ← flag buat cegah double-call

    useEffect(() => {
        if (!token) {
            toast.error("Invalid verification link");
            router.push("/auth/login");
            return;
        }

        // Kalau udah pernah dijalankan (misal Strict Mode nge-trigger dua kali), skip
        if (hasVerified.current) return;
        hasVerified.current = true;

        const verifyEmail = async () => {
            try {
                await apiClient.get(`/auth/verify-email?token=${token}`);
                toast.success("Email verified successfully");
                router.push("/auth/login?verified=true");
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Could not verify email");
                router.push("/auth/login");
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <section className="flex items-center relative">
            <div className="py-10 md:py-20 max-w-lg px-4 sm:px-0 mx-auto w-full">
                <Card className="px-6 py-8 sm:p-12 relative">
                    <CardHeader className="text-center p-0">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-2xl font-medium text-card-foreground">
                                Verify your email
                            </CardTitle>
                            <CardDescription className="text-sm font-normal text-muted-foreground">
                                An activation link has been sent to your email address. Please check your
                                inbox and click on the link to complete the activation process.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </section>
    );
}