import { Video } from "@/lib/api/types";
import {
  PlayCircleIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { Youtube } from "../icons/Youtube";

interface VideoCardProps {
  video: Video;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function VideoCard({ video }: VideoCardProps) {
  const hasTranscription = !!video.transcription;
  const hasAnalysis = !!video.analysis;

  return (
    <Link href={`/dashboard/videos/${video.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col p-0 gap-0">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video shrink-0 bg-muted">
          {video.thumbnail ? (
            <>
              <Image
                src={video.thumbnail}
                alt={video.title || "Video thumbnail"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <PlayCircleIcon className="size-10 text-white drop-shadow-lg opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <Youtube className="size-8 text-muted-foreground/50" />
            </div>
          )}

          {/* Duration overlay */}
          {typeof video.duration === "number" && (
            <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-sm sm:text-base font-semibold leading-5 sm:leading-6 line-clamp-2 mb-1">
            {video.title || "Untitled Video"}
          </h3>

          {video.author && (
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-2 truncate">
              <UserIcon className="size-3.5 shrink-0" />
              {video.author}
            </p>
          )}

          {video.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {video.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            <Badge
              variant="secondary"
              className={cn(
                "gap-1 transition-colors duration-300",
                hasTranscription
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground/60",
              )}
            >
              Transcription
            </Badge>

            <Badge
              variant="secondary"
              className={cn(
                "gap-1 transition-colors duration-300",
                hasAnalysis
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground/60",
              )}
            >
              Analysis
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
