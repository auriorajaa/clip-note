"use client";

import {
  useSubscriptionPlans,
  useUserSubscription,
} from "@/lib/hooks/queries/subscriptions";
import { PricingCard } from "@/components/pricing-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionsPage() {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: userSubscriptionData } = useUserSubscription();
  const currentPlanId = userSubscriptionData?.plan.id;
  const currentPlanPrice = userSubscriptionData
    ? Number(userSubscriptionData.plan.price)
    : undefined;

  // Free plan isn't something you "subscribe" to via checkout — it's just
  // the default state when there's no active paid subscription. Don't show
  // it as a selectable card here.
  const paidPlans = plans?.filter((plan) => plan.price > 0);

  if (plansLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
        <p className="text-muted-foreground">
          Upgrade anytime. Cancel whenever you want.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paidPlans?.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isPopular={plan.name === "Pro"}
            isCurrentPlan={currentPlanId === plan.id}
            currentPlanPrice={currentPlanPrice}
          />
        ))}
      </div>
    </div>
  );
}
