"use client";

import Link from "next/link";
import { useUsageSummary } from "@/lib/hooks/queries/subscriptions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSubscriptionWidget() {
  const { data: usage, isLoading } = useUsageSummary();

  if (isLoading || !usage) {
    return (
      <Skeleton className="h-24 w-full rounded-lg group-data-[collapsible=icon]:hidden" />
    );
  }

  const videoPercentage =
    usage.videoLimit > 0
      ? Math.min((usage.videosUsed / usage.videoLimit) * 100, 100)
      : 0;
  const minutesPercentage =
    usage.minutesLimit > 0
      ? Math.min((usage.minutesUsed / usage.minutesLimit) * 100, 100)
      : 0;
  const isVideoLimitCritical = usage.videosUsed >= usage.videoLimit * 0.8;
  const isMinutesLimitCritical = usage.minutesUsed >= usage.minutesLimit * 0.8;

  return (
    <Link
      href="/subscriptions/manage"
      className="block rounded-xl border p-3 space-y-3 group-data-[collapsible=icon]:hidden"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">
          {usage.planName} Plan
        </span>
        <Badge className=" px-1.5 py-0">
          {usage.videosUsed >= usage.videoLimit ? "Upgrade" : "Active"}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <span>Videos</span>
          <span
            className={isVideoLimitCritical ? "text-amber-600 font-medium" : ""}
          >
            {usage.videosUsed} / {usage.videoLimit}
          </span>
        </div>
        <Progress
          value={videoPercentage}
          className={
            isVideoLimitCritical ? "h-1.5 [&>div]:bg-amber-500" : "h-1.5"
          }
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <span>Minutes</span>
          <span
            className={
              isMinutesLimitCritical ? "text-amber-600 font-medium" : ""
            }
          >
            {usage.minutesUsed} / {usage.minutesLimit}
          </span>
        </div>
        <Progress
          value={minutesPercentage}
          className={
            isMinutesLimitCritical ? "h-1.5 [&>div]:bg-amber-500" : "h-1.5"
          }
        />
      </div>
    </Link>
  );
}
