"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const queryClient = useQueryClient();

  useEffect(() => {
    // Webhook Stripe (checkout.session.completed) mungkin butuh beberapa detik
    // buat diproses backend — invalidate query biar data ke-refresh begitu siap
    queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
  }, [queryClient]);

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8 text-center space-y-4">
        <div className="mx-auto w-fit rounded-full bg-emerald-100 dark:bg-emerald-900/40 p-3">
          <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Subscription successful!</h1>
          <p className="text-sm text-muted-foreground">
            Thanks for subscribing. Your account is being set up and should be
            ready in just a moment.
          </p>
        </div>

        {sessionId && (
          <p className="text-xs text-muted-foreground/70 break-all">
            Reference: {sessionId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          <Link href="/subscriptions/manage" className="flex-1">
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
