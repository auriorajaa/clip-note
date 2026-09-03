"use client";

import { useAuth } from "@/lib/hooks/auth";
import {
  useUserSubscription,
  useUsageSummary,
} from "@/lib/hooks/queries/subscriptions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  MailIcon,
} from "lucide-react";
import Link from "next/link";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } =
    useUserSubscription();
  const { data: usage, isLoading: usageLoading } = useUsageSummary();

  const isLoading = userLoading || subscriptionLoading || usageLoading;

  if (isLoading || !user) {
    return (
      <div className="mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    );
  }

  const videoUsagePercent =
    usage && usage.videoLimit > 0
      ? Math.min((usage.videosUsed / usage.videoLimit) * 100, 100)
      : 0;
  const minutesUsagePercent =
    usage && usage.minutesLimit > 0
      ? Math.min((usage.minutesUsed / usage.minutesLimit) * 100, 100)
      : 0;

  return (
    <div className="mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details and subscription.
        </p>
      </div>

      {/* Account info */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-semibold truncate">{user.name}</h2>
              {user.isEmailVerified && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <CheckCircle2Icon className="size-3" />
                  Verified
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <MailIcon className="size-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                Joined {formatDate(user.createdAt)}
              </span>
              {user.lastLoginAt && (
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  Last login {formatDate(user.lastLoginAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription & usage */}
      <Card className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">
              {subscription
                ? subscription.plan.name
                : (usage?.planName ?? "Free")}{" "}
              Plan
            </h3>
            {subscription && (
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
            )}
          </div>

          <Link
            href={subscription ? "/subscriptions/manage" : "/subscriptions"}
          >
            <Button variant="outline" size="sm">
              {subscription ? "Manage Plan" : "Upgrade Plan"}
            </Button>
          </Link>
        </div>

        {usage && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  Videos used
                </span>
                <span className="font-medium">
                  {usage.videosUsed} / {usage.videoLimit}
                </span>
              </div>
              <Progress value={videoUsagePercent} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minutes used</span>
                <span className="font-medium">
                  {usage.minutesUsed} / {usage.minutesLimit}
                </span>
              </div>
              <Progress value={minutesUsagePercent} className="h-2" />
            </div>
          </div>
        )}

        {subscription && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {subscription.cancelAt
              ? `Ends on ${formatDate(subscription.currentPeriodEnd)}`
              : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
          </div>
        )}
      </Card>
    </div>
  );
}
