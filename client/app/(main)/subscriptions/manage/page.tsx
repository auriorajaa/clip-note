"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useUserSubscription,
  useCancelSubscription,
  useResumeSubscription,
} from "@/lib/hooks/queries/subscriptions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarIcon, VideoIcon } from "lucide-react";
import { toast } from "sonner";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ManageSubscriptionPage() {
  const { data: subscription, isLoading } = useUserSubscription();
  const { mutate: cancelSub, isPending: isCancelling } =
    useCancelSubscription();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate: resumeSub, isPending: isResuming } =
    useResumeSubscription();

  const handleResume = () => {
    resumeSub(undefined, {
      onSuccess: () => toast.success("Subscription cancellation has been resumed"),
      onError: (error) => {
        toast.error("Failed to resume subscription", {
          description: error?.message || "Please try again.",
        });
      },
    });
  };
  const handleCancel = () => {
    cancelSub(undefined, {
      onSuccess: () => {
        toast.success(
          "Subscription will be cancelled at the end of the current period",
        );
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to cancel subscription", {
          description: error?.message || "Please try again.",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="mx-auto">
        <Card className="p-8 text-center space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">No active subscription</h1>
            <p className="text-sm text-muted-foreground">
              You&apos;re currently on the free tier. Upgrade anytime to unlock
              higher limits.
            </p>
          </div>
          <Link href="/subscriptions">
            <Button>View Plans</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const videoUsagePercent = Math.min(
    (subscription.videosUsed / subscription.plan.videoLimit) * 100,
    100,
  );
  const minutesUsagePercent = Math.min(
    (subscription.minutesUsed / subscription.plan.minutesLimit) * 100,
    100,
  );
  const isCancelling_ = !!subscription.cancelAt;

  return (
    <div className=" mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manage Subscription
        </h1>
        <p className="text-sm text-muted-foreground">
          View your plan details and usage.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold">
                {subscription.plan.name}
              </h2>
              <Badge
                variant="outline"
                className={
                  subscription.status === "active"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800"
                }
              >
                {subscription.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ${Number(subscription.plan.price).toFixed(2)}/
              {subscription.plan.billingInterval === "monthly" ? "mo" : "yr"}
            </p>
          </div>
        </div>

        {subscription.pendingPlan && subscription.pendingChangeAt && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            Your plan will change to {subscription.pendingPlan.name} on {formatDate(subscription.pendingChangeAt)}. You can choose another plan before then.
          </div>
        )}
        {isCancelling_ ? (
          <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-amber-700 dark:text-amber-300">
            <CalendarIcon className="size-4 shrink-0" />
            Your subscription will end on{" "}
            {formatDate(subscription.currentPeriodEnd)}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="size-4 shrink-0" />
            Renews on {formatDate(subscription.currentPeriodEnd)}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <VideoIcon className="size-3.5" />
                Videos used
              </span>
              <span className="font-medium">
                {subscription.videosUsed} / {subscription.plan.videoLimit}
              </span>
            </div>
            <Progress value={videoUsagePercent} className="h-2" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minutes used</span>
              <span className="font-medium">
                {subscription.minutesUsed} / {subscription.plan.minutesLimit}
              </span>
            </div>
            <Progress value={minutesUsagePercent} className="h-2" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          <Link href="/subscriptions" className="flex-1 pt-4">
            <Button variant="outline" className="w-full">
              Change Plan
            </Button>
          </Link>

          {isCancelling_ ? (
            <div className="flex-1 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResume}
                disabled={isResuming}
              >
                {isResuming ? "Resuming..." : "Resume Subscription"}
              </Button>
            </div>
          ) : (
            <div className="flex-1 pt-4">
              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive" className="w-full">
                      Cancel Subscription
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Cancel your subscription?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll keep access until{" "}
                      {formatDate(subscription.currentPeriodEnd)}, after which
                      you&apos;ll be moved to the free tier.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
