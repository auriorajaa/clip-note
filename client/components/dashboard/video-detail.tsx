"use client";

import { useVideoById } from "@/lib/hooks/queries/videos";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeftIcon, CheckIcon, CopyIcon, UserIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import { Youtube } from "../icons/Youtube";

const statusStyles: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  processing:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  completed:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  failed:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <CheckIcon className="size-3.5 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <CopyIcon className="size-3.5" />
          Copy
        </>
      )}
    </Button>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card className="p-4 gap-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-lg font-semibold", valueClassName)}>{value}</div>
    </Card>
  );
}

export default function VideoDetail() {
  const { id } = useParams();
  const { data: video, isLoading, error } = useVideoById(id as string);

  if (isLoading || !video) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Something went wrong while fetching this video. Please try again
          later.
        </p>
        <Link href="/dashboard/videos" className="mt-4 inline-block">
          <Button>
            <ArrowLeftIcon className="h-4 w-4" />
            Back to My Videos
          </Button>
        </Link>
      </div>
    );
  }

  const hasTranscription = !!video.transcription;
  const hasAnalysis = !!video.analysis;
  const defaultTab = hasTranscription ? "transcription" : "analysis";

  return (
    <div className="space-y-6">
      <Link href="/dashboard/videos" className="inline-block">
        <Button className="gap-1.5 -ml-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to My Videos
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
        {/* Sidebar — sticky, video info */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <Card className="p-0 gap-0 overflow-hidden">
            <div className="relative w-full aspect-video shrink-0 bg-muted">
              {video.thumbnail ? (
                <Image
                  src={video.thumbnail}
                  alt={video.title || "Video thumbnail"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <Youtube className="size-10 text-muted-foreground/50" />
                </div>
              )}
              {typeof video.duration === "number" && (
                <span className="absolute bottom-3 right-3 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
                  {formatDuration(video.duration)}
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2 flex-wrap">
                <h1 className="text-base font-semibold leading-6 flex-1">
                  {video.title || "Untitled Video"}
                </h1>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  statusStyles[video.status?.toLowerCase()] ??
                    statusStyles.pending,
                )}
              >
                {video.status}
              </Badge>

              {video.author && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserIcon className="size-4" />
                  {video.author}
                </div>
              )}

              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {video.description}
                </p>
              )}

              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full gap-1.5">
                  <Youtube className="size-4" />
                  Watch on YouTube
                </Button>
              </a>
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="space-y-6 min-w-0">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Duration"
              value={
                typeof video.duration === "number"
                  ? formatDuration(video.duration)
                  : "—"
              }
            />
            <StatCard
              label="Confidence"
              value={
                video.transcription &&
                typeof video.transcription.confidence === "number"
                  ? `${Math.round(video.transcription.confidence * 100)}%`
                  : "—"
              }
            />
            <StatCard
              label="Sentiment"
              value={video.analysis?.sentiment ?? "—"}
              valueClassName={cn(
                "capitalize",
                video.analysis?.sentiment === "positive" &&
                  "text-emerald-600 dark:text-emerald-400",
                video.analysis?.sentiment === "negative" &&
                  "text-red-600 dark:text-red-400",
              )}
            />
            <StatCard
              label="Topics"
              value={video.analysis?.topics?.length ?? 0}
            />
          </div>

          {!hasTranscription && !hasAnalysis ? (
            <div className="text-center py-16 border-2 border-dashed rounded-2xl">
              <p className="text-muted-foreground">
                No transcription or analysis available for this video yet.
              </p>
            </div>
          ) : (
            <Tabs defaultValue={defaultTab}>
              <TabsList>
                {hasTranscription && (
                  <TabsTrigger value="transcription" className="gap-1.5">
                    Transcription
                  </TabsTrigger>
                )}
                {hasAnalysis && (
                  <TabsTrigger value="analysis" className="gap-1.5">
                    Analysis
                  </TabsTrigger>
                )}
              </TabsList>

              {video.transcription && (
                <TabsContent value="transcription">
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {video.transcription.isMusic ? (
                        <Badge variant="secondary">Music detected</Badge>
                      ) : (
                        <span />
                      )}
                      <CopyButton text={video.transcription.text} />
                    </div>

                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                        {video.transcription.text}
                      </p>
                    </div>
                  </Card>
                </TabsContent>
              )}

              {video.analysis && (
                <TabsContent value="analysis" className="space-y-6">
                  <Card className="p-4 sm:p-6">
                    <h3 className="font-medium">Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {video.analysis.summary}
                    </p>
                  </Card>

                  {video.analysis.keyPoints?.length > 0 && (
                    <Card className="p-4 sm:p-6">
                      <h3 className="font-medium">Key Points</h3>
                      <ul className="space-y-2">
                        {video.analysis.keyPoints.map((point, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-primary font-medium shrink-0">
                              {index + 1}.
                            </span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    {video.analysis.topics?.length > 0 && (
                      <Card className="p-4 sm:p-6">
                        <h3 className="font-medium text-sm">Topics</h3>
                        <div className="flex flex-wrap gap-2">
                          {video.analysis.topics.map((topic, index) => (
                            <Badge key={index}>{topic}</Badge>
                          ))}
                        </div>
                      </Card>
                    )}

                    {video.analysis.suggestedTags?.length > 0 && (
                      <Card className="p-4 sm:p-6">
                        <h3 className="font-medium text-sm">Suggested Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {video.analysis.suggestedTags.map((tag, index) => (
                            <Badge key={index}>{tag}</Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
