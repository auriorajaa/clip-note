"use client";

import { useUserVideos } from "@/lib/hooks/queries/videos";
import { AlertCircleIcon, VideoOffIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { VideoCard } from "./video-card";

type FilterValue = "all" | "analyzed" | "transcribed";

const filters: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Analyzed", value: "analyzed" },
  { label: "Transcribed", value: "transcribed" },
];

export function MyVideo() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const { data: videos, isLoading, error } = useUserVideos();

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-500">
          Something went wrong while fetching your videos. Please try again
          later.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const filteredVideos = (videos ?? []).filter((video) => {
    if (filter === "all") return true;
    if (filter === "analyzed") return !!video.analysis;
    if (filter === "transcribed") return !!video.transcription;
    return video.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* Empty state */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <VideoOffIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {filter === "all"
              ? "You haven't uploaded any videos yet."
              : "No videos match this filter."}
          </p>
          {filter === "all" && (
            <Link href="/dashboard" className="inline-block mt-4">
              <Button className="gap-1.5">Upload your first video</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
