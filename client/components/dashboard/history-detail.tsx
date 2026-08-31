"use client";

import { useParams } from "next/navigation";
import { useJobStatus } from "@/lib/hooks/queries/videos";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Card } from "../ui/card";
import { JobCard } from "./job-card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export function HistoryDetail() {
  const { id } = useParams();
  const { data: job, isLoading, error } = useJobStatus(id as string);

  if (isLoading || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
        </div>
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Something went wrong when fetching the video status. Please try again
          later.
        </p>
        <Link href="/dashboard/history" className="mt-4 inline-block">
          <Button>
            <ArrowLeftIcon className="h-4 w-4" />
            Back to History
          </Button>
        </Link>
      </div>
    );
  }

  const hasTranscription = !!job.result?.transcription;
  const hasAnalysis = !!job.result?.analysis;
  const hasBoth = hasTranscription && hasAnalysis;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/history" className="inline-block">
        <Button className="gap-1.5 -ml-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to History
        </Button>
      </Link>

      <JobCard job={job} showDetails={false} />

      {job.state === "completed" && job.result && (
        <div className={cn("grid gap-6", hasBoth && "lg:grid-cols-2")}>
          {job.result.transcription && (
            <Card className="p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h3 className="font-medium">Transcription Preview</h3>
                {job.videoStatus?.hasTranscription && (
                  <Link href={`/dashboard/video/${job.videoStatus.id}`}>
                    <Button className="gap-1.5" size="sm">
                      View Transcription
                      <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex-1 min-h-40 max-h-64 sm:max-h-72 overflow-y-auto prose prose-sm">
                <p className="whitespace-pre-line text-muted-foreground">
                  {job.result.transcription.text.slice(0, 600)}
                  {job.result.transcription.text.length > 600 && "..."}
                </p>
              </div>
            </Card>
          )}

          {job.result.analysis && (
            <Card className="p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h3 className="font-medium">Analysis</h3>
                {job.videoStatus?.hasAnalysis && (
                  <Link href={`/dashboard/video/${job.videoStatus.id}`}>
                    <Button className="gap-1.5" size="sm">
                      View Analysis
                      <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="min-h-40 max-h-64 sm:max-h-72 overflow-y-auto prose prose-sm">
                <p className="whitespace-pre-line text-muted-foreground">
                  {job.result.analysis.summary.slice(0, 600)}
                  {job.result.analysis.summary.length > 600 && "..."}
                </p>
              </div>

              {job.result.analysis.topics.length > 0 && (
                <div className="mt-4 pt-4">
                  <h4 className="font-medium mb-2 text-sm">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.result.analysis.topics
                      .slice(0, 4)
                      .map((topic, index) => (
                        <Badge key={index}>{topic}</Badge>
                      ))}
                    {job.result.analysis.topics.length > 4 && (
                      <Badge>
                        +{job.result.analysis.topics.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
