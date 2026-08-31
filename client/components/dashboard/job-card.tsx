import { JobStatus } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Clock2Icon,
  ClockIcon,
  Loader2Icon,
  PlayCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Youtube } from "../icons/Youtube";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

interface JobCardProps {
  job: JobStatus & { thumbnail?: string };
  showDetails?: boolean;
}

const stateColors = {
  waiting:
    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
  active: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
  completed:
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900",
  failed: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
  delayed:
    "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900",
};

const stateIconColors = {
  waiting: "text-amber-500 dark:text-amber-400",
  active: "text-blue-500 dark:text-blue-400",
  completed: "text-emerald-500 dark:text-emerald-400",
  failed: "text-red-500 dark:text-red-400",
  delayed: "text-orange-500 dark:text-orange-400",
};

const stateBadgeStyles = {
  waiting:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  active:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  completed:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  failed:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
  delayed:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800",
};

const stateMessages = {
  waiting: "Your video is in the queue and will start processing shortly.",
  active: "Processing your video — this may take a few minutes.",
  completed: "Your video has been successfully processed and is ready to view.",
  failed: "Something went wrong while processing this video. Please try again.",
  delayed: "This job has been delayed and will retry automatically.",
};

const StateIcons = ({
  state,
  className,
}: {
  state: JobStatus["state"];
  className?: string;
}) => {
  const icons = {
    completed: CheckCircle2Icon,
    failed: XCircleIcon,
    active: Loader2Icon,
    waiting: ClockIcon,
    delayed: AlertCircleIcon,
  };

  const Icon = icons[state as keyof typeof icons] || Clock2Icon;

  return (
    <Icon
      className={cn(
        "transition-all duration-300",
        stateIconColors[state as keyof typeof stateIconColors],
        state === "active" && "animate-spin",
        className,
      )}
    />
  );
};

export function JobCard({ job, showDetails = true }: JobCardProps) {
  const videoInfo = job.result?.videoInfo;
  const isProcessing = job.state === "active" || job.state === "waiting";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        stateColors[job.state],
        "border-2",
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-6">
          {/* Thumbnail */}
          <div className="relative shrink-0">
            <div className="h-20 w-32 rounded-lg overflow-hidden">
              {job.thumbnail || videoInfo ? (
                <div className="relative size-full">
                  <Image
                    src={job.thumbnail || "https://placehold.net/400x400.png"}
                    alt="Video thumbnail"
                    fill
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <PlayCircleIcon className="size-8 text-primary-foreground drop-shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                  <div className="absolute inset-0 opacity-60" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <Youtube className="size-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="absolute -right-1 -bottom-1 p-1.5 rounded-full shadow-sm bg-primary-foreground border-2 border-primary-foreground">
              <StateIcons state={job.state} className="size-5" />
            </div>
          </div>

          {/* Content section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-semibold leading-6 truncate">
                {videoInfo?.title || "Untitled Video"}
              </h3>
              <Badge
                variant={"secondary"}
                className={cn(
                  "capitalize transition-colors duration-300",
                  stateBadgeStyles[job.state],
                )}
              >
                {job.state}
              </Badge>
            </div>

            {videoInfo?.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                {videoInfo.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {videoInfo && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock2Icon className="size-4" />
                    {Math.floor(videoInfo.duration / 60)} min
                  </span>
                  <span className="text-muted-foreground/30">●</span>
                </>
              )}

              <span>{stateMessages[job.state]}</span>

              {job.attemptsMade > 0 && (
                <>
                  <span className="text-muted-foreground/30">●</span>
                  <span className="text-muted-foreground/90">
                    Attempts: {job.attemptsMade}/3
                  </span>
                </>
              )}
            </div>

            {/* Progress bar */}
            {isProcessing && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {job.state === "active" ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2Icon className="size-4 text-green-500" />
                    )}

                    <span className="text-muted-foreground/75">
                      {job.state === "waiting" ? "Queued" : "Processing"}
                    </span>
                  </div>
                  <span className="font-medium text-muted-foreground/90">
                    {job.progress.toFixed(2)}%
                  </span>
                </div>
                <Progress value={job.progress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
