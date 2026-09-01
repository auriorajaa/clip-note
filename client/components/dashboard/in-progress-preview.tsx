"use client";

import Link from "next/link";
import { useAllJobs } from "@/lib/hooks/queries/videos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";

export default function InProgressPreview() {
  const { data, isLoading } = useAllJobs();

  const inProgressJobs = data?.jobs.filter(
    (job) => job.state === "active" || job.state === "waiting",
  );
  const latestJob = inProgressJobs?.[0];
  const remainingCount = (inProgressJobs?.length ?? 0) - 1;

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!latestJob) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center h-full min-h-64">
        <p className="text-sm font-medium mb-1">Nothing in progress</p>
        <p className="text-xs text-muted-foreground">
          Submit a YouTube URL to see it processing here.
        </p>
      </Card>
    );
  }

  const videoInfo = latestJob.result?.videoInfo;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Loader2Icon className="size-4 animate-spin text-blue-500" />
          In Progress
        </h3>
        {remainingCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{remainingCount} more
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium line-clamp-2">
          {videoInfo?.title || "Processing video..."}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{latestJob.state === "waiting" ? "Queued" : "Processing"}</span>
          <span className="font-medium">{latestJob.progress.toFixed(0)}%</span>
        </div>

        <Progress value={latestJob.progress} className="h-1.5" />
      </div>

      <Link href="/dashboard/history" className="block">
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          View All
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </Link>
    </Card>
  );
}
