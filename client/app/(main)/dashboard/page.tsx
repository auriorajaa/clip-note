"use client";

import VideoSubmissionForm from "@/components/dashboard/video-submission-form";
import InProgressPreview from "@/components/dashboard/in-progress-preview";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Enter Youtube URL to Start
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Enter your Youtube URL destination to started. Our AI will analyze the
          video and provide a deep insight about it.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <VideoSubmissionForm />
        </div>

        <div>
          <InProgressPreview />
        </div>
      </div>
    </div>
  );
}
