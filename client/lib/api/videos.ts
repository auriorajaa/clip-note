import {
    ApiResponse,
    JobsListResponse,
    JobStatus,
    Video,
    VideoSubmissionRequest,
    VideoSubmissionResponse
} from "@/lib/api/types";
import {apiClient} from "@/lib/api/client";

export const submitVideo = async (data: VideoSubmissionRequest): Promise<VideoSubmissionResponse> => {
    const response = await apiClient.post<ApiResponse<VideoSubmissionResponse>>(
        "/videos/transcribe",
        data
    );

    return response.data.data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
    const response = await apiClient.get<ApiResponse<JobStatus>>(
        `/videos/transcribe/${jobId}/status`,
    );

    return response.data.data;
};

export const getAllJobs = async (): Promise<JobsListResponse> => {
    const response = await apiClient.post<ApiResponse<JobsListResponse>>(
        "/videos/jobs/running"
    );

    return response.data.data;
};

export const getUserVideos = async (): Promise<Video[]> => {
    const response = await apiClient.get<ApiResponse<Video[]>>(
        "/videos"
    );

    return response.data.data;
};

export const getVideoById = async (videoId: string): Promise<Video> => {
    const response = await apiClient.get<ApiResponse<Video>>(
        `/videos/${videoId}`
    );

    return response.data.data;
};
