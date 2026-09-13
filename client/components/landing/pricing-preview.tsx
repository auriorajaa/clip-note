"use client";

import Link from "next/link";
import { useSubscriptionPlans } from "@/lib/hooks/queries/subscriptions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";

function formatMinutes(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} minutes`;
}

export function PricingPreview() {
  const { data: plans, isLoading } = useSubscriptionPlans();

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {plans?.map((plan) => {
        const isFree = plan.price === 0;
        const isPopular = plan.name === "Pro";

        return (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col p-6 rounded-2xl border",
              isPopular ? "border-primary" : "border-border",
            )}
          >
            <div className="mb-6">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {plan.name}
              </span>
              <div className="mt-2">
                <span className="text-3xl font-semibold tracking-tight">
                  {isFree ? "Free" : `$${formatPrice(plan.price)}`}
                </span>
                {!isFree && (
                  <span className="text-sm text-muted-foreground">
                    /{plan.billingInterval === "monthly" ? "mo" : "yr"}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-8 flex-1 text-sm text-muted-foreground">
              <p>{plan.videoLimit} videos per month</p>
              <p>Up to {formatMinutes(plan.minutesLimit)} of processing</p>
              <p>AI transcription & analysis</p>
            </div>

            <Link href="/auth/register" className="block">
              <Button
                variant={isPopular ? "default" : "outline"}
                className="w-full"
              >
                Get Started
              </Button>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
