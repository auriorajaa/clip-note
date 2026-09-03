"use client";

import { useState } from "react";
import { SubscriptionPlan } from "@/lib/api/types";
import {
  useChangeSubscriptionPlan,
  useCreateCheckoutSession,
} from "@/lib/hooks/queries/subscriptions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PricingCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  currentPlanPrice?: number;
}

function formatMinutes(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} minutes`;
}

export function PricingCard({
  plan,
  isPopular,
  isCurrentPlan,
  currentPlanPrice,
}: PricingCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate: createCheckout, isPending: isCheckoutPending } =
    useCreateCheckoutSession();
  const { mutate: changePlan, isPending: isChangePending } =
    useChangeSubscriptionPlan();

  const hasSubscription = currentPlanPrice !== undefined;
  const isUpgrade = hasSubscription && Number(plan.price) > currentPlanPrice;
  const isPending = isCheckoutPending || isChangePending;

  const handleSubscribe = () => {
    if (hasSubscription) {
      setDialogOpen(true);
      return;
    }
    createCheckout({ planId: plan.id });
  };

  const handleConfirmChange = () => {
    changePlan({ planId: plan.id });
    setDialogOpen(false);
  };

  return (
    <>
      <Card
        className={cn(
          "relative flex flex-col p-5 sm:p-6 transition-all duration-300",
          isPopular
            ? "border-2 border-primary shadow-lg lg:scale-[1.02]"
            : "border-2",
        )}
      >
        {isPopular && (
          <Badge className="absolute top-3 left-1/2 -translate-x-1/2 gap-1 bg-primary text-primary-foreground whitespace-nowrap">
            Most Popular
          </Badge>
        )}
        <div className="space-y-2 mb-6">
          <h3 className="text-base sm:text-lg font-semibold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground min-h-[2.5rem] sm:min-h-10">
            {plan.description}
          </p>
        </div>
        <div className="mb-6">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight">
            ${Number(plan.price).toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            /{plan.billingInterval === "monthly" ? "mo" : "yr"}
          </span>
        </div>
        <ul className="space-y-3 mb-6 flex-1">
          <li className="flex items-center gap-2 text-sm">
            <CheckIcon className="size-4 text-primary shrink-0" />
            <span className="break-words">
              {plan.videoLimit} videos per month
            </span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckIcon className="size-4 text-primary shrink-0" />
            <span className="break-words">
              Up to {formatMinutes(plan.minutesLimit)} of processing
            </span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckIcon className="size-4 text-primary shrink-0" />
            <span className="break-words">
              AI-powered transcription & analysis
            </span>
          </li>
        </ul>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleSubscribe}
            disabled={isPending}
          >
            {isPending
              ? "Updating..."
              : hasSubscription
                ? isUpgrade
                  ? "Upgrade"
                  : "Downgrade"
                : "Subscribe"}
          </Button>
        )}
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUpgrade
                ? `Upgrade to ${plan.name}?`
                : `Downgrade to ${plan.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isUpgrade
                ? "Stripe will charge a prorated amount for the remainder of this billing period."
                : "Your current plan remains active until the end of this billing period."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChange}
              disabled={isPending}
            >
              {isPending ? "Updating..." : isUpgrade ? "Upgrade" : "Downgrade"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
