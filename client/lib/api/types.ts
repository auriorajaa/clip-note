export interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface VideoInfo {
  title: string;
  description: string;
  duration: number;
  author: string;
  videoUrl: string;
  thumbnail: string;
  url: string;
}

export interface VideoStatus {
  id: number;
  status: string;
  hasTranscription: boolean;
  hasAnalysis: boolean;
}

export interface JobStatus {
  id: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  result?: {
    videoInfo?: VideoInfo;
    transcription?: {
      text: string;
      segments: Array<{
        start: number;
        end: number;
        text: string;
      }>;
    };
    analysis?: {
      summary: string;
      keyPoints: string[];
      topics: string[];
      suggestedTags: string[];
    };
    error?: string;
    final?: boolean;
  };
  failedReason?: string;
  attemptsMade: number;
  videoStatus?: VideoStatus;
  final: boolean;
}

export interface VideoSubmissionRequest {
  url: string;
}

export interface VideoSubmissionResponse {
  jobId: string;
  videoInfo: VideoInfo;
  message: string;
}

export interface JobsListResponse {
  jobs: JobStatus[];
}

export interface VideoTranscription {
  text: string;
  confidence: number;
  isMusic: boolean;
  createdAt: string;
}

export interface VideoAnalysis {
  summary: string;
  keyPoints: string[];
  sentiment: string;
  topics: string[];
  suggestedTags: string[];
  createdAt: string;
}

export interface Video {
  id: number;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  author: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  transcription: VideoTranscription | null;
  analysis: VideoAnalysis | null;
}
