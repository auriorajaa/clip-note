import {useQuery} from "@tanstack/react-query";
import {getAllJobs, getJobStatus, getUserVideos, getVideoById} from "@/lib/api/videos";
import {JobStatus, Video} from "@/lib/api/types";

export function useAllJobs() {
    return useQuery({
        queryKey: ["jobs"],
        queryFn: getAllJobs,
        // Poll every 5 seconds to get the latest job status
        refetchInterval: 5000,
    });
}

export function useJobStatus(jobId: string) {
    return useQuery({
        queryKey: ["job-status", jobId],
        queryFn: () => getJobStatus(jobId),
        refetchInterval: (query) => {
            const data = query.state.data as JobStatus | undefined;

            // If the job is still running (waiting or active), poll every 3 seconds. Otherwise, stop polling.
            if (data?.state === "waiting" || data?.state === "active") {
                return 3000; // Poll every 3 seconds if the job is still running
            }

            return false; // Stop polling if the job is completed or failed
        },
        staleTime: 0, // Data is considered stale immediately, so it will always refetch when the component mounts
        refetchOnWindowFocus: true,
    });
}

export function useUserVideos() {
    return useQuery<Video[]>({
        queryKey: ["videos"],
        queryFn: getUserVideos
    });
}

export function useVideoById(videoId: string) {
    return useQuery<Video>({
        queryKey: ["video", videoId],
        queryFn: () => getVideoById(videoId),
        enabled: !!videoId, // Only run the query if videoId is provided
    });
}