"use client";

import { useState } from "react";
import { useAllJobs } from "@/lib/hooks/queries/videos";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard } from "@/components/dashboard/job-card";

const statusLabels: Record<string, string> = {
  all: "All",
  active: "Active",
  delayed: "Waiting",
  completed: "Completed",
  failed: "Failed",
};

export default function VideoHistory() {
  const [filter, setFilter] = useState<string>("all");
  const { data, isLoading, error, refetch } = useAllJobs();

  // Handle error state
  if (error) {
    return (
      <div
        className={
          "flex flex-col items-center justify-center min-h-[400px] gap-4"
        }
      >
        <h2 className={"text-2xl font-bold"}>Oops!</h2>
        <p className={"text-gray-500"}>
          Something wrong happened when fetching video history.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // If the data is still loading or not available, display skeleton loaders
  if (isLoading || !data) {
    return (
      <div className={"space-y-4"}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card className={"p-4"} key={i}>
            <div className={"flex items-center justify-between"}>
              <div className={"space-y-2"}>
                <Skeleton className={"h-4 w-[200px]"} />
                <Skeleton className={"h-3 w-[150px]"} />
              </div>
              <Skeleton className={"h-8 w-[100px]"} />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // If there are no in progress jobs, display a message and a button to upload a video
  if (!data.jobs?.length) {
    return (
      <div
        className={
          "flex flex-col items-center justify-center min-h-[400px] gap-4"
        }
      >
        <h2 className={"text-2xl font-bold"}>No in progress videos</h2>
        <p className={"text-gray-500"}>
          You have no in progress videos. Start by uploading a video.
        </p>
        <Button>
          <Link href={"/dashboard"}>Upload Video</Link>
        </Button>
      </div>
    );
  }

  // Filter the jobs based on the selected filter
  const filteredJobs = data.jobs.filter((job) => {
    if (filter === "all") return true;

    // If the filter is "active", include jobs that are either "active" or "waiting"
    if (filter === "active")
      return job.state === "active" || job.state === "waiting";
    return job.state === filter;
  });

  return (
    <div className={"space-y-6"}>
      <div className={"flex items-center justify-between"}>
        <div>
          <h1 className={"text-2xl font-bold tracking-tight"}>
            Your in Progress YouTube Videos
          </h1>
          <p className={"text-muted-foreground"}>
            Track the progress of your uploaded videos. Please be patient as
            processing may take some time.
          </p>
        </div>

        <Select
          value={filter}
          onValueChange={(value) => setFilter(value ?? "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status">
              {statusLabels[filter] ?? "Filter by status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
