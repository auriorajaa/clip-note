"use client";

import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Link2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoFormValues, videoSchema } from "@/lib/validations/videos";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitVideo } from "@/lib/api/videos";
import { toast } from "sonner";

export default function VideoSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const safeTitle = (title: string) => {
    if (!title) return "Untitled video";
    return title.length > 50 ? `${title.slice(0, 47)}...` : title;
  };

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      url: "",
    },
  });

  const { mutate } = useMutation({
    mutationFn: submitVideo,
    onSuccess: (data) => {
      toast.success("Video submitted successfully!", {
        description: `${safeTitle(data.videoInfo.title)} is being processed. You can view it in your videos list.`,
        classNames: {
          toast: "max-w-[420px]",
          description: "break-words line-clamp-2",
        },
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error("Failed to submit video", {
        description: error?.message || "An unexpected error occurred.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: VideoFormValues) => {
    setIsSubmitting(true);
    mutate(data);
  };

  return (
    <Card className="max-w-2xl p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Youtube URL</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <Link2Icon className="size-4" />
                    </div>
                    <Input
                      className="pl-10"
                      placeholder="https://www.youtube.com/watch?v=abcde123ABC"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full transition-all"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
